/**
 * In-memory failed-login lockout for Keycloak token proxy (VAPT #21).
 * Primary app login hits POST /api/auth/keycloak/token — Keycloak realm brute-force
 * should also be enabled in Keycloak Admin; this layer enforces policy when the proxy is used.
 *
 * Multi-node: use Redis or sticky sessions + shared store if you scale horizontally.
 */
const logger = require('../config/logConfig');

const maxAttempts = () =>
  Number(process.env.ACCOUNT_LOCKOUT_MAX_ATTEMPTS || process.env.KEYCLOAK_LOCKOUT_MAX_ATTEMPTS || 5);

const lockDurationMs = () =>
  Number(process.env.ACCOUNT_LOCKOUT_DURATION_MS || process.env.KEYCLOAK_LOCKOUT_DURATION_MS || 15 * 60 * 1000);

const enabled = () => process.env.KEYCLOAK_LOCKOUT_ENABLED !== 'false';

/** @type {Map<string, { failures: number, lockoutUntil: number }>} */
const store = new Map();

function norm(u) {
  const s = String(u || '').trim().toLowerCase();
  return s || '\0';
}

function getEntry(username) {
  const key = norm(username);
  let e = store.get(key);
  const now = Date.now();
  if (!e) {
    e = { failures: 0, lockoutUntil: 0 };
    store.set(key, e);
    return { key, e, now };
  }
  if (e.lockoutUntil && now >= e.lockoutUntil) {
    e.failures = 0;
    e.lockoutUntil = 0;
    store.set(key, e);
  }
  return { key, e, now };
}

function isBlocked(username) {
  if (!enabled()) return { blocked: false, remainingMs: 0 };
  const { e, now } = getEntry(username);
  if (e.lockoutUntil && now < e.lockoutUntil) {
    return { blocked: true, remainingMs: e.lockoutUntil - now };
  }
  return { blocked: false, remainingMs: 0 };
}

/**
 * @returns {{ locked: boolean, remainingMs: number, justLocked?: boolean }}
 */
function recordFailure(username) {
  if (!enabled()) return { locked: false, remainingMs: 0 };
  const max = maxAttempts();
  const dur = lockDurationMs();
  const { key, e, now } = getEntry(username);
  if (e.lockoutUntil && now < e.lockoutUntil) {
    return { locked: true, remainingMs: e.lockoutUntil - now };
  }
  e.failures += 1;
  if (e.failures >= max) {
    e.lockoutUntil = now + dur;
    store.set(key, e);
    logger.warn(`[security] Keycloak proxy login lockout: user=${key} failures=${e.failures}`);
    return { locked: true, remainingMs: dur, justLocked: true };
  }
  store.set(key, e);
  return { locked: false, remainingMs: 0 };
}

function clearFailures(username) {
  store.delete(norm(username));
}

module.exports = {
  isBlocked,
  recordFailure,
  clearFailures,
  maxAttempts,
  lockDurationMs,
  enabled,
};
