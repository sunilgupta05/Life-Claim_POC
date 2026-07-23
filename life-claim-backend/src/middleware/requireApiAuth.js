const { protect } = require('./keycloak');

const PUBLIC_API_ROUTES = [
  { method: 'POST', path: '/api/auth/keycloak/token' },
  { method: 'POST', path: '/api/auth/keycloak/refresh' },
  { method: 'POST', path: '/api/auth/clear-token-cookie' },
  { method: 'POST', path: '/api/auth/logout-audit' },
  { method: 'POST', path: '/api/user/login' },
];

const normalizePath = (req) => {
  const raw = req.originalUrl || req.url || '';
  return raw.split('?')[0];
};

const isPublicApiRoute = (req) =>
  PUBLIC_API_ROUTES.some(
    (route) => route.method === req.method && route.path === normalizePath(req)
  );

const hasBearerOrCookie = (req) => {
  const header = req.headers.authorization || '';
  const bearer = header.replace(/^Bearer\s+/i, '').trim();
  return Boolean(
    bearer || (req.cookies && req.cookies.token) || (req.session && req.session.accessToken)
  );
};

/**
 * Default-deny API auth. Must run AFTER keycloak.middleware() so Bearer tokens are
 * attached to req.kauth before this check (see app.js mount order).
 */
function requireApiAuth(req, res, next) {
  if (isPublicApiRoute(req)) {
    return next();
  }

  if (req.kauth?.grant?.access_token) {
    return next();
  }

  if (!hasBearerOrCookie(req)) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  // Legacy HS256 JWT or Keycloak token not yet attached — full validation.
  return protect()(req, res, next);
}

module.exports = {
  requireApiAuth,
  PUBLIC_API_ROUTES,
};
