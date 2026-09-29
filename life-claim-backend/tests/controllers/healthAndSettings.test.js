// tests/controllers/healthAndSettings.test.js
//
// Integration health (3.2) + IT Admin settings (3.5) controllers — the pure /
// no-DB paths: liveness, the catalog↔breaker join, the settings catalog shape,
// and input validation on updates.

process.env.LOG_TO_FILE = 'false';

const health = require('../../src/controllers/healthController');
const settings = require('../../src/controllers/systemSettingsController');
const { run, __resetForTests } = require('../../src/util/resilience');

function mockRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

afterEach(() => __resetForTests());

describe('healthController', () => {
  test('liveness returns ok + uptime', () => {
    const res = mockRes();
    health.liveness({}, res);
    expect(res.body).toMatchObject({ status: 'ok', service: 'life-claim-backend' });
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  test('integrations joins the catalog with breaker state', async () => {
    // Exercise one breaker so it appears in the join as "closed".
    await run('transaction-api', () => Promise.resolve('ok'));
    const res = mockRes();
    await health.integrations({}, res);
    expect(res.body.status).toBe('ok');
    const txn = res.body.integrations.find((i) => i.id === 'transaction-api');
    expect(txn).toBeTruthy();
    expect(txn.endpoint).toBeTruthy();
    expect(txn.state).toBe('closed');
    // An integration with no calls yet reports 'unknown' but stays healthy.
    const rules = res.body.integrations.find((i) => i.id === 'rules-engine');
    expect(rules.state).toBe('unknown');
    expect(rules.healthy).toBe(true);
  });

  test('integrations reports degraded when a breaker is open', async () => {
    // Force the whatsapp breaker open with a tiny threshold.
    const opts = { retries: 0, volumeThreshold: 1, errorThresholdPercentage: 1, resetTimeout: 60000, retryBaseMs: 1 };
    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await run('whatsapp', () => Promise.reject(new Error('down')), opts).catch(() => {});
    }
    const res = mockRes();
    await health.integrations({}, res);
    expect(res.body.status).toBe('degraded');
    const wa = res.body.integrations.find((i) => i.id === 'whatsapp');
    expect(wa.state).toBe('open');
    expect(wa.healthy).toBe(false);
  });
});

describe('systemSettingsController', () => {
  test('getSettings returns grouped catalog with values', async () => {
    const res = mockRes();
    await settings.getSettings({}, res);
    expect(Array.isArray(res.body.groups)).toBe(true);
    const urls = res.body.groups.find((g) => g.name === 'Integration URLs');
    expect(urls).toBeTruthy();
    const item = urls.items.find((i) => i.key === 'TXN_API_BASE_URL');
    expect(item).toMatchObject({ key: 'TXN_API_BASE_URL', source: expect.any(String) });
  });

  test('update rejects an unknown key with 404', async () => {
    const res = mockRes();
    await settings.updateSetting({ params: { key: 'NOPE' }, body: { value: 'x' } }, res);
    expect(res.statusCode).toBe(404);
  });

  test('update requires a value (400)', async () => {
    const res = mockRes();
    await settings.updateSetting({ params: { key: 'LOG_LEVEL' }, body: {} }, res);
    expect(res.statusCode).toBe(400);
  });

  test('update validates enum values (422)', async () => {
    const res = mockRes();
    await settings.updateSetting({ params: { key: 'LOG_LEVEL' }, body: { value: 'loud' } }, res);
    expect(res.statusCode).toBe(422);
  });

  test('update validates number values (422)', async () => {
    const res = mockRes();
    await settings.updateSetting({ params: { key: 'INTEGRATION_TIMEOUT_MS' }, body: { value: 'abc' } }, res);
    expect(res.statusCode).toBe(422);
  });
});
