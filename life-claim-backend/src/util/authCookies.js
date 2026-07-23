const { extractKeycloakRoles, extractKeycloakUsername } = require('./keycloakRoles');

function cookieBaseOptions() {
  const useHttps = process.env.USE_HTTPS === 'true';
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? true : (useHttps ? true : 'auto'),
    sameSite: 'lax',
    path: '/api',
  };
}

function setAuthCookies(res, tokenResponse = {}) {
  const base = cookieBaseOptions();
  const accessToken = tokenResponse.access_token;
  const refreshToken = tokenResponse.refresh_token;
  const accessMaxMs = Math.max(60, Number(tokenResponse.expires_in) || 3600) * 1000;
  const refreshMaxMs = Math.max(60, Number(tokenResponse.refresh_expires_in) || 86400) * 1000;

  if (accessToken) {
    res.cookie('token', accessToken, { ...base, maxAge: accessMaxMs });
  }
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, { ...base, maxAge: refreshMaxMs });
  }
}

function clearAuthCookies(res) {
  const base = cookieBaseOptions();
  res.clearCookie('token', base);
  res.clearCookie('refreshToken', base);
}

function extractUserProfile(payload) {
  if (!payload || typeof payload !== 'object') return null;
  return {
    sub: payload.sub || null,
    preferred_username: extractKeycloakUsername(payload),
    roles: extractKeycloakRoles(payload),
    email: payload.email || null,
    given_name: payload.given_name || null,
    family_name: payload.family_name || null,
    exp: payload.exp || null,
  };
}

function storeAuthSession(req, tokenResponse = {}) {
  if (!req.session) return;
  const accessToken = tokenResponse.access_token;
  const refreshToken = tokenResponse.refresh_token;
  if (accessToken) req.session.accessToken = accessToken;
  if (refreshToken) req.session.refreshToken = refreshToken;
}

function clearAuthSession(req) {
  if (!req.session) return;
  delete req.session.accessToken;
  delete req.session.refreshToken;
}

/** Promote httpOnly cookie or server session token into Authorization for Keycloak middleware. */
function injectBearerFromSession(req, res, next) {
  if (!req.headers.authorization) {
    const token = readAccessToken(req);
    if (token) req.headers.authorization = `Bearer ${token}`;
  }
  next();
}

function readAccessToken(req) {
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  return (
    bearer ||
    (req.cookies && req.cookies.token) ||
    (req.session && req.session.accessToken) ||
    null
  );
}

function readRefreshToken(req) {
  return (
    (req.cookies && req.cookies.refreshToken) ||
    (req.session && req.session.refreshToken) ||
    null
  );
}

module.exports = {
  cookieBaseOptions,
  setAuthCookies,
  clearAuthCookies,
  storeAuthSession,
  clearAuthSession,
  injectBearerFromSession,
  extractUserProfile,
  readAccessToken,
  readRefreshToken,
};
