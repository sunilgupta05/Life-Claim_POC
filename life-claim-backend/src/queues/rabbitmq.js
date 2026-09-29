const logger = require('../util/logger');
const amqplib = require('amqplib');
const appConfig = require('../config/configService');
const { run } = require('../util/resilience');
const dotenv = require('dotenv');

dotenv.config();

let connection;
let channel; // a CONFIRM channel (publisher confirms) — see getChannel()

// ---- reliability topology (roadmap 3.6) ------------------------------------
// For a base queue `q` we build:
//   q            main work queue (durable) — the worker consumes here.
//   q.retry      holding queue with a TTL; on expiry it dead-letters BACK to `q`
//                so a failed message is retried after a backoff delay.
//   q.dlq        dead-letter "parking lot" (durable) — messages that exhausted
//                their retries land here for manual inspection instead of being
//                silently dropped.
// A per-message `x-retry-count` header bounds the number of attempts. This makes
// the async notification path RELIABLE (the primary mechanism) rather than
// best-effort fire-and-forget.
const RETRY_SUFFIX = '.retry';
const DLQ_SUFFIX = '.dlq';

const maxRetries = () => appConfig.getNumber('RABBITMQ_MAX_RETRIES', 3);
const retryDelayMs = () => appConfig.getNumber('RABBITMQ_RETRY_DELAY_MS', 10000);
const prefetch = () => appConfig.getNumber('RABBITMQ_PREFETCH', 10);

/** Names of the auxiliary queues derived from a base queue name. */
const retryQueue = (q) => `${q}${RETRY_SUFFIX}`;
const dlqQueue = (q) => `${q}${DLQ_SUFFIX}`;

/**
 * Pure retry decision (unit-tested): given the current headers and the max, decide
 * whether the next failure should be retried or dead-lettered, and the next count.
 * @returns {{ action: 'retry'|'deadletter', retryCount: number }}
 */
function nextDelivery(headers, max) {
  const current = Number(headers && headers['x-retry-count']) || 0;
  if (current >= max) return { action: 'deadletter', retryCount: current };
  return { action: 'retry', retryCount: current + 1 };
}

/**
 * amqplib expects amqp(s)://… (broker, usually port 5672).
 * If RABBITMQ_URL is the management UI (http…:15672/), use the same host for AMQP.
 */
function resolveRabbitAmqpUrl() {
  const raw = (appConfig.get('RABBITMQ_URL') || '').trim();
  if (!raw) {
    throw new Error('RABBITMQ_URL is not configured in environment');
  }
  if (/^amqps?:\/\//i.test(raw)) {
    return raw;
  }
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('RABBITMQ_URL must be amqp(s)://… or http(s)://… (e.g. management UI)');
  }
  const host = parsed.hostname;
  if (!host) {
    throw new Error('RABBITMQ_URL has no hostname');
  }
  const amqpPort = (appConfig.get('RABBITMQ_AMQP_PORT') || '5672').trim();
  const user = process.env.RABBITMQ_USER || 'guest';
  const pass = process.env.RABBITMQ_PASS || 'guest';
  return `amqp://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${amqpPort}`;
}

const getChannel = async () => {
  if (channel) {
    return channel;
  }

  const url = resolveRabbitAmqpUrl();

  // Resilient connect (roadmap 3.1): a socket timeout + circuit breaker so a dead
  // broker fails fast instead of hanging the caller/worker indefinitely.
  const timeout = appConfig.getNumber('RABBITMQ_TIMEOUT_MS', 10000);
  connection = await run('rabbitmq', () => amqplib.connect(url, { timeout }), { timeout });
  // Confirm channel (roadmap 3.6): publishes wait for a broker ack so we never
  // report success for a message the broker didn't persist.
  channel = await connection.createConfirmChannel();

  connection.on('error', (err) => {
    logger.error('RabbitMQ connection error:', err.message || err);
    channel = undefined;
    connection = undefined;
  });

  connection.on('close', () => {
    logger.warn('RabbitMQ connection closed');
    channel = undefined;
    connection = undefined;
  });

  return channel;
};

/**
 * Declare the reliability topology for a base queue (idempotent). The MAIN queue
 * is declared durable with NO custom arguments so it stays compatible with any
 * pre-existing `notifications` queue (avoids PRECONDITION_FAILED). Retry/DLQ are
 * new auxiliary queues.
 */
async function assertTopology(ch, baseQueue) {
  await ch.assertQueue(baseQueue, { durable: true });
  await ch.assertQueue(dlqQueue(baseQueue), { durable: true });
  await ch.assertQueue(retryQueue(baseQueue), {
    durable: true,
    arguments: {
      'x-message-ttl': retryDelayMs(),
      // On TTL expiry, dead-letter back to the main queue (default exchange).
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': baseQueue,
    },
  });
}

/**
 * Publish a message to a queue with publisher confirms (roadmap 3.6).
 * @returns {Promise<boolean>} true only once the broker has ACKed the message.
 */
const publishToQueue = async (queueName, message, opts = {}) => {
  try {
    const ch = await getChannel();
    await assertTopology(ch, queueName);
    const payload = Buffer.from(JSON.stringify(message));
    // sendToQueue on a confirm channel takes a callback fired on broker ack/nack.
    const confirmed = await new Promise((resolve) => {
      const ok = ch.sendToQueue(
        queueName,
        payload,
        { persistent: true, headers: opts.headers || {} },
        (err) => resolve(!err)
      );
      // If the local buffer is full, ok=false; the callback still fires on ack.
      if (!ok) {
        logger.warn(`RabbitMQ publish backpressure on queue ${queueName}`);
      }
    });
    if (!confirmed) {
      logger.error(`RabbitMQ broker did not confirm message on queue ${queueName}`);
    }
    return confirmed;
  } catch (err) {
    logger.error('RabbitMQ publish error:', err.message || err);
    return false;
  }
};

/**
 * Consume a queue with bounded retries + dead-lettering (roadmap 3.6). On handler
 * success the message is ACKed. On failure it is retried (via the .retry queue,
 * after a TTL backoff) up to RABBITMQ_MAX_RETRIES times; once exhausted it is
 * parked on the .dlq queue with error metadata. Messages are never silently lost.
 */
const consumeQueue = async (queueName, handler) => {
  const ch = await getChannel();
  await assertTopology(ch, queueName);
  await ch.prefetch(prefetch());

  logger.info(`RabbitMQ consumer listening on queue: ${queueName} (retries=${maxRetries()}, backoff=${retryDelayMs()}ms)`);

  ch.consume(
    queueName,
    async (msg) => {
      if (!msg) return;
      const headers = msg.properties.headers || {};
      try {
        const content = msg.content.toString();
        const payload = JSON.parse(content);
        await handler(payload);
        ch.ack(msg);
      } catch (err) {
        const { action, retryCount } = nextDelivery(headers, maxRetries());
        if (action === 'retry') {
          logger.warn(`RabbitMQ handler failed on ${queueName}; retry ${retryCount}/${maxRetries()}: ${err.message || err}`);
          // Route to the retry queue; it dead-letters back after the TTL backoff.
          ch.sendToQueue(retryQueue(queueName), msg.content, {
            persistent: true,
            headers: { ...headers, 'x-retry-count': retryCount },
          });
        } else {
          logger.error(`RabbitMQ message exhausted ${maxRetries()} retries on ${queueName}; dead-lettering: ${err.message || err}`);
          ch.sendToQueue(dlqQueue(queueName), msg.content, {
            persistent: true,
            headers: {
              ...headers,
              'x-retry-count': retryCount,
              'x-error': String(err && err.message ? err.message : err).slice(0, 500),
              'x-failed-queue': queueName,
            },
          });
        }
        // Ack the original either way — its fate (retry/DLQ) is now decided and
        // persisted, so we must not requeue it here (that would double-deliver).
        ch.ack(msg);
      }
    },
    { noAck: false }
  );
};

module.exports = {
  publishToQueue,
  consumeQueue,
  // exported for reuse/tests (roadmap 3.6)
  nextDelivery,
  retryQueue,
  dlqQueue,
  assertTopology,
};
