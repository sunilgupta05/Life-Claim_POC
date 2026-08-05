// Tests the SYNCHRONOUS resolver of the config service (roadmap 0.3) with NO DB:
// when the DB snapshot is empty, every lookup falls back to process.env -> default.
const configService = require('../../src/config/configService');

describe('configService resolver (env -> default, no DB)', () => {
  const TOUCHED = [];
  const setEnv = (k, v) => { TOUCHED.push(k); process.env[k] = v; };
  afterEach(() => { while (TOUCHED.length) delete process.env[TOUCHED.pop()]; });

  test('get() returns the default when the key is absent', () => {
    expect(configService.get('NOPE_KEY_XYZ', 'fallback')).toBe('fallback');
    expect(configService.get('NOPE_KEY_XYZ')).toBeUndefined();
  });

  test('get() reads process.env when present (env fallback)', () => {
    setEnv('CFG_TEST_STR', 'from-env');
    expect(configService.get('CFG_TEST_STR', 'def')).toBe('from-env');
  });

  test('getNumber() parses numeric env, else default', () => {
    setEnv('CFG_TEST_NUM', '42');
    expect(configService.getNumber('CFG_TEST_NUM')).toBe(42);
    expect(configService.getNumber('CFG_MISSING_NUM', 7)).toBe(7);
    setEnv('CFG_BAD_NUM', 'notanumber');
    expect(configService.getNumber('CFG_BAD_NUM', 9)).toBe(9);
  });

  test('getBool() honours truthy/falsey tokens and defaults', () => {
    setEnv('CFG_T', 'true');
    setEnv('CFG_F', 'false');
    setEnv('CFG_ZERO', '0');
    expect(configService.getBool('CFG_T')).toBe(true);
    expect(configService.getBool('CFG_F')).toBe(false);
    expect(configService.getBool('CFG_ZERO')).toBe(false);
    expect(configService.getBool('CFG_MISSING', true)).toBe(true);
    expect(configService.getBool('CFG_MISSING', false)).toBe(false);
  });

  test('getJson() parses JSON env, else default', () => {
    setEnv('CFG_JSON', '{"a":1,"b":[2,3]}');
    expect(configService.getJson('CFG_JSON')).toEqual({ a: 1, b: [2, 3] });
    setEnv('CFG_BAD_JSON', '{not json}');
    expect(configService.getJson('CFG_BAD_JSON', { fallback: true })).toEqual({ fallback: true });
    expect(configService.getJson('CFG_MISSING_JSON', null)).toBeNull();
  });

  test('status() reports a shape the admin API can consume', () => {
    const s = configService.status();
    expect(s).toEqual(expect.objectContaining({
      ready: expect.any(Boolean),
      size: expect.any(Number),
      ttlMs: expect.any(Number),
    }));
  });
});
