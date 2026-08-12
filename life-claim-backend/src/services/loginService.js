// src/services/loginService.js
//
// Login dispatch for pluggable authentication (roadmap 1.4).
//
// Called by the /api/auth/keycloak/token handler ONLY when AUTH_METHOD is a
// provider-backed method (local/ldap/oidc/saml). hybrid + keycloak never reach
// here — they use the existing untouched Keycloak proxy. This keeps the default
// login path byte-identical to before.
//
// It normalizes the request (decrypts an encrypted password exactly as the
// Keycloak handler does), dispatches to the provider, and writes the standard
// login response ({ expires_in, token_type, user }). Providers set the auth
// cookies themselves via the shared session issuer.

const loginCrypto = require('./loginCrypto');
const { getProvider } = require('../auth/providers');
const { getAuthMethod } = require('../auth/authMethod');

/** Decrypt the login password if the client sent it encrypted (mirrors authRoutes). */
function resolvePassword(req) {
  let password = String(req.body?.password || '');
  const encrypted =
    req.body?.password_encrypted === true ||
    req.body?.password_encrypted === 'true' ||
    req.body?.password_encrypted === '1';

  if (encrypted) {
    if (!loginCrypto.isEncryptionEnabled()) {
      const err = new Error('Login password encryption is not configured on the server.');
      err.status = 503;
      err.code = 'encryption_unavailable';
      throw err;
    }
    password = loginCrypto.decryptPassword(password); // throws → caught by caller
  }
  return password;
}

/**
 * Dispatch a form login to the configured provider and write the response.
 * @returns {Promise<void>}
 */
async function login(req, res) {
  const method = getAuthMethod();
  const provider = getProvider(method);

  const username = req.body?.username;
  const captchaToken = req.body?.captchaToken;
  const password = resolvePassword(req);

  const { tokenResponse, userProfile } = await provider.login({
    username,
    password,
    captchaToken,
    req,
    res,
  });

  res.json({
    expires_in: tokenResponse?.expires_in,
    token_type: tokenResponse?.token_type || 'Bearer',
    user: userProfile,
  });
}

module.exports = { login, resolvePassword };
