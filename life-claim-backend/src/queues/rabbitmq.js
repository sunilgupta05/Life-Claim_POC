const amqplib = require('amqplib');
const dotenv = require('dotenv');

dotenv.config();

let connection;
let channel;

/**
 * amqplib expects amqp(s)://… (broker, usually port 5672).
 * If RABBITMQ_URL is the management UI (http…:15672/), use the same host for AMQP.
 */
function resolveRabbitAmqpUrl() {
  const raw = (process.env.RABBITMQ_URL || '').trim();
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
  const amqpPort = (process.env.RABBITMQ_AMQP_PORT || '5672').trim();
  const user = process.env.RABBITMQ_USER || 'guest';
  const pass = process.env.RABBITMQ_PASS || 'guest';
  return `amqp://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${amqpPort}`;
}

const getChannel = async () => {
  if (channel) {
    return channel;
  }

  const url = resolveRabbitAmqpUrl();

  connection = await amqplib.connect(url);
  channel = await connection.createChannel();

  connection.on('error', (err) => {
    console.error('RabbitMQ connection error:', err.message || err);
    channel = undefined;
    connection = undefined;
  });

  connection.on('close', () => {
    console.warn('RabbitMQ connection closed');
    channel = undefined;
    connection = undefined;
  });

  return channel;
};

/**
 * @returns {Promise<boolean>} true if message was published to the queue
 */
const publishToQueue = async (queueName, message) => {
  try {
    const ch = await getChannel();
    await ch.assertQueue(queueName, {
      durable: true,
    });
    const payload = Buffer.from(JSON.stringify(message));
    const ok = ch.sendToQueue(queueName, payload, {
      persistent: true,
    });
    if (!ok) {
      console.warn(`RabbitMQ publish warning: queue ${queueName} may be saturated`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('RabbitMQ publish error:', err.message || err);
    return false;
  }
};

const consumeQueue = async (queueName, handler) => {
  const ch = await getChannel();
  await ch.assertQueue(queueName, {
    durable: true,
  });

  console.log(`RabbitMQ consumer listening on queue: ${queueName}`);

  ch.consume(
    queueName,
    async (msg) => {
      if (!msg) return;
      try {
        const content = msg.content.toString();
        const payload = JSON.parse(content);
        await handler(payload);
        ch.ack(msg);
      } catch (err) {
        console.error('RabbitMQ consumer handler error:', err.message || err);
        // Nack with requeue=false so bad messages do not loop forever
        ch.nack(msg, false, false);
      }
    },
    {
      noAck: false,
    }
  );
};

module.exports = {
  publishToQueue,
  consumeQueue,
};

