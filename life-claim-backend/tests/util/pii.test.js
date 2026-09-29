// tests/util/pii.test.js — PII masking / redaction (roadmap 4.6).

process.env.LOG_TO_FILE = 'false';
const pii = require('../../src/util/pii');

describe('field maskers', () => {
  test('maskEmail keeps first char + domain', () => {
    expect(pii.maskEmail('ravinder.sharma@dhdigital.co.in')).toMatch(/^r\*+@dhdigital\.co\.in$/);
    expect(pii.maskEmail('')).toBe('');
  });
  test('maskMobile keeps last 4', () => {
    expect(pii.maskMobile('9876543210')).toBe('******3210');
    expect(pii.maskMobile('12')).toBe('****');
  });
  test('maskAadhaar keeps last 4', () => {
    expect(pii.maskAadhaar('1234 5678 9012')).toBe('********9012');
  });
  test('maskPan keeps head 2 + tail 2', () => {
    expect(pii.maskPan('ABCDE1234F')).toBe('AB******4F');
  });
  test('maskAccount keeps last 4', () => {
    expect(pii.maskAccount('000123456789')).toBe('********6789');
  });
  test('maskName -> initials', () => {
    expect(pii.maskName('Ravi Kumar Sharma')).toBe('R. K. S.');
    expect(pii.maskName('')).toBe('');
  });
});

describe('redact()', () => {
  test('masks known PII keys deeply, leaves others', () => {
    const input = {
      claimNo: 'CL123',
      claimantName: 'Ravi Sharma',
      email: 'ravi@example.com',
      mobileNo: '9876543210',
      nested: { panNo: 'ABCDE1234F', note: 'ok' },
      list: [{ email: 'a@b.com' }],
    };
    const out = pii.redact(input);
    expect(out.claimNo).toBe('CL123'); // untouched
    expect(out.claimantName).toBe('R. S.');
    expect(out.email).toMatch(/^r\*+@example\.com$/);
    expect(out.mobileNo).toBe('******3210');
    expect(out.nested.panNo).toBe('AB******4F');
    expect(out.nested.note).toBe('ok');
    expect(out.list[0].email).toMatch(/\*/);
    // original not mutated
    expect(input.claimantName).toBe('Ravi Sharma');
  });

  test('handles null / circular safely', () => {
    const a = { email: 'x@y.com' };
    a.self = a;
    expect(() => pii.redact(a)).not.toThrow();
    expect(pii.redact(null)).toBeNull();
  });
});
