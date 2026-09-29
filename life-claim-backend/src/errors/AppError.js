// src/errors/AppError.js hello
//
// Centralized error hierarchy (roadmap 3.3). One base class carrying the HTTP
// status, a stable machine-readable `code`, and an `expose` flag that decides
// whether the message is safe to send to the client. The global error handler
// (app.js) reads these fields to build a consistent response shape:
//     { message, code, requestId }
//
// Existing code that throws plain Errors or sets res.status() itself keeps
// working unchanged — the handler treats an unknown error as a 500 with a
// generic message, exactly as before. These classes are the *preferred* way to
// signal an expected failure so the status/code/message stay consistent.

/**
 * @param {number} status  HTTP status code
 * @param {string} message client-facing message (only sent when `expose`)
 * @param {object} [opts]
 * @param {string} [opts.code]    stable machine code, e.g. 'NOT_FOUND'
 * @param {boolean} [opts.expose] send `message` to the client (default: status < 500)
 * @param {*} [opts.details]      extra structured info (never sent for 5xx)
 * @param {Error} [opts.cause]    underlying error (kept for logs, never sent)
 */
class AppError extends Error {
  constructor(status, message, opts = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = opts.code || defaultCodeFor(status);
    this.expose = opts.expose ?? status < 500;
    this.details = opts.details;
    if (opts.cause) this.cause = opts.cause;
    // Mark so the handler knows this was a deliberate, modeled error.
    this.isAppError = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

function defaultCodeFor(status) {
  const map = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
    502: 'UPSTREAM_ERROR',
    503: 'SERVICE_UNAVAILABLE',
    504: 'UPSTREAM_TIMEOUT',
  };
  return map[status] || (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR');
}

// ---- common subclasses (thin, for readable throw sites) --------------------

class BadRequestError extends AppError {
  constructor(message = 'Bad request', opts) { super(400, message, { code: 'BAD_REQUEST', ...opts }); }
}
class ValidationError extends AppError {
  constructor(message = 'Validation failed', opts) { super(422, message, { code: 'VALIDATION_ERROR', ...opts }); }
}
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', opts) { super(401, message, { code: 'UNAUTHORIZED', ...opts }); }
}
class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', opts) { super(403, message, { code: 'FORBIDDEN', ...opts }); }
}
class NotFoundError extends AppError {
  constructor(message = 'Not found', opts) { super(404, message, { code: 'NOT_FOUND', ...opts }); }
}
class ConflictError extends AppError {
  constructor(message = 'Conflict', opts) { super(409, message, { code: 'CONFLICT', ...opts }); }
}
// Integration/dependency failures — surfaced by the resilience layer (3.1).
class UpstreamError extends AppError {
  constructor(message = 'Upstream dependency failed', opts) { super(502, message, { code: 'UPSTREAM_ERROR', ...opts }); }
}
class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', opts) { super(503, message, { code: 'SERVICE_UNAVAILABLE', ...opts }); }
}

module.exports = {
  AppError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UpstreamError,
  ServiceUnavailableError,
};
