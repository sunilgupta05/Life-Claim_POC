// src/util/tracing.js
//
// Optional distributed tracing bootstrap (roadmap 4.3 — APM/tracing). No-op unless
// BOTH (a) the OpenTelemetry SDK packages are installed and (b) an OTLP endpoint is
// configured (OTEL_EXPORTER_OTLP_ENDPOINT). This keeps tracing a drop-in for the
// client's APM (Grafana Tempo / Jaeger / Datadog / New Relic OTLP) without forcing
// heavy dependencies into the base install.
//
// To enable:
//   npm i @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node \
//         @opentelemetry/exporter-trace-otlp-http
//   set OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
//   set OTEL_SERVICE_NAME=life-claim-backend
// then require this module FIRST in server.js (before app code) — it already is
// guarded, so it stays a no-op until the packages + endpoint are present.
//
// Correlation ids (X-Request-Id, util/requestContext) provide request tracing
// even without OTEL; this adds spans across process/integration boundaries.

function startTracing() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return { enabled: false, reason: 'OTEL_EXPORTER_OTLP_ENDPOINT not set' };

  try {
    // Lazy require so the base install doesn't need these packages.
    // eslint-disable-next-line global-require, import/no-unresolved
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    // eslint-disable-next-line global-require, import/no-unresolved
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    // eslint-disable-next-line global-require, import/no-unresolved
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

    const sdk = new NodeSDK({
      serviceName: process.env.OTEL_SERVICE_NAME || 'life-claim-backend',
      traceExporter: new OTLPTraceExporter({ url: `${endpoint.replace(/\/$/, '')}/v1/traces` }),
      instrumentations: [getNodeAutoInstrumentations()],
    });
    sdk.start();
    process.once('SIGTERM', () => { sdk.shutdown().catch(() => {}); });
    return { enabled: true, endpoint };
  } catch (err) {
    // Packages not installed — stay a no-op, don't crash the app.
    return { enabled: false, reason: `OpenTelemetry SDK not installed: ${err?.message}` };
  }
}

module.exports = { startTracing };
