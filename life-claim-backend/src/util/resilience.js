// src/util/resilience.js
//
// Integration resilience (roadmap 3.1). One reusable wrapper so every outbound
// integration is protected the same way:
//   - TIMEOUT       — a hung dependency can never wedge the caller.
//   - RETRY+BACKOFF — transient failures (network / timeout / 5xx) are retried
//                     with exponential backoff; client errors (4xx) are not.
//   - CIRCUIT BREAKER (opossum) — after repeated failures the breaker OPENS and
//                     calls fail fast until it half-opens and recovers.
//
// A registry of the per-integration breakers is exposed via listBreakers(), which
// the 3.2 /health endpoint + dashboard read.
//
// All knobs come from the config service (DB → .env → default):
//   INTEGRATION_TIMEOUT_MS (10000), INTEGRATION_RETRIES (2),
//   INTEGRATION_RETRY_BASE_MS (300), INTEGRATION_BREAKER_ERROR_PCT (50),
//   INTEGRATION_BREAKER_RESET_MS (30000), INTEGRATION_BREAKER_VOLUME (5)
// with per-integration overrides, e.g. TRANSACTION_API_TIMEOUT_MS.

const logger = require('./logger');
const CircuitBreaker = require('opossum');
const appConfig = require('../config/configService');

const breakers = new Map(); // name -> opossum CircuitBreaker

const envKey = (name) => name.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

function num(key, dflt) {
  const v = appConfig.getNumber(key, undefined);
  return Number.isFinite(v) ? v : dflt;
}

/** Per-integration setting: <NAME>_<SUFFIX> falls back to INTEGRATION_<SUFFIX> then default. */
function setting(name, suffix, dflt) {
  return num(`${envKey(name)}_${suffix}`, num(`INTEGRATION_${suffix}`, dflt));
}

/** A 4xx is the caller's fault, not the dependency failing — don't trip the breaker or retry. */
function isClientError(err) {
  const s = err?.response?.status ?? err?.status;
  return typeof s === 'number' && s >= 400 && s < 500;
}

function isOpenBreakerError(err) {
  return err?.code === 'EOPENBREAKER' || /breaker is open/i.test(err?.message || '');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function optionsFor(name, override = {}) {
  return {
    name,
    timeout: override.timeout ?? setting(name, 'TIMEOUT_MS', 10000),
    errorThresholdPercentage: override.errorThresholdPercentage ?? setting(name, 'BREAKER_ERROR_PCT', 50),
    resetTimeout: override.resetTimeout ?? setting(name, 'BREAKER_RESET_MS', 30000),
    volumeThreshold: override.volumeThreshold ?? setting(name, 'BREAKER_VOLUME', 5),
    rollingCountTimeout: 10000,
    errorFilter: isClientError, // 4xx does not count as a breaker failure
  };
}

/**
 * Lazily create/return the named circuit breaker. The breaker wraps a generic
 * action that just invokes the function passed to fire(), so one breaker guards
 * all calls for an integration (each with its own timeout applied by opossum).
 */
function getBreaker(name, override) {
  if (breakers.has(name)) return breakers.get(name);
  const breaker = new CircuitBreaker((fn) => fn(), optionsFor(name, override));
  breaker.on('open', () => logger.warn(`[resilience] circuit OPEN for "${name}" — failing fast`));
  breaker.on('halfOpen', () => logger.info(`[resilience] circuit HALF-OPEN for "${name}" — probing`));
  breaker.on('close', () => logger.info(`[resilience] circuit CLOSED for "${name}" — healthy`));
  breakers.set(name, breaker);
  return breaker;
}

/**
 * Run an async integration call through its circuit breaker (timeout enforced),
 * with retry + exponential backoff on transient failures.
 *
 * @param {string}   name  integration id, e.g. 'transaction-api'
 * @param {()=>Promise} fn  the actual call (should also set its own client timeout)
 * @param {object}   opts  { retries, retryBaseMs, timeout, ... } overrides
 */
async function run(name, fn, opts = {}) {
  const breaker = getBreaker(name, opts);
  const maxRetries = opts.retries ?? setting(name, 'RETRIES', 2);
  const base = opts.retryBaseMs ?? num('INTEGRATION_RETRY_BASE_MS', 300);

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await breaker.fire(fn);
    } catch (err) {
      // Fail fast: open breaker or a client (4xx) error — never retry these.
      if (isOpenBreakerError(err) || isClientError(err) || attempt >= maxRetries) throw err;
      attempt += 1;
      await sleep(base * 2 ** (attempt - 1)); // 300, 600, 1200, ...
    }
  }
}

/** Snapshot of every integration breaker (for the 3.2 health endpoint). */
function listBreakers() {
  return [...breakers.values()].map((b) => ({
    name: b.name,
    state: b.opened ? 'open' : b.halfOpen ? 'half-open' : 'closed',
    healthy: !b.opened,
    stats: {
      fires: b.stats?.fires || 0,
      successes: b.stats?.successes || 0,
      failures: b.stats?.failures || 0,
      timeouts: b.stats?.timeouts || 0,
      rejects: b.stats?.rejects || 0,
    },
  }));
}

/** Test helper: drop all breakers so a suite starts clean. */
function __resetForTests() {
  for (const b of breakers.values()) {
    try { b.shutdown(); } catch { /* ignore */ }
  }
  breakers.clear();
}

module.exports = { run, getBreaker, listBreakers, isClientError, isOpenBreakerError, __resetForTests };
