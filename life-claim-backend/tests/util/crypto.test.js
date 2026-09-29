// tests/util/crypto.test.js — PII field encryption at rest (roadmap 4.6).

process.env.LOG_TO_FILE = 'false';

// A deterministic 32-byte key (base64) for the suite.
const KEY = require('crypto').randomBytes(32).toString('base64');

describe('crypto (no key configured)', () => {
  beforeAll(() => { delete process.env.PII_ENCRYPTION_KEY; });
  test('encrypt is a pass-through no-op', () => {
    const c = require('../../src/util/crypto');
    expect(c.isEnabled()).toBe(false);
    expect(c.encrypt('1234-5678')).toBe('1234-5678');
    expect(c.decrypt('1234-5678')).toBe('1234-5678');
  });
});

describe('crypto (key configured)', () => {
  beforeAll(() => { process.env.PII_ENCRYPTION_KEY = KEY; });
  afterAll(() => { delete process.env.PII_ENCRYPTION_KEY; });

  test('round-trips a value and produces an opaque token', () => {
    const c = require('../../src/util/crypto');
    const token = c.encrypt('ABCDE1234F');
    expect(c.isEnabled()).toBe(true);
    expect(token).toMatch(/^enc:v1:/);
    expect(token).not.toContain('ABCDE1234F');
    expect(c.isEncrypted(token)).toBe(true);
    expect(c.decrypt(token)).toBe('ABCDE1234F');
  });

  test('empty / already-encrypted values are handled', () => {
    const c = require('../../src/util/crypto');
    expect(c.encrypt('')).toBe('');
    const t = c.encrypt('x');
    expect(c.encrypt(t)).toBe(t); // idempotent, not double-encrypted
  });

  test('tampering is detected (GCM auth tag)', () => {
    const c = require('../../src/util/crypto');
    const token = c.encrypt('secret-account-9999');
    const parts = token.split(':');
    parts[5] = Buffer.from('tampered-ciphertext').toString('base64');
    expect(() => c.decrypt(parts.join(':'))).toThrow();
  });

  test('encryptFields / decryptFields on an object', () => {
    const c = require('../../src/util/crypto');
    const enc = c.encryptFields({ name: 'Ravi', panNo: 'ABCDE1234F', keep: 1 }, ['panNo']);
    expect(enc.name).toBe('Ravi');
    expect(enc.panNo).toMatch(/^enc:v1:/);
    const dec = c.decryptFields(enc, ['panNo']);
    expect(dec.panNo).toBe('ABCDE1234F');
  });

  test('generateKey returns a 32-byte base64 key', () => {
    const c = require('../../src/util/crypto');
    expect(Buffer.from(c.generateKey(), 'base64')).toHaveLength(32);
  });
});
