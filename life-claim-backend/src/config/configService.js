// src/config/configService.js
//
// Centralized configuration service (roadmap 0.3).
//
// One place to read configuration, replacing scattered `process.env.X` reads.
// Business settings live in the app_config DB table and are editable at runtime;
// secrets stay in .env. Values are cached in an in-memory snapshot that is
// hot-reloaded (updated immediately on save, and refreshed on a TTL backstop),
// so changes apply WITHOUT a server restart.
//
// Resolution order for every key:
//     1. app_config row  (DB — runtime-editable business setting)
//     2. process.env[key] (.env — fallback, and the home of secrets)
//     3. the default passed by the caller
//
// The accessors are SYNCHRONOUS on purpose, so migrating existing code is a
// mechanical swap:  process.env.FOO           -> config.get('FOO', 'bar')
//                   process.env.N ? Number(..) -> config.getNumber('N', 10)
//                   process.env.FLAG !== 'false' -> config.getBool('FLAG', true)
//
// Until init() runs (or if the app_config table has not been migrated), the
// snapshot is empty and every lookup falls back to .env — i.e. behaviour is
// identical to before this service existed.

const logger = require('../util/logger');
const dao = require('../dataAccess/appConfigDao');
const configBus = require('./configBus');

const DEFAULT_TTL_MS = 60 * 1000;

let snapshot = new Map(); // CONFIG_KEY -> { value:string, type, isSecret }
let ready = false;
let lastLoadedAt = 0;
let refreshTimer = null;
let warnedMissing = false;

function ttlMs() {
  const raw = Number(process.env.CONFIG_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_MS;
}

// ---- loading ---------------------------------------------------------------

/** Reload the whole snapshot from the DB. Best-effort: never throws. */
async function reload() {
  try {
    const rows = await dao.getAll();
    const next = new Map();
    for (const r of rows) {
      next.set(r.CONFIG_KEY, {
        value: r.CONFIG_VALUE,
        type: r.VALUE_TYPE || 'string',
        isSecret: !!r.IS_SECRET,
      });
    }
    snapshot = next;
    ready = true;
    lastLoadedAt = Date.now();
    return true;
  } catch (err) {
    // Table missing (pre-migration) or transient DB error: keep whatever we
    // have and fall back to .env. Mark ready so accessors work immediately.
    ready = true;
    if (err && err.code === dao.TABLE_MISSING) {
      if (!warnedMissing) {
        logger.warn('[config] app_config table not migrated yet — using .env only (run npm run migrate).');
        warnedMissing = true;
      }
    } else {
      logger.warn('[config] reload failed, keeping cached/.env values:', err?.message);
    }
    return false;
  }
}

/** Load once at startup and start the TTL refresh backstop. */
async function init() {
  await reload();
  if (!refreshTimer) {
    refreshTimer = setInterval(() => { reload().catch(() => {}); }, ttlMs());
    // don't keep the process alive just for config refresh
    if (typeof refreshTimer.unref === 'function') refreshTimer.unref();
  }
  // Cross-instance invalidation bus (roadmap 0.4). When REDIS_URL is set, peers'
  // config changes trigger an immediate reload instead of waiting for the TTL
  // backstop above. No-op (TTL-only) when REDIS_URL is unset. Best-effort: the
  // bus never throws, so it can't block or break startup.
  await configBus.init(get('REDIS_URL'), () => { reload().catch(() => {}); });
  return snapshot.size;
}

// ---- reads (synchronous) ---------------------------------------------------

// Raw resolved string (DB -> env -> undefined), no default applied.
function raw(key) {
  const hit = snapshot.get(key);
  if (hit && hit.value !== null && hit.value !== undefined) return hit.value;
  const env = process.env[key];
  if (env !== undefined) return env;
  return undefined;
}

function get(key, defaultValue = undefined) {
  const v = raw(key);
  return v === undefined ? defaultValue : v;
}

function getNumber(key, defaultValue = undefined) {
  const v = raw(key);
  if (v === undefined || v === '') return defaultValue;
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultValue;
}

// Truthy unless the value is an explicit falsey token. When the key is unset,
// returns defaultValue (mirrors the common `process.env.X !== 'false'` idiom
// when called as getBool('X', true)).
function getBool(key, defaultValue = false) {
  const v = raw(key);
  if (v === undefined) return defaultValue;
  return !/^(false|0|no|off|)$/i.test(String(v).trim());
}

function getJson(key, defaultValue = undefined) {
  const v = raw(key);
  if (v === undefined) return defaultValue;
  try {
    return typeof v === 'object' ? v : JSON.parse(v);
  } catch {
    return defaultValue;
  }
}

// ---- writes (hot-reload) ---------------------------------------------------

/**
 * Upsert a business setting and hot-reload it into the live snapshot so it
 * takes effect immediately (no restart). Persists to app_config.
 */
async function set(key, value, opts = {}) {
  const type = opts.type || 'string';
  const strValue =
    type === 'json' && typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
  await dao.upsert({
    key,
    value: strValue,
    type,
    category: opts.category ?? null,
    description: opts.description ?? null,
    isSecret: !!opts.isSecret,
    actor: opts.actor ?? null,
  });
  snapshot.set(key, { value: strValue, type, isSecret: !!opts.isSecret });
  lastLoadedAt = Date.now();
  // Tell peer instances to reload (no-op when the Redis bus is off).
  configBus.publish(key);
}

/** Remove a key from DB + snapshot (falls back to .env afterwards). */
async function remove(key) {
  await dao.remove(key);
  snapshot.delete(key);
  lastLoadedAt = Date.now();
  // Tell peer instances to reload (no-op when the Redis bus is off).
  configBus.publish(key);
}

/** Drop the in-memory cache (next read after reload() repopulates it). */
function clearCache() {
  snapshot = new Map();
  ready = false;
}

// ---- introspection (for the admin API) -------------------------------------

/**
 * Snapshot of all DB-backed settings for the admin console. Secret values are
 * masked. Does not expose .env-only values (those are managed via .env).
 */
function listForAdmin() {
  const out = [];
  for (const [key, meta] of snapshot.entries()) {
    out.push({
      key,
      value: meta.isSecret ? '********' : meta.value,
      type: meta.type,
      isSecret: meta.isSecret,
      source: 'db',
    });
  }
  return out.sort((a, b) => (a.key < b.key ? -1 : 1));
}

function status() {
  return {
    ready,
    size: snapshot.size,
    lastLoadedAt: lastLoadedAt ? new Date(lastLoadedAt).toISOString() : null,
    ttlMs: ttlMs(),
    // Cross-instance invalidation bus (roadmap 0.4); false => TTL-only refresh.
    invalidationBus: configBus.isEnabled(),
  };
}

module.exports = {
  init,
  reload,
  get,
  getNumber,
  getBool,
  getJson,
  set,
  remove,
  clearCache,
  listForAdmin,
  status,
};
