// src/auth/providers/oidcProvider.js
//
// AUTH_METHOD=oidc — validate credentials against a generic OIDC provider using
// the Resource-Owner-Password grant (form-compatible, so the existing login form
// works unchanged), map a claim to app roles, then mint a local JWT (roadmap 1.4).
//
// ROPC talks directly to the provider's token endpoint over TLS in the same
// request, so this uses axios (already a dependency) + a claim decode — no extra
// package is needed. The redirect-based OIDC auth-code flow is handled by the
// SSO scaffold (samlProvider / /sso endpoints) and is gated off until configured.
//
// Config (0.3 config service → DB/.env):
//   OIDC_ISSUER            https://idp.example.com/realms/x   (for discovery)
//   OIDC_TOKEN_ENDPOINT    explicit token URL (skips discovery)
//   OIDC_CLIENT_ID
//   OIDC_CLIENT_SECRET     (secret; .env only)
//   OIDC_SCOPE             [default: "openid profile email"]
//   OIDC_USERNAME_CLAIM    [default: "preferred_username"]
//   OIDC_ROLE_CLAIM        e.g. "groups" or "realm_access.roles" [default: "groups"]
//   OIDC_ROLE_MAP          {"claims-assessor":["Assessor"]}
//   OIDC_DEFAULT_ROLES     ["Assessor"]

const axios = require('axios');
const qs = require('qs');
const jwt = require('jsonwebtoken');
const appConfig = require('../../config/configService');
const { verifyRecaptchaToken } = require('../../services/recaptchaService');
const { issueExternalSession } = require('../sessionIssuer');
const { mapExternalRoles, parseJsonConfig } = require('../roleMapping');

const cfg = (k, d) => appConfig.get(k, d);

/** Read a possibly-dotted claim path ("realm_access.roles") from a payload. */
function readClaim(payload, path) {
  if (!payload || !path) return undefined;
  return String(path).split('.').reduce((o, k) => (o == null ? o : o[k]), payload);
}

async function resolveTokenEndpoint() {
  const explicit = cfg('OIDC_TOKEN_ENDPOINT');
  if (explicit) return explicit;
  const issuer = cfg('OIDC_ISSUER');
  if (!issuer) return null;
  const wellKnown = `${String(issuer).replace(/\/$/, '')}/.well-known/openid-configuration`;
  const { data } = await axios.get(wellKnown, { timeout: Number(cfg('OIDC_REQUEST_TIMEOUT_MS', 20000)) });
  return data && data.token_endpoint ? data.token_endpoint : null;
}

async function login({ username, password, captchaToken, req, res }) {
  await verifyRecaptchaToken(captchaToken);

  if (!username || !password) {
    const err = new Error('Username and password are required.');
    err.status = 400;
    throw err;
  }

  const clientId = cfg('OIDC_CLIENT_ID');
  if (!clientId || !(cfg('OIDC_ISSUER') || cfg('OIDC_TOKEN_ENDPOINT'))) {
    const err = new Error('OIDC is not configured (set OIDC_CLIENT_ID and OIDC_ISSUER or OIDC_TOKEN_ENDPOINT).');
    err.status = 501;
    err.code = 'AUTH_NOT_CONFIGURED';
    throw err;
  }

  const tokenEndpoint = await resolveTokenEndpoint();
  if (!tokenEndpoint) {
    const err = new Error('OIDC token endpoint could not be resolved.');
    err.status = 501;
    err.code = 'AUTH_NOT_CONFIGURED';
    throw err;
  }

  const body = {
    grant_type: 'password',
    client_id: clientId,
    username,
    password,
    scope: cfg('OIDC_SCOPE', 'openid profile email'),
  };
  const clientSecret = process.env.OIDC_CLIENT_SECRET;
  if (clientSecret) body.client_secret = clientSecret;

  let tokenData;
  try {
    const resp = await axios.post(tokenEndpoint, qs.stringify(body), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: Number(cfg('OIDC_REQUEST_TIMEOUT_MS', 20000)),
    });
    tokenData = resp.data;
  } catch (e) {
    if (e.response && (e.response.status === 400 || e.response.status === 401)) {
      const err = new Error('Invalid username or password.');
      err.status = 401;
      throw err;
    }
    const err = new Error('Login service (OIDC) is temporarily unavailable.');
    err.status = 503;
    throw err;
  }

  // The id_token/access_token came directly from the trusted IdP token endpoint
  // over TLS in this request; decode it for identity + role claims.
  const claims = jwt.decode(tokenData.id_token || tokenData.access_token) || {};
  const usernameClaim = cfg('OIDC_USERNAME_CLAIM', 'preferred_username');
  const resolvedUsername = readClaim(claims, usernameClaim) || claims.sub || username;
  const email = claims.email || null;

  const roleClaim = cfg('OIDC_ROLE_CLAIM', 'groups');
  const rawRoles = readClaim(claims, roleClaim) || [];
  const roles = mapExternalRoles(
    Array.isArray(rawRoles) ? rawRoles : [rawRoles],
    parseJsonConfig(cfg('OIDC_ROLE_MAP'), {}),
    parseJsonConfig(cfg('OIDC_DEFAULT_ROLES'), [])
  );

  return issueExternalSession({ source: 'oidc', username: resolvedUsername, roles, email, req, res });
}

module.exports = { login, method: 'oidc', formLogin: true };
