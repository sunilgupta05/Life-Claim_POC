const express = require('express');
const https = require('https');
const authService = require('../services/authService');
const axios = require('axios');
const qs = require('qs');
const db = require('../config/dbConfig');
const { recordLogin, recordLogout } = require('../services/auditLogService');
const { authTokenLimiter, logoutAuditLimiter } = require('../middleware/rateLimiters');
const userDao = require('../dataAccess/userDao');
const keycloakLoginLockout = require('../services/keycloakLoginLockout');
const { verifyRecaptchaToken } = require('../services/recaptchaService');
const { validateKeycloakTokenBody, validateAuthenticateBody } = require('../middleware/requestValidation');
const loginCrypto = require('../services/loginCrypto');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/keycloak');
const { extractKeycloakRoles, extractKeycloakUsername } = require('../util/keycloakRoles');
const { isRetiredAdminUsername } = require('../util/superuserRoles');
const {
  setAuthCookies,
  clearAuthCookies,
  storeAuthSession,
  clearAuthSession,
  extractUserProfile,
  readAccessToken,
  readRefreshToken,
} = require('../util/authCookies');

const router = express.Router();
const SINGLE_SESSION_ENFORCED = process.env.SINGLE_SESSION_ENFORCED !== 'false';

/** Clears httpOnly auth cookies (VAPT: session hygiene). No auth required. */
router.post('/clear-token-cookie', (req, res) => {
  clearAuthCookies(res);
  clearAuthSession(req);
  res.status(204).send();
});

const decodeJwtPayload = (token) => {
  try {
    const payloadPart = token.split('.')[1];
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
};

function keycloakAxiosOptions() {
  const opts = {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: Number(process.env.KEYCLOAK_REQUEST_TIMEOUT_MS || 20000),
  };
  // Keep insecure TLS for non-production troubleshooting only.
  const insecureTlsRequested = process.env.KEYCLOAK_TLS_INSECURE === 'true';
  const allowInsecureTls = insecureTlsRequested && process.env.NODE_ENV !== 'production';
  if (allowInsecureTls) {
    opts.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  } else if (insecureTlsRequested && process.env.NODE_ENV === 'production') {
    console.error('[security] KEYCLOAK_TLS_INSECURE=true is ignored in production.');
  }
  return opts;
}

// Proxy route for Keycloak token endpoint to avoid CORS issues
router.post('/keycloak/token', authTokenLimiter, validateKeycloakTokenBody, async (req, res, next) => {
  const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
  const tokenEndpoint = `${keycloakUrl.replace(/\/$/, '')}/realms/life-claims/protocol/openid-connect/token`;
  const loginUsername = req.body?.username;
  const captchaToken = req.body?.captchaToken;

  try {
    await verifyRecaptchaToken(captchaToken);
  } catch (captchaErr) {
    return res.status(captchaErr.status || 400).json({
      error: 'captcha_failed',
      error_description: captchaErr.message || 'reCAPTCHA verification failed.',
    });
  }

  if (loginUsername && isRetiredAdminUsername(loginUsername)) {
    return res.status(403).json({
      error: 'account_retired',
      error_description: 'The admin account is no longer available. Please sign in with superuser.',
    });
  }

  if (loginUsername && keycloakLoginLockout.enabled()) {
    const blocked = keycloakLoginLockout.isBlocked(loginUsername);
    if (blocked.blocked) {
      const mins = Math.max(1, Math.ceil(blocked.remainingMs / 60000));
      return res.status(403).json({
        error: 'account_temporarily_locked',
        error_description: `Too many failed sign-in attempts. Try again in about ${mins} minute(s).`,
        lockout: true,
        remainingMs: blocked.remainingMs,
      });
    }
  }

  try {
    let password = String(req.body.password || '');
    const passwordEncrypted =
      req.body.password_encrypted === true ||
      req.body.password_encrypted === 'true' ||
      req.body.password_encrypted === '1';

    if (passwordEncrypted) {
      if (!loginCrypto.isEncryptionEnabled()) {
        return res.status(503).json({
          error: 'encryption_unavailable',
          error_description: 'Login password encryption is not configured on the server.',
        });
      }
      try {
        password = loginCrypto.decryptPassword(password);
      } catch (decryptErr) {
        return res.status(400).json({
          error: 'invalid_password_encryption',
          error_description: decryptErr.message || 'Could not decrypt login password.',
        });
      }
    } else if (process.env.REQUIRE_ENCRYPTED_LOGIN === 'true') {
      return res.status(400).json({
        error: 'password_encryption_required',
        error_description: 'Encrypted login password is required.',
      });
    }

    const keycloakBody = {
      client_id: req.body.client_id,
      grant_type: req.body.grant_type,
      username: req.body.username,
      password,
    };
    if (req.body.scope) keycloakBody.scope = req.body.scope;
    if (req.body.client_secret) keycloakBody.client_secret = req.body.client_secret;

    const response = await axios.post(
      tokenEndpoint,
      qs.stringify(keycloakBody),
      keycloakAxiosOptions()
    );

    // Mirror login-audit behavior for Keycloak-based login flow.
    const accessToken = response.data?.access_token || '';
    const payload = decodeJwtPayload(accessToken) || jwt.decode(accessToken) || null;
    const username = extractKeycloakUsername(payload) || req.body?.username;
    const roles = extractKeycloakRoles(payload);
    const sessionId = payload?.sid || payload?.jti || null;

    if (SINGLE_SESSION_ENFORCED && username && sessionId) {
      const user = await userDao.getUserByUsername(username);
      const existing = user?.current_session_id || null;
      if (existing && existing !== sessionId) {
        return res.status(403).json({
          message: 'Concurrent login is not allowed. Please logout from your active session first.',
        });
      }
      if (user?.id) {
        await userDao.setCurrentSessionIdByUserId(user.id, sessionId);
      }
    }

    if (username) {
      keycloakLoginLockout.clearFailures(loginUsername || username);
      await recordLogin({
        username,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        roles,
      });
    }

    setAuthCookies(res, response.data);
    storeAuthSession(req, response.data);
    const userProfile =
      extractUserProfile(payload) ||
      (username
        ? {
            sub: payload?.sub || username,
            preferred_username: username,
            roles,
            email: payload?.email || null,
            given_name: payload?.given_name || null,
            family_name: payload?.family_name || null,
            exp: payload?.exp || null,
          }
        : null);
    res.json({
      expires_in: response.data.expires_in,
      token_type: response.data.token_type,
      user: userProfile,
    });
  } catch (error) {
    if (error.response) {
      const data = error.response.data || {};
      // Only count end-user credential failures, not invalid_client / misconfiguration.
      const grantFailed =
        loginUsername &&
        keycloakLoginLockout.enabled() &&
        data.error === 'invalid_grant';

      if (grantFailed) {
        const r = keycloakLoginLockout.recordFailure(loginUsername);
        if (r.justLocked) {
          const mins = Math.max(1, Math.ceil(keycloakLoginLockout.lockDurationMs() / 60000));
          return res.status(403).json({
            error: 'account_temporarily_locked',
            error_description: `Too many failed sign-in attempts. This account is temporarily locked for about ${mins} minute(s).`,
            lockout: true,
            remainingMs: r.remainingMs,
          });
        }
        // Normalize invalid login error to avoid reflecting IdP-specific wording.
        return res.status(401).json({
          error: 'invalid_credentials',
          error_description: 'Invalid username or password.',
        });
      }

      // Keycloak returned an error
      res.status(error.response.status).json(error.response.data);
      return;
    }
    // Network: ECONNREFUSED, socket hang up, ETIMEDOUT, wrong http/https, Keycloak down, TLS mismatch
    const code = error.code || '';
    const msg = error.message || 'Unknown error';
    console.error(
      `[auth] Keycloak token request failed → ${tokenEndpoint} | ${code} ${msg}`
    );
    const body = {
      error: 'keycloak_unreachable',
      message: 'Login service is temporarily unavailable. Please try again later.',
    };
    if (process.env.NODE_ENV !== 'production') {
      body.detail = msg;
      body.code = code || undefined;
      body.attemptedUrl = tokenEndpoint;
    }
    res.status(503).json(body);
  }
});

router.post('/logout-audit', logoutAuditLimiter, async (req, res) => {
  const token = readAccessToken(req);
  const payload = token ? decodeJwtPayload(token) : null;
  const username = payload?.preferred_username || payload?.sub || null;
  if (!username) {
    return res.status(400).json({ message: 'Logout audit requires a session token.' });
  }
  const sessionId = payload?.sid || payload?.jti || null;
  const rawReason = req.body?.logoutReason ?? req.body?.reason;
  const logoutReason =
    typeof rawReason === 'string' && rawReason.trim() ? rawReason.trim().slice(0, 128) : '';

  if (username) {
    await recordLogout({ username, logoutReason: logoutReason || undefined });
    const user = await userDao.getUserByUsername(username);
    if (user?.id) {
      const existing = user.current_session_id || null;
      if (!sessionId || !existing || existing === sessionId) {
        await userDao.setCurrentSessionIdByUserId(user.id, null);
      }
    }
  }

  res.status(204).send();
});

router.post('/authenticate', protect(), validateAuthenticateBody, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = bearer || (req.cookies && req.cookies.token) || req.body.token;
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const user = await authService.authenticateUser(token);
      res.json({ message: 'Authentication successful', user: { username: user.username, roles: user.roles } });
    } catch (authError) {
      const payload = decodeJwtPayload(token || '');
      if (payload?.preferred_username) {
        const logoutReason = authError.message.includes('Session expired')
          ? 'concurrent_login'
          : 'auth_failed';
        await recordLogout({ username: payload.preferred_username, logoutReason });
      }
      if (authError.message.includes('Session expired')) {
        res.clearCookie('token', cookieOptsForClear()); // Clear the cookie if session expired elsewhere
        return res.status(401).json({ 
          message: 'Your session has expired because you logged in from another device.',
          concurrentLogout: true 
        });
      }
      throw authError; // Rethrow other errors
    }
  } catch (error) {
    next(error);
  }
});

/** Keycloak refresh_token grant — refresh token read from httpOnly cookie when present. */
router.post('/keycloak/refresh', authTokenLimiter, async (req, res) => {
  const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
  const tokenEndpoint = `${keycloakUrl.replace(/\/$/, '')}/realms/life-claims/protocol/openid-connect/token`;
  const refreshToken = String(
    req.body?.refresh_token || req.body?.refreshToken || readRefreshToken(req) || '',
  ).trim();
  if (!refreshToken) {
    return res.status(400).json({ error: 'invalid_request', message: 'refresh_token is required.' });
  }
  try {
    const response = await axios.post(
      tokenEndpoint,
      qs.stringify({
        client_id: 'life-claims-frontend',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      keycloakAxiosOptions()
    );
    const payload = decodeJwtPayload(response.data?.access_token || '');
    setAuthCookies(res, response.data);
    storeAuthSession(req, response.data);
    res.json({
      ok: true,
      expires_in: response.data.expires_in,
      user: extractUserProfile(payload),
    });
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(503).json({
      error: 'keycloak_unreachable',
      message: 'Could not refresh session with Keycloak.',
    });
  }
});

/**
 * Keycloak single-session: detect if this browser's session id was replaced by a newer login.
 */
router.get('/session-check', async (req, res) => {
  const token = readAccessToken(req);
  const payload = token ? (decodeJwtPayload(token) || jwt.decode(token)) : null;

  if (!payload) {
    return res.status(401).json({ message: 'Invalid session.' });
  }

  const exp = Number(payload.exp) || 0;
  if (exp && exp <= Math.floor(Date.now() / 1000)) {
    clearAuthCookies(res);
    clearAuthSession(req);
    return res.status(401).json({ message: 'Session expired.' });
  }

  const user = extractUserProfile(payload);

  if (!SINGLE_SESSION_ENFORCED) {
    return res.json({ ok: true, singleSessionEnforced: false, user });
  }

  const username = user?.preferred_username || payload.sub;
  const sessionId = payload.sid || payload.jti || null;
  if (!username || !sessionId) {
    return res.json({ ok: true, singleSessionEnforced: true, user });
  }
  const dbUser = await userDao.getUserByUsername(username);
  const existing = dbUser?.current_session_id || null;
  if (existing && existing !== sessionId) {
    clearAuthCookies(res);
    return res.status(401).json({
      message: 'Your session has expired because you logged in from another device.',
      concurrentLogout: true,
    });
  }
  return res.json({ ok: true, singleSessionEnforced: true, user });
});

module.exports = router;
