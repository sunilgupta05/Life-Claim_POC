// tests/config/secrets.test.js — secrets provider abstraction (roadmap 4.5).

process.env.LOG_TO_FILE = 'false';
const secrets = require('../../src/config/secrets');

describe('secrets', () => {
  test('defaults to the env provider', () => {
    expect(secrets.provider()).toBe('env');
    expect(secrets.status()).toMatchObject({ provider: 'env', knownSecrets: expect.any(Number) });
  });

  test('get() reads process.env and falls back to the default', () => {
    process.env.TEST_SECRET_XYZ = 'top-secret';
    expect(secrets.get('TEST_SECRET_XYZ')).toBe('top-secret');
    expect(secrets.get('DOES_NOT_EXIST_ABC', 'fallback')).toBe('fallback');
    delete process.env.TEST_SECRET_XYZ;
  });

  test('has() reflects presence', () => {
    process.env.TEST_SECRET_XYZ = 'x';
    expect(secrets.has('TEST_SECRET_XYZ')).toBe(true);
    expect(secrets.has('NOPE_NOPE_NOPE')).toBe(false);
    delete process.env.TEST_SECRET_XYZ;
  });

  test('env provider init() is a no-op that resolves', async () => {
    await expect(secrets.init()).resolves.toBeDefined();
  });

  test('KNOWN_SECRETS lists the sensitive keys', () => {
    expect(secrets.KNOWN_SECRETS).toEqual(expect.arrayContaining(['DB_PASSWORD', 'JWT_SECRET', 'INTERNAL_API_KEY']));
  });
});
