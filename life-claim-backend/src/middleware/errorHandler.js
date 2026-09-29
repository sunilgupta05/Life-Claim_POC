// src/middleware/errorHandler.js
//
// Centralized error handling (roadmap 3.3). One place that turns any thrown error
// into a consistent JSON response and one structured log line stamped with the
// request's correlation id — replacing the ad-hoc try/catch + res.status shapes
// scattered across the codebase.
//
// Response shape (stable):  { message, code, requestId }
//   - 4xx: the error's own message is returned (client's fault, safe to show).
//   - 5xx: a generic message is returned; the real cause is logged, never sent
//          (unless EXPOSE_ERROR_DETAIL=true, for non-prod debugging).
//
// It is additive: existing handlers that already call res.status().json() keep
// working; this only catches errors that propagate to Express (thrown in sync
// handlers or passed to next(err)).

const appConfig = require('../config/configService');
const logger = require('../util/logger');
const requestContext = require('../util/requestContext');
const { isOpenBreakerError } = require('../util/resilience');

/** Map common non-AppError failures to sensible HTTP semantics. */
function classify(err) {
  if (err && err.isAppError) {
    return { status: err.status, code: err.code, expose: err.expose, message: err.message };
  }
  // Malformed JSON body (body-parser).
  if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
    return { status: 400, code: 'BAD_JSON', expose: true, message: 'Malformed JSON in request body' };
  }
  // Payload too large (body-parser).
  if (err?.type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', expose: true, message: 'Request payload too large' };
  }
  // Circuit breaker open (resilience layer, 3.1) — dependency is down.
  if (isOpenBreakerError(err)) {
    return { status: 503, code: 'SERVICE_UNAVAILABLE', expose: true, message: 'A dependency is temporarily unavailable. Please retry shortly.' };
  }
  // Timed-out / unreachable upstream integration (axios / fetch abort).
  if (err?.code === 'ECONNABORTED' || err?.name === 'AbortError' || err?.code === 'ETIMEDOUT') {
    return { status: 504, code: 'UPSTREAM_TIMEOUT', expose: true, message: 'An upstream service timed out. Please retry shortly.' };
  }
  if (err?.code === 'ECONNREFUSED' || err?.code === 'ENOTFOUND') {
    return { status: 502, code: 'UPSTREAM_ERROR', expose: true, message: 'An upstream service is unavailable.' };
  }
  // Explicit status set on a plain error (legacy pattern).
  const status = Number(err?.status || err?.statusCode);
  if (Number.isFinite(status) && status >= 400 && status < 600) {
    return { status, code: err?.code || undefined, expose: status < 500, message: err?.message };
  }
  return { status: 500, code: 'INTERNAL_ERROR', expose: false, message: err?.message };
}

/** JSON 404 for unknown /api routes (instead of falling through to the SPA). */
function notFoundHandler(req, res, next) {
  if (!req.path.startsWith('/api')) return next();
  const requestId = requestContext.getRequestId() || req.id;
  return res.status(404).json({ message: 'Resource not found', code: 'NOT_FOUND', requestId });
}

/** Express error-handling middleware (must be the LAST app.use). */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const requestId = requestContext.getRequestId() || req.id;
  const { status, code, expose, message } = classify(err);

  // Log: 5xx are errors (with stack), 4xx are warnings (client mistakes).
  const logLevel = status >= 500 ? 'error' : 'warn';
  logger.event(logLevel, `${req.method} ${req.originalUrl} -> ${status} ${code || ''}: ${err?.message || message}`, {
    status,
    code,
    requestId,
    stack: status >= 500 ? err?.stack : undefined,
  });

  // If headers already went out (e.g. a stream started), delegate to Express.
  if (res.headersSent) return next(err);

  const exposeDetail = appConfig.get('EXPOSE_ERROR_DETAIL') === 'true';
  const clientMessage = status >= 500 && !expose
    ? 'Internal server error'
    : (message || 'Request failed');

  const body = { message: clientMessage, code: code || 'ERROR', requestId };
  if (exposeDetail && err?.message && clientMessage !== err.message) {
    body.detail = err.message;
  }
  return res.status(status).json(body);
}

module.exports = { errorHandler, notFoundHandler, classify };
