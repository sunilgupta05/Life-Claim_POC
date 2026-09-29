// tests/middleware/requireInternal.test.js
//
// Internal-only trust boundary (roadmap 3.7): CIDR matching + the middleware's
// allow (internal IP / valid key) vs deny (external) decision.

process.env.LOG_TO_FILE = 'false';
const { requireInternal, isInternalIp, ipv4InCidr, normalizeIp, DEFAULT_CIDRS } = require('../../src/middleware/requireInternal');

function mockRes() {
  return {
    statusCode: 200, body: undefined,
    status(c) { this.statusCode = c; return this; },
    json(p) { this.body = p; return this; },
  };
}

describe('CIDR + IP helpers', () => {
  test('ipv4InCidr matches inside/outside a range', () => {
    expect(ipv4InCidr('10.1.2.3', '10.0.0.0/8')).toBe(true);
    expect(ipv4InCidr('192.168.5.5', '192.168.0.0/16')).toBe(true);
    expect(ipv4InCidr('8.8.8.8', '10.0.0.0/8')).toBe(false);
    expect(ipv4InCidr('172.32.0.1', '172.16.0.0/12')).toBe(false);
  });

  test('normalizeIp unwraps IPv4-mapped IPv6', () => {
    expect(normalizeIp('::ffff:127.0.0.1')).toBe('127.0.0.1');
  });

  test('isInternalIp: loopback + private are internal, public is not', () => {
    expect(isInternalIp('127.0.0.1', DEFAULT_CIDRS)).toBe(true);
    expect(isInternalIp('::1', DEFAULT_CIDRS)).toBe(true);
    expect(isInternalIp('10.0.0.9', DEFAULT_CIDRS)).toBe(true);
    expect(isInternalIp('203.0.113.7', DEFAULT_CIDRS)).toBe(false);
  });
});

describe('requireInternal middleware', () => {
  test('allows an internal (loopback) client', () => {
    const next = jest.fn();
    const res = mockRes();
    requireInternal()({ ip: '127.0.0.1', headers: {}, method: 'GET', originalUrl: '/x' }, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  test('blocks an external client with 403', () => {
    const next = jest.fn();
    const res = mockRes();
    requireInternal()({ ip: '203.0.113.7', headers: {}, method: 'GET', originalUrl: '/x' }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  test('allows an external client that presents a valid X-Internal-Api-Key', () => {
    process.env.INTERNAL_API_KEY = 'secret-123';
    const next = jest.fn();
    const res = mockRes();
    requireInternal()({ ip: '203.0.113.7', headers: { 'x-internal-api-key': 'secret-123' }, method: 'GET', originalUrl: '/x' }, res, next);
    expect(next).toHaveBeenCalled();
    delete process.env.INTERNAL_API_KEY;
  });

  test('a wrong key is still rejected', () => {
    process.env.INTERNAL_API_KEY = 'secret-123';
    const next = jest.fn();
    const res = mockRes();
    requireInternal()({ ip: '203.0.113.7', headers: { 'x-internal-api-key': 'nope' }, method: 'GET', originalUrl: '/x' }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    delete process.env.INTERNAL_API_KEY;
  });
});
