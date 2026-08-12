// src/auth/roleMapping.js
//
// Map identity-provider group/role values (from LDAP or OIDC/SAML claims) to
// this app's roles (roadmap 1.4). Deployment-configurable via a JSON map, e.g.
//   LDAP_ROLE_MAP = {"cn=assessors,ou=groups,dc=corp":["Assessor"], ...}
//   OIDC_ROLE_MAP = {"claims-assessor":["Assessor"]}
// with an optional default applied when nothing matches (e.g. OIDC_DEFAULT_ROLES).

/**
 * @param {string[]} idpValues  raw group/role strings from the IdP
 * @param {object}   map        { idpValue: appRole | appRole[] }
 * @param {string[]} defaults   roles applied when no mapping matched
 * @returns {string[]} deduped app roles
 */
function mapExternalRoles(idpValues = [], map = {}, defaults = []) {
  const out = new Set();
  const values = Array.isArray(idpValues) ? idpValues : [idpValues];
  const norm = (s) => String(s || '').trim().toLowerCase();
  const table = new Map(Object.entries(map || {}).map(([k, v]) => [norm(k), v]));

  for (const raw of values) {
    const hit = table.get(norm(raw));
    if (!hit) continue;
    (Array.isArray(hit) ? hit : [hit]).forEach((r) => r && out.add(String(r)));
  }
  if (out.size === 0) {
    (Array.isArray(defaults) ? defaults : [defaults]).forEach((r) => r && out.add(String(r)));
  }
  return [...out];
}

/** Parse a JSON config value into an object/array; tolerant of already-parsed input. */
function parseJsonConfig(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

module.exports = { mapExternalRoles, parseJsonConfig };
