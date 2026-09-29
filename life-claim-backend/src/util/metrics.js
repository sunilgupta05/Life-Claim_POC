// src/util/metrics.js
//
// Prometheus metrics (roadmap 4.3 — observability). Exposes:
//   - default Node/process metrics (event loop lag, GC, memory, CPU…),
//   - http_requests_total{method,route,status} — request counter,
//   - http_request_duration_seconds{method,route,status} — latency histogram,
//   - integration_breaker_state{integration} — 0 closed / 0.5 half-open / 1 open,
//   - integration_calls_total{integration,result} — from the resilience layer.
//
// Scraped at GET /api/metrics (internal-only). Distributed tracing is provided
// via the correlation id (X-Request-Id, see requestContext) and the optional
// OpenTelemetry bootstrap (util/tracing.js); this module is metrics-only.

const client = require('prom-client');
const { listBreakers } = require('./resilience');

const register = new client.Registry();
register.setDefaultLabels({ app: 'life-claim-backend' });
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const breakerState = new client.Gauge({
  name: 'integration_breaker_state',
  help: 'Circuit breaker state (0=closed, 0.5=half-open, 1=open)',
  labelNames: ['integration'],
  registers: [register],
});

// Keep the low-cardinality route label bounded: collapse numeric/id path segments.
function routeLabel(req) {
  const base = (req.route && req.baseUrl ? req.baseUrl + req.route.path : req.path) || req.path || 'unknown';
  return base
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '/:id') // uuids
    .replace(/\/\d+/g, '/:id'); // numeric ids
}

/** Express middleware: records count + latency for every request. */
function httpMetricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const labels = { method: req.method, route: routeLabel(req), status: String(res.statusCode) };
    httpRequestsTotal.inc(labels);
    end(labels);
  });
  next();
}

/** Refresh breaker gauges from the resilience registry at scrape time. */
function syncBreakerGauges() {
  for (const b of listBreakers()) {
    const v = b.state === 'open' ? 1 : b.state === 'half-open' ? 0.5 : 0;
    breakerState.set({ integration: b.name }, v);
  }
}

/** GET /api/metrics handler (Prometheus exposition format). */
async function metricsHandler(req, res) {
  try {
    syncBreakerGauges();
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(String(err?.message || err));
  }
}

module.exports = { register, httpMetricsMiddleware, metricsHandler, client };
