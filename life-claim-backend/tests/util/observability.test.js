// tests/util/observability.test.js — metrics + OpenAPI (roadmap 4.3 / 4.4).

process.env.LOG_TO_FILE = 'false';
const metrics = require('../../src/util/metrics');
const { getSpec } = require('../../src/config/openapi');

describe('metrics (4.3)', () => {
  test('registry exposes the core metrics', async () => {
    const out = await metrics.register.metrics();
    expect(out).toContain('http_requests_total');
    expect(out).toContain('http_request_duration_seconds');
    expect(out).toContain('integration_breaker_state');
    // default process metrics too
    expect(out).toMatch(/process_cpu_user_seconds_total|nodejs_/);
  });

  test('httpMetricsMiddleware records on response finish', () => {
    let finish;
    const req = { method: 'GET', path: '/api/health', route: null };
    const res = { statusCode: 200, on: (ev, cb) => { if (ev === 'finish') finish = cb; } };
    const next = jest.fn();
    metrics.httpMetricsMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(() => finish()).not.toThrow(); // records count + latency
  });
});

describe('OpenAPI spec (4.4)', () => {
  test('is a valid 3.0.3 doc with bearer security + key paths', () => {
    const s = getSpec();
    expect(s.openapi).toBe('3.0.3');
    expect(s.components.securitySchemes.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer' });
    expect(s.paths).toHaveProperty('/api/health');
    expect(s.paths).toHaveProperty('/api/settings/{key}');
    expect(s.info.title).toMatch(/Life Claims/i);
  });
});
