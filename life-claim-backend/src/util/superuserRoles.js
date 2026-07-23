const norm = (role) =>
  String(role || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isSuperUserRole = (role) => {
  const n = norm(role);
  return n === 'superuser' || n === 'super user';
};

const hasSuperUserRole = (roles = []) =>
  (Array.isArray(roles) ? roles : []).some(isSuperUserRole);

/** Keycloak account username for the platform super user (preferred_username). */
const isSuperUserUsername = (username) => norm(username) === 'superuser';

/** Retired legacy admin account — use superuser instead. */
const isRetiredAdminUsername = (username) => norm(username) === 'admin';

/** Role `superuser` or Keycloak username `superuser`. */
const hasSuperUserAccess = (roles = [], username = '') =>
  hasSuperUserRole(roles) || isSuperUserUsername(username);

module.exports = {
  SUPERUSER_ROUTE_ROLES: ['superuser', 'super user'],
  SUPERUSER_USERNAME: 'superuser',
  isSuperUserRole,
  isSuperUserUsername,
  isRetiredAdminUsername,
  hasSuperUserRole,
  hasSuperUserAccess,
};
