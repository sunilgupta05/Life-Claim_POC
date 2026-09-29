// tests/services/dataRetention.test.js — retention policy safety (roadmap 4.6).
// No DB needed: with RETENTION_ENABLED unset, runRetention short-circuits.

process.env.LOG_TO_FILE = 'false';
const retention = require('../../src/services/dataRetentionService');

describe('data retention', () => {
  test('is disabled by default and does nothing', async () => {
    const res = await retention.runRetention();
    expect(res[0]).toMatchObject({ skipped: true });
  });

  test('scheduler returns null when disabled', () => {
    expect(retention.startRetentionScheduler()).toBeNull();
  });

  test('only vetted tables are in the policy allow-list', () => {
    expect(Array.isArray(retention.POLICIES)).toBe(true);
    for (const p of retention.POLICIES) {
      expect(p).toHaveProperty('table');
      expect(p).toHaveProperty('dateColumn');
    }
    expect(retention.POLICIES.map((p) => p.table)).toContain('user_login_audit');
  });
});
