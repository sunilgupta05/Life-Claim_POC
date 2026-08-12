// src/auth/providers/ldapProvider.js
//
// AUTH_METHOD=ldap — validate credentials against an LDAP/AD directory, map a
// directory group/attribute to app roles, then mint a local JWT (roadmap 1.4).
//
// Standard bind pattern: bind with a service account, search for the user, then
// re-bind as the user with the supplied password to verify it. A direct-bind DN
// template (LDAP_USER_DN_TEMPLATE) is also supported for directories that allow
// it. `ldapts` is an OPTIONAL dependency loaded only when this method is active;
// if it isn't installed, a clear, actionable error is thrown.
//
// Config (via the 0.3 config service → DB/.env):
//   LDAP_URL                ldaps://dc.corp:636
//   LDAP_BIND_DN            service-account DN used for the search bind
//   LDAP_BIND_PASSWORD      (secret; .env only)
//   LDAP_SEARCH_BASE        ou=people,dc=corp,dc=com
//   LDAP_SEARCH_FILTER      (uid={{username}})            [default: (uid={{username}})]
//   LDAP_USER_DN_TEMPLATE   uid={{username}},ou=people,dc=corp  [optional direct bind]
//   LDAP_ROLE_ATTRIBUTE     memberOf                      [default: memberOf]
//   LDAP_EMAIL_ATTRIBUTE    mail                          [default: mail]
//   LDAP_ROLE_MAP           {"cn=assessors,...":["Assessor"]}
//   LDAP_DEFAULT_ROLES      ["Assessor"]                  [optional]

const appConfig = require('../../config/configService');
const { verifyRecaptchaToken } = require('../../services/recaptchaService');
const { issueExternalSession } = require('../sessionIssuer');
const { mapExternalRoles, parseJsonConfig } = require('../roleMapping');

function loadLdapts() {
  try {
    return require('ldapts');
  } catch {
    const err = new Error(
      'AUTH_METHOD=ldap requires the optional "ldapts" package. Run `npm install ldapts` in life-claim-backend.'
    );
    err.status = 501;
    err.code = 'AUTH_DEP_MISSING';
    throw err;
  }
}

function cfg(key, dflt) {
  return appConfig.get(key, dflt);
}

async function login({ username, password, captchaToken, req, res }) {
  await verifyRecaptchaToken(captchaToken);

  if (!username || !password) {
    const err = new Error('Username and password are required.');
    err.status = 400;
    throw err;
  }

  const url = cfg('LDAP_URL');
  const searchBase = cfg('LDAP_SEARCH_BASE');
  if (!url || !searchBase) {
    const err = new Error('LDAP is not configured (set LDAP_URL and LDAP_SEARCH_BASE).');
    err.status = 501;
    err.code = 'AUTH_NOT_CONFIGURED';
    throw err;
  }

  const { Client } = loadLdapts();
  const filter = String(cfg('LDAP_SEARCH_FILTER', '(uid={{username}})')).replace(/\{\{username\}\}/g, username);
  const dnTemplate = cfg('LDAP_USER_DN_TEMPLATE');
  const roleAttr = cfg('LDAP_ROLE_ATTRIBUTE', 'memberOf');
  const emailAttr = cfg('LDAP_EMAIL_ATTRIBUTE', 'mail');
  const roleMap = parseJsonConfig(cfg('LDAP_ROLE_MAP'), {});
  const defaultRoles = parseJsonConfig(cfg('LDAP_DEFAULT_ROLES'), []);

  const INVALID = () => {
    const e = new Error('Invalid username or password.');
    e.status = 401;
    return e;
  };

  const searchClient = new Client({ url });
  let userDn = dnTemplate ? dnTemplate.replace(/\{\{username\}\}/g, username) : null;
  let entry = null;

  try {
    // 1) Locate the user entry (service bind + search) unless a direct DN template is used.
    if (!userDn || roleAttr || emailAttr) {
      const bindDn = cfg('LDAP_BIND_DN');
      const bindPw = process.env.LDAP_BIND_PASSWORD;
      if (bindDn) await searchClient.bind(bindDn, bindPw || '');
      const { searchEntries } = await searchClient.search(searchBase, {
        scope: 'sub',
        filter,
        attributes: [roleAttr, emailAttr, 'dn'].filter(Boolean),
      });
      entry = searchEntries[0] || null;
      if (!userDn) {
        if (!entry) throw INVALID();
        userDn = entry.dn;
      }
    }
  } finally {
    await searchClient.unbind().catch(() => {});
  }

  // 2) Verify the password by binding AS the user.
  const userClient = new Client({ url });
  try {
    await userClient.bind(userDn, password);
  } catch {
    throw INVALID();
  } finally {
    await userClient.unbind().catch(() => {});
  }

  // 3) Map directory groups → app roles; extract email.
  const groups = entry && entry[roleAttr] ? entry[roleAttr] : [];
  const roles = mapExternalRoles(groups, roleMap, defaultRoles);
  const email = entry && entry[emailAttr]
    ? (Array.isArray(entry[emailAttr]) ? entry[emailAttr][0] : entry[emailAttr])
    : null;

  return issueExternalSession({ source: 'ldap', username, roles, email, req, res });
}

module.exports = { login, method: 'ldap', formLogin: true };
