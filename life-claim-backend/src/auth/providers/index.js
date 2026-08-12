// src/auth/providers/index.js
//
// Login-provider registry (roadmap 1.4). Maps an AUTH_METHOD to its provider.
// hybrid/keycloak are NOT here — they keep using the existing untouched Keycloak
// password-grant proxy handler in authRoutes.js.

const localProvider = require('./localProvider');
const ldapProvider = require('./ldapProvider');
const oidcProvider = require('./oidcProvider');
const samlProvider = require('./samlProvider');

const PROVIDERS = {
  local: localProvider,
  ldap: ldapProvider,
  oidc: oidcProvider,
  saml: samlProvider,
};

/** Return the provider for a method, or throw a clear error if unsupported here. */
function getProvider(method) {
  const p = PROVIDERS[method];
  if (!p) {
    const err = new Error(`No login provider registered for AUTH_METHOD="${method}".`);
    err.status = 500;
    throw err;
  }
  return p;
}

module.exports = { getProvider, PROVIDERS };
