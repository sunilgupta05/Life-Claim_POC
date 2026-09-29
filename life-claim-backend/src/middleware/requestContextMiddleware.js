// src/middleware/requestContextMiddleware.js
//
// Correlation/request id + access logging (roadmap 3.3/3.4).
//
// 1) requestId(): assigns every request a correlation id (honouring an inbound
//    X-Request-Id / X-Correlation-Id so ids flow across services), echoes it back
//    in the response header, and binds a per-request context (AsyncLocalStorage)
//    so the logger stamps that id on ANY line logged while handling the request —
//    no call-site changes needed. Also exposes it as req.id.
//
// 2) accessLog(): one structured `http`-level line per completed request with
//    method, path, status, duration and the correlation id.

const crypto = require('crypto');
const requestContext = require('../util/requestContext');
const logger = require('../util/logger');

const HEADER = 'X-Request-Id';
const INBOUND_HEADERS = ['x-request-id', 'x-correlation-id'];

const isSafeId = (v) => typeof v === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(v);

function newId() {
  // uuid-like, dependency-free.
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

/** Bind a fresh request context (with correlation id) for the whole request. */
function requestId(req, res, next) {
  let id;
  for (const h of INBOUND_HEADERS) {
    const candidate = req.headers[h];
    if (isSafeId(candidate)) { id = candidate; break; }
  }
  if (!id) id = newId();

  req.id = id;
  res.setHeader(HEADER, id);

  requestContext.run({ requestId: id }, () => next());
}

/** Structured access log emitted when the response finishes. */
function accessLog(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    // Late-bind the authenticated user (populated by auth middleware downstream).
    const user = req.user?.username || req.user?.preferred_username;
    if (user) requestContext.set({ userId: user });
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'warn' : 'http';
    logger.event(level, `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`, {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
      user: user || undefined,
    });
  });
  next();
}

module.exports = { requestId, accessLog, HEADER };
