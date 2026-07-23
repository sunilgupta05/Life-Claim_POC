const rateLimit = require('express-rate-limit');

/** Login / token issuance — stricter cap */
const authTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 50),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' },
});

/** Legacy username/password login (if used) */
const legacyLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

/** Logout audit — best-effort during sign-out; rate-limited, no strict Keycloak re-check */
const logoutAuditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_LOGOUT_AUDIT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many logout audit requests. Please try again later.' },
});

/** General API burst control (optional env to disable: RATE_LIMIT_API_MAX=0) */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.method === 'OPTIONS' || Number(process.env.RATE_LIMIT_API_MAX ?? 300) === 0,
  message: { message: 'Too many requests. Please slow down.' },
});

module.exports = {
  authTokenLimiter,
  legacyLoginLimiter,
  logoutAuditLimiter,
  apiLimiter,
};
