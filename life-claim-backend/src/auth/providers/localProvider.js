// src/auth/providers/localProvider.js
//
// AUTH_METHOD=local — username/password against the local `users` table
// (bcrypt), issuing a local HS256 JWT. This wraps the existing, fully-working
// authService.loginUser so behaviour (lockout, single-session, audit, reCAPTCHA)
// is unchanged; it just also sets the auth cookies + returns the standard shape.

const jwt = require('jsonwebtoken');
const authService = require('../../services/authService');
const { setAuthCookies, storeAuthSession } = require('../../util/authCookies');

async function login({ username, password, captchaToken, req, res }) {
  const meta = {
    ipAddress: req?.ip,
    userAgent: typeof req?.get === 'function' ? req.get('user-agent') : undefined,
  };
  // loginUser handles reCAPTCHA, lockout, single-session, audit + JWT minting.
  const { token, user } = await authService.loginUser(username, password, captchaToken, meta);

  const decoded = jwt.decode(token) || {};
  const expiresIn = decoded.exp
    ? Math.max(60, decoded.exp - Math.floor(Date.now() / 1000))
    : 1800;
  const tokenResponse = { access_token: token, expires_in: expiresIn, token_type: 'Bearer' };
  if (res) setAuthCookies(res, tokenResponse);
  storeAuthSession(req, tokenResponse);

  const userProfile = {
    sub: user.username,
    preferred_username: user.username,
    roles: user.roles || [],
    email: user.email || null,
    last_login_at: user.last_login_at || null,
    authSource: 'local',
  };
  return { tokenResponse, userProfile };
}

module.exports = { login, method: 'local', formLogin: true };
