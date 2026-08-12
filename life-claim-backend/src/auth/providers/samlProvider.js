// src/auth/providers/samlProvider.js
//
// AUTH_METHOD=saml — SAML 2.0 SSO via browser redirect + assertion-consumer
// (ACS) callback (roadmap 1.4).
//
// SCOPE (confirmed): the redirect flow is SCAFFOLDED, not shipped as verified
// production auth. The provider interface and the /sso endpoints exist and the
// implementation uses the optional `@node-saml/node-saml` package, but it stays
// INERT until an operator both configures the IdP and explicitly enables it
// (SAML_ENABLED=true). Password-form login() is not applicable to SAML and
// returns a clear, actionable error. Enable + integration-test against the real
// IdP before using in production.
//
// Config (0.3 config service → DB/.env):
//   SAML_ENABLED         "true" to activate (default off → config error)
//   SAML_ENTRY_POINT     IdP SSO URL
//   SAML_ISSUER          this app's SP entity id
//   SAML_CALLBACK_URL    <app>/api/auth/sso/callback
//   SAML_IDP_CERT        IdP signing certificate (PEM; secret → .env)
//   SAML_ROLE_ATTRIBUTE  assertion attribute holding groups   [default: groups]
//   SAML_ROLE_MAP / SAML_DEFAULT_ROLES

const appConfig = require('../../config/configService');
const { issueExternalSession } = require('../sessionIssuer');
const { mapExternalRoles, parseJsonConfig } = require('../roleMapping');

const cfg = (k, d) => appConfig.get(k, d);

function notConfigured(msg) {
  const err = new Error(msg || 'SAML SSO is not configured/enabled on this server.');
  err.status = 501;
  err.code = 'AUTH_METHOD_REQUIRES_SSO';
  return err;
}

function ensureEnabled() {
  if (String(cfg('SAML_ENABLED', 'false')) !== 'true') {
    throw notConfigured(
      'SAML is selected but not enabled. Configure the IdP (SAML_ENTRY_POINT, SAML_ISSUER, ' +
      'SAML_CALLBACK_URL, SAML_IDP_CERT), install @node-saml/node-saml, set SAML_ENABLED=true, ' +
      'and integration-test before use.'
    );
  }
  for (const key of ['SAML_ENTRY_POINT', 'SAML_ISSUER', 'SAML_CALLBACK_URL', 'SAML_IDP_CERT']) {
    if (!cfg(key) && !process.env[key]) throw notConfigured(`SAML is missing required config: ${key}.`);
  }
}

function loadSaml() {
  try {
    return require('@node-saml/node-saml');
  } catch {
    const err = new Error(
      'AUTH_METHOD=saml requires the optional "@node-saml/node-saml" package. Run ' +
      '`npm install @node-saml/node-saml` in life-claim-backend.'
    );
    err.status = 501;
    err.code = 'AUTH_DEP_MISSING';
    throw err;
  }
}

function buildSaml() {
  ensureEnabled();
  const { SAML } = loadSaml();
  return new SAML({
    entryPoint: cfg('SAML_ENTRY_POINT'),
    issuer: cfg('SAML_ISSUER'),
    callbackUrl: cfg('SAML_CALLBACK_URL'),
    idpCert: cfg('SAML_IDP_CERT') || process.env.SAML_IDP_CERT,
    wantAssertionsSigned: true,
  });
}

/** Password-form login is not applicable to SAML. */
async function login() {
  throw notConfigured(
    'SAML uses browser SSO, not password login. Direct users to GET /api/auth/sso/login.'
  );
}

/** Build the IdP redirect URL for GET /api/auth/sso/login. */
async function getAuthorizeUrl(req) {
  const saml = buildSaml();
  const host = `${req.protocol}://${req.get('host')}`;
  return saml.getAuthorizeUrlAsync('', host, {});
}

/** Validate the POSTed SAML assertion (ACS) and mint a local session. */
async function handleCallback(req, res) {
  const saml = buildSaml();
  const { profile } = await saml.validatePostResponseAsync(req.body || {});
  if (!profile) throw notConfigured('SAML assertion could not be validated.');

  const username = profile.nameID || profile.uid || profile.email;
  const roleAttr = cfg('SAML_ROLE_ATTRIBUTE', 'groups');
  const rawRoles = profile[roleAttr] || profile.attributes?.[roleAttr] || [];
  const roles = mapExternalRoles(
    Array.isArray(rawRoles) ? rawRoles : [rawRoles],
    parseJsonConfig(cfg('SAML_ROLE_MAP'), {}),
    parseJsonConfig(cfg('SAML_DEFAULT_ROLES'), [])
  );
  return issueExternalSession({ source: 'saml', username, roles, email: profile.email || null, req, res });
}

module.exports = { login, getAuthorizeUrl, handleCallback, method: 'saml', formLogin: false, redirect: true };
