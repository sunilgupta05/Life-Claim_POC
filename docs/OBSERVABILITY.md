# Observability (roadmap 4.3)

Metrics, tracing and alerting for the Life Claims backend.

## What's instrumented

- **Metrics** (`GET /api/metrics`, Prometheus format) — `src/util/metrics.js`:
  - Default Node/process metrics (event-loop lag, GC, heap, CPU).
  - `http_requests_total{method,route,status}` and `http_request_duration_seconds{...}` for every request.
  - `integration_breaker_state{integration}` (0 closed / 0.5 half-open / 1 open) from the 3.1 resilience layer.
- **Correlation ids** — every request/log line carries `X-Request-Id` (3.3/3.4), so logs are traceable per request without extra infra.
- **Structured logs** — winston with rotation + levels (3.4); ship to ELK/Loki via `LOG_HTTP_HOST`.
- **Distributed tracing (optional)** — `src/util/tracing.js`, OpenTelemetry, off until enabled (see below).

## Metrics endpoint is internal-only

`/api/metrics` is gated by `requireInternal` (loopback + RFC-1918, or `X-Internal-Api-Key`) — Prometheus scrapes it from inside the trust boundary; it is not exposed to end users. See [SERVICE_EXPOSURE.md](SERVICE_EXPOSURE.md).

## Prometheus scrape config

```yaml
scrape_configs:
  - job_name: life-claim-backend
    scheme: https
    tls_config: { insecure_skip_verify: true }   # self-signed in on-prem/dev
    metrics_path: /api/metrics
    static_configs:
      - targets: ['life-claim-backend:3010']
```

If Prometheus runs outside the private network, set `INTERNAL_API_KEY` and add:
```yaml
    authorization: { type: '', credentials: '' }   # or:
    headers: { X-Internal-Api-Key: '<INTERNAL_API_KEY>' }
```

## Sample alert rules

```yaml
groups:
  - name: life-claim
    rules:
      - alert: BackendDown
        expr: up{job="life-claim-backend"} == 0
        for: 2m
        labels: { severity: critical }
        annotations: { summary: "Life Claims backend is down" }

      - alert: IntegrationBreakerOpen
        expr: integration_breaker_state > 0
        for: 5m
        labels: { severity: warning }
        annotations: { summary: "Circuit breaker open for {{ $labels.integration }}" }

      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels: { severity: warning }
        annotations: { summary: "5xx error rate > 5%" }

      - alert: HighLatencyP95
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 2
        for: 10m
        labels: { severity: warning }
        annotations: { summary: "p95 request latency > 2s" }
```

Wire alerts to the client's channel (Alertmanager → Slack/email/PagerDuty). A basic Grafana dashboard can be built from the four metrics above (request rate, error rate, p95 latency, breaker states).

## Enabling distributed tracing (APM)

Tracing stays a no-op until the OpenTelemetry SDK is installed **and** an OTLP endpoint is set — so it drops into the client's APM (Grafana Tempo / Jaeger / Datadog / New Relic OTLP) with no base-install weight.

```bash
npm i @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http
# .env
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_SERVICE_NAME=life-claim-backend
```

`server.js` calls `startTracing()` first thing; it auto-instruments HTTP/Express/MySQL/AMQP once the packages + endpoint are present.

## Config keys

| Key | Default | Meaning |
|-----|---------|---------|
| `INTERNAL_API_KEY` / `INTERNAL_ALLOWED_CIDRS` | loopback+RFC-1918 | Who may scrape `/api/metrics`. |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | *(unset)* | Enables OTLP tracing when set. |
| `OTEL_SERVICE_NAME` | `life-claim-backend` | Service name in traces. |
| `LOG_HTTP_HOST` | *(unset)* | Ship logs to a central collector (3.4). |
