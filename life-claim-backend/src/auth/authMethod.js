// src/auth/authMethod.js
//
// Pluggable authentication — method resolver (roadmap 1.4).
//
// The active auth method is selected by config (AUTH_METHOD) instead of being
// hardcoded per instance. It resolves through the 0.3 config service, so it is
// DB → .env → default, and can be changed at runtime.
//
//   hybrid  (DEFAULT) — today's behaviour: login via the Keycloak password-grant
//                       proxy, and per-request verification auto-detects a
//                       Keycloak token OR a local HS256 JWT. Nothing changes.
//   keycloak          — Keycloak only.
//   local             — local username/password (bcrypt) → local HS256 JWT.
//   ldap              — validate against LDAP, then mint a local JWT.
//   oidc              — OIDC resource-owner-password grant, then mint a local JWT
//                       (form-compatible). OIDC auth-code is redirect-based.
//   saml              — SAML SSO (redirect / assertion-consumer flow).
//
// External providers (ldap/oidc/saml) only validate the user AT LOGIN and then
// mint a local JWT, so the existing per-request verification middleware is not
// touched — that is what keeps this change non-breaking.

const appConfig = require('../config/configService');

const METHODS = Object.freeze({
  HYBRID: 'hybrid',
  KEYCLOAK: 'keycloak',
  LOCAL: 'local',
  LDAP: 'ldap',
  OIDC: 'oidc',
  SAML: 'saml',
});

const VALID = new Set(Object.values(METHODS));

// Methods whose login is a normal username/password form post (no browser
// redirect to an external IdP). OIDC here means the resource-owner-password
// grant; OIDC auth-code is treated as redirect (see isRedirect + oidcProvider).
const FORM_METHODS = new Set([METHODS.HYBRID, METHODS.KEYCLOAK, METHODS.LOCAL, METHODS.LDAP, METHODS.OIDC]);

// Methods that require a browser redirect to the IdP (assertion/callback flow).
const REDIRECT_METHODS = new Set([METHODS.SAML]);

// Methods handled by the pluggable provider registry at the login step. hybrid
// and keycloak keep using the existing untouched Keycloak proxy handler.
const PROVIDER_METHODS = new Set([METHODS.LOCAL, METHODS.LDAP, METHODS.OIDC, METHODS.SAML]);

/** Resolve the configured method, normalized; unknown/empty ⇒ 'hybrid'. */
function getAuthMethod() {
  const raw = String(appConfig.get('AUTH_METHOD', METHODS.HYBRID) || METHODS.HYBRID)
    .trim()
    .toLowerCase();
  return VALID.has(raw) ? raw : METHODS.HYBRID;
}

/** True when login is a username/password form (no IdP redirect). */
function isFormLogin(method = getAuthMethod()) {
  return FORM_METHODS.has(method);
}

/** True when login requires a redirect to an external IdP. */
function isRedirect(method = getAuthMethod()) {
  return REDIRECT_METHODS.has(method);
}

/** True when the pluggable provider registry owns this method's login step. */
function usesProvider(method = getAuthMethod()) {
  return PROVIDER_METHODS.has(method);
}

module.exports = {
  METHODS,
  VALID,
  getAuthMethod,
  isFormLogin,
  isRedirect,
  usesProvider,
};
