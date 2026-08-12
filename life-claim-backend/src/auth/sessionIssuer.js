// src/auth/sessionIssuer.js
//
// Issue a local session for a user authenticated by an EXTERNAL identity
// provider (LDAP / OIDC / SAML) — roadmap 1.4.
//
// The user is validated by the IdP at login; we then mint our own local HS256
// JWT so that per-request verification uses the existing local-JWT path with no
// change. The token carries `authSource` so verification can trust the token's
// identity/roles without requiring a row in the local `users` table (external
// users are not necessarily provisioned locally) — see
// authService.authenticateUser, which special-cases this claim additively.

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const jwtUtil = require('../util/jwtUtil');
const { setAuthCookies, storeAuthSession } = require('../util/authCookies');
const { recordLogin } = require('../services/auditLogService');
const logger = require('../config/logConfig');

// Auth sources whose tokens are self-contained (no local users row required).
const EXTERNAL_SOURCES = new Set(['ldap', 'oidc', 'saml']);

/**
 * Mint a local JWT for an externally-authenticated user, set the auth cookies,
 * record the login audit, and return the response payload the frontend expects.
 *
 * @returns {{ tokenResponse: object, userProfile: object }}
 */
async function issueExternalSession({ source, username, roles = [], email = null, req = {}, res }) {
  if (!EXTERNAL_SOURCES.has(source)) {
    throw new Error(`issueExternalSession: unsupported source "${source}"`);
  }
  const uname = String(username || '').trim();
  if (!uname) {
    const err = new Error('Identity provider did not return a username.');
    err.status = 502;
    throw err;
  }

  const sessionId = crypto.randomUUID();
  const token = jwtUtil.sign({
    userId: null,
    username: uname,
    roles,
    email,
    sessionId,
    authSource: source,
  });

  // expires_in (seconds) for the cookie maxAge + the response, from the JWT exp.
  const decoded = jwt.decode(token) || {};
  const expiresIn = decoded.exp
    ? Math.max(60, decoded.exp - Math.floor(Date.now() / 1000))
    : 1800;

  const tokenResponse = { access_token: token, expires_in: expiresIn, token_type: 'Bearer' };
  if (res) setAuthCookies(res, tokenResponse);
  storeAuthSession(req, tokenResponse);

  try {
    await recordLogin({
      username: uname,
      ipAddress: req.ip,
      userAgent: typeof req.get === 'function' ? req.get('user-agent') : undefined,
      roles,
    });
  } catch (e) {
    logger.warn(`[auth:${source}] login audit failed for ${uname}: ${e.message}`);
  }

  const userProfile = {
    sub: uname,
    preferred_username: uname,
    roles,
    email,
    given_name: null,
    family_name: null,
    authSource: source,
  };
  return { tokenResponse, userProfile };
}

module.exports = { issueExternalSession, EXTERNAL_SOURCES };
