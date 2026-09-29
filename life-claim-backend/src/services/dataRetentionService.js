// src/services/dataRetentionService.js
//
// Data-retention enforcement (roadmap 4.6). Insurance/claims data must not be kept
// forever; this purges rows older than a configured retention window from a vetted
// allow-list of tables. Safety first:
//   - DRY-RUN by default (RETENTION_DRY_RUN=true) — it only COUNTS + logs.
//   - Disabled by default (RETENTION_ENABLED=false) — nothing runs unless enabled.
//   - Only the tables in POLICIES below are ever touched (no arbitrary SQL).
//
// Wire the scheduler from app.js (see startRetentionScheduler); it runs at a slow
// cadence and never blocks request handling.

const pool = require('../config/dbConfig');
const appConfig = require('../config/configService');
const logger = require('../util/logger');

// Vetted retention policies. `days` is read from config (per-table override →
// global default 365). Add entries only for tables whose date column is known.
const POLICIES = [
  { table: 'user_login_audit', dateColumn: 'LOGIN_AT', configKey: 'AUDIT_LOG_RETENTION_DAYS' },
];

const isEnabled = () => appConfig.getBool('RETENTION_ENABLED', false);
const isDryRun = () => appConfig.getBool('RETENTION_DRY_RUN', true);
const globalDays = () => appConfig.getNumber('DATA_RETENTION_DAYS', 365);
const daysFor = (p) => appConfig.getNumber(p.configKey, globalDays());

/** Count rows older than the window for one policy (safe; no writes). */
async function countExpired(p, days) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS n FROM \`${p.table}\` WHERE \`${p.dateColumn}\` < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [days]
  );
  return rows?.[0]?.n || 0;
}

/**
 * Run all retention policies once.
 * @returns {Promise<Array<{table,days,expired,deleted,dryRun}>>}
 */
async function runRetention() {
  if (!isEnabled()) {
    return [{ skipped: true, reason: 'RETENTION_ENABLED is false' }];
  }
  const dryRun = isDryRun();
  const results = [];
  for (const p of POLICIES) {
    const days = daysFor(p);
    try {
      const expired = await countExpired(p, days);
      let deleted = 0;
      if (expired > 0 && !dryRun) {
        const [res] = await pool.query(
          `DELETE FROM \`${p.table}\` WHERE \`${p.dateColumn}\` < DATE_SUB(NOW(), INTERVAL ? DAY)`,
          [days]
        );
        deleted = res?.affectedRows || 0;
      }
      results.push({ table: p.table, days, expired, deleted, dryRun });
      logger.info(`[retention] ${p.table}: ${expired} row(s) older than ${days}d${dryRun ? ' (dry-run, none deleted)' : `, deleted ${deleted}`}`);
    } catch (err) {
      results.push({ table: p.table, error: err?.code || err?.message });
      logger.error(`[retention] ${p.table} failed: ${err?.message}`);
    }
  }
  return results;
}

/** Start a slow periodic scheduler. No-op unless RETENTION_ENABLED=true. */
function startRetentionScheduler() {
  if (!isEnabled()) {
    logger.info('[retention] disabled (set RETENTION_ENABLED=true to enable)');
    return null;
  }
  const everyMs = appConfig.getNumber('RETENTION_INTERVAL_MS', 24 * 60 * 60 * 1000); // daily
  const timer = setInterval(() => { runRetention().catch(() => {}); }, everyMs);
  if (typeof timer.unref === 'function') timer.unref();
  logger.info(`[retention] scheduler started (every ${Math.round(everyMs / 3600000)}h, dryRun=${isDryRun()})`);
  return timer;
}

module.exports = { runRetention, startRetentionScheduler, POLICIES };
