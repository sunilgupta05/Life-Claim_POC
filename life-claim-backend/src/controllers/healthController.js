// src/controllers/healthController.js
//
// Health + integration status (roadmap 3.2).
//   GET /api/health              — public liveness (cheap, no dependencies).
//   GET /api/health/ready        — public readiness (DB + config warm).
//   GET /api/health/integrations — per-integration status: resolved endpoint,
//                                  circuit-breaker state + stats (from the 3.1
//                                  resilience layer), and config source. Feeds
//                                  the live dashboard + IT Admin console.
//
// The integrations view is authenticated/superuser-gated (mounted after the auth
// gate); liveness/readiness are public for load balancers.

const pool = require('../config/dbConfig');
const appConfig = require('../config/configService');
const logger = require('../util/logger');
const { listBreakers } = require('../util/resilience');
const catalog = require('../config/integrationCatalog');

const startedAt = Date.now();

/** GET /api/health — liveness. Always cheap; never touches a dependency. */
const liveness = (req, res) => {
  res.json({
    status: 'ok',
    service: 'life-claim-backend',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  });
};

/** GET /api/health/ready — readiness: DB reachable + config cache warm. */
const readiness = async (req, res) => {
  const checks = {};
  let ok = true;

  try {
    const t0 = Date.now();
    await pool.query('SELECT 1');
    checks.database = { status: 'up', latencyMs: Date.now() - t0 };
  } catch (err) {
    ok = false;
    checks.database = { status: 'down', error: err?.code || err?.message };
  }

  const cfg = appConfig.status();
  checks.config = { status: cfg.ready ? 'up' : 'warming', keys: cfg.size };

  res.status(ok ? 200 : 503).json({
    status: ok ? 'ready' : 'not-ready',
    checks,
    timestamp: new Date().toISOString(),
  });
};

/**
 * GET /api/health/integrations — join the integration catalog with live circuit
 * breaker state. `state` is one of closed | half-open | open | unknown (no calls
 * made yet). Overall status is 'degraded' if any breaker is open.
 */
const integrations = async (req, res) => {
  try {
    const breakerByName = new Map(listBreakers().map((b) => [b.name, b]));
    const items = catalog.describe().map((c) => {
      const b = c.breaker ? breakerByName.get(c.breaker) : null;
      const state = b ? b.state : 'unknown';
      return {
        id: c.id,
        label: c.label,
        usedFor: c.usedFor,
        critical: c.critical,
        endpoint: c.endpoint,
        timeoutMs: c.timeoutMs,
        urlKeys: c.urlKeys,
        timeoutKey: c.timeoutKey,
        breaker: c.breaker,
        state,
        healthy: b ? b.healthy : true, // no breaker/no calls yet => not known-bad
        stats: b ? b.stats : null,
      };
    });

    const anyOpen = items.some((i) => i.state === 'open');
    res.json({
      status: anyOpen ? 'degraded' : 'ok',
      generatedAt: new Date().toISOString(),
      integrations: items,
    });
  } catch (err) {
    logger.error('[health] integrations error:', err?.message);
    res.status(500).json({ message: 'Failed to load integration health', code: 'INTERNAL_ERROR' });
  }
};

module.exports = { liveness, readiness, integrations };
