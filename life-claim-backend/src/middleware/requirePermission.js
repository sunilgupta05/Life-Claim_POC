// src/middleware/requirePermission.js
//
// Permission-based route guard backed by the dynamic RBAC service (roadmap 1.1
// data layer, wired for enforcement in roadmap 1.2).
//
// This is the DB-driven replacement for the hardcoded role-name guards. A route
// keeps its authentication step (protect() or authMiddleware.authenticate) and
// gates authorization on a permission KEY instead of a role string, e.g.
//
//     router.get('/pool', protect(), requirePermission('pool.view'), ...)
//     router.post('/user', authMiddleware.authenticate, requirePermission('admin.users.manage'), ...)
//
// It reads the caller's roles/username from req.user OR (fallback) req.kauth, so
// it works after either auth middleware. Superuser always passes.

const logger = require('../util/logger');
const rbacService = require('../services/rbacService');
const { hasSuperUserAccess } = require('../util/superuserRoles');
const { extractKeycloakRoles, extractKeycloakUsername } = require('../util/keycloakRoles');

// Resolve { roles, username } from whichever the upstream auth middleware set.
// authMiddleware.authenticate populates req.user; a bare protect() on the
// Keycloak-token path populates only req.kauth. Mirrors the fallback used by
// claimAccessMiddleware.getUserContext so this guard works after either.
function userContext(req) {
  const tokenContent = req.kauth?.grant?.access_token?.content || {};
  const roles = Array.isArray(req.user?.roles) && req.user.roles.length
    ? req.user.roles
    : extractKeycloakRoles(tokenContent);
  const username = req.user?.username || extractKeycloakUsername(tokenContent) || '';
  const authed = Boolean(req.user || req.kauth?.grant?.access_token);
  return { roles, username, authed };
}

/**
 * @param {...string} permissionKeys - one or more permission keys; access is
 *   granted if the user holds ANY of them (or is a superuser).
 */
function requirePermission(...permissionKeys) {
  const keys = permissionKeys.flat().filter(Boolean);
  return (req, res, next) => {
    const { roles, username, authed } = userContext(req);
    if (!authed) {
      return res.status(401).json({ message: 'Unauthorized: No user information found' });
    }

    // Superuser bypass — mirrors authorize()'s superuser handling.
    if (hasSuperUserAccess(roles, username)) return next();

    const allowed = keys.some((key) => rbacService.hasPermission(roles, key));
    if (!allowed) {
      logger.warn(
        `Permission denied for user ${username}. Required: [${keys}], User roles: [${roles}]`
      );
      return res.status(403).json({
        message: 'Forbidden: You do not have permission to access this resource',
      });
    }
    return next();
  };
}

module.exports = requirePermission;
