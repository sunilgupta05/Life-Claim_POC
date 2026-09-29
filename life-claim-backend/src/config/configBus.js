// src/config/configBus.js
//
// Cross-instance cache-invalidation bus for the centralized config service
// (roadmap 0.4). Redis becomes the invalidation bus for 0.3's hot-reload:
// when a config value is changed on one backend instance, the change is
// broadcast over Redis pub/sub so every OTHER instance reloads its snapshot
// immediately, instead of waiting for the per-instance TTL refresh backstop.
//
// Fully optional and non-breaking. When REDIS_URL is unset (single-instance
// installs — see roadmap 0.4 "Decision"), or if the redis module fails to load
// or connect, every function here is a no-op and the config service behaves
// exactly as before: local hot-reload on the writing instance + TTL refresh on
// the others. This reuses the same REDIS_URL already used for the session store.

const logger = require('../util/logger');
const crypto = require('crypto');

const CHANNEL = 'lifeclaim:config:invalidate';
// Unique per-process id so an instance ignores the messages it published itself
// (its snapshot is already updated locally by set()/remove()).
const INSTANCE_ID = crypto.randomBytes(8).toString('hex');

let pub = null; // publisher client
let sub = null; // dedicated subscriber client (a subscribed client can't issue other commands)
let enabled = false;
let started = false;

/**
 * Wire up the bus. Safe to call once at startup; further calls are ignored.
 * Never throws — failures degrade to the TTL-only behaviour.
 *
 * @param {string|undefined} redisUrl      from config (REDIS_URL); unset => no-op bus
 * @param {(key: string|null) => void} onInvalidate  invoked when a PEER changes config
 * @returns {Promise<boolean>} whether the bus is live
 */
async function init(redisUrl, onInvalidate) {
  if (started) return enabled;
  started = true;

  if (!redisUrl) {
    // No Redis configured: TTL backstop remains the only cross-instance path.
    return false;
  }

  let createClient;
  try {
    ({ createClient } = require('redis'));
  } catch (err) {
    logger.warn(
      '[config-bus] redis module unavailable; cross-instance config invalidation disabled:',
      err?.message
    );
    return false;
  }

  try {
    pub = createClient({ url: redisUrl });
    sub = pub.duplicate();
    pub.on('error', (e) => logger.error('[config-bus] publisher error:', e.message));
    sub.on('error', (e) => logger.error('[config-bus] subscriber error:', e.message));
    await pub.connect();
    await sub.connect();
    await sub.subscribe(CHANNEL, (raw) => {
      let key = null;
      try {
        const msg = JSON.parse(raw);
        if (msg.sender === INSTANCE_ID) return; // ignore our own writes
        key = msg.key ?? null;
      } catch {
        // Malformed message: fall back to a full reload below.
        key = null;
      }
      if (typeof onInvalidate === 'function') onInvalidate(key);
    });
    enabled = true;
    logger.info('[config-bus] cross-instance config invalidation enabled via Redis.');
    return true;
  } catch (err) {
    logger.error(
      '[config-bus] failed to initialize; falling back to TTL-only refresh:',
      err?.message
    );
    enabled = false;
    return false;
  }
}

/**
 * Broadcast that `key` changed (or was removed). No-op when the bus is off, so
 * callers never need to branch on whether Redis is configured.
 */
function publish(key) {
  if (!enabled || !pub) return;
  const payload = JSON.stringify({ sender: INSTANCE_ID, key: key ?? null });
  pub.publish(CHANNEL, payload).catch((e) =>
    logger.error('[config-bus] publish failed:', e.message)
  );
}

function isEnabled() {
  return enabled;
}

module.exports = { init, publish, isEnabled, CHANNEL, INSTANCE_ID };
