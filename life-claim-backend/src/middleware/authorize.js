// backend/middleware/authorize.js

const { hasSuperUserRole, hasSuperUserAccess } = require('../util/superuserRoles');

/**
 * Middleware to authorize users based on their roles
 * @param {...string} allowedRoles - The roles that are allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No user information found' });
    }

    const userRoles = req.user.roles || [];
    const username = req.user.username || '';
    const norm = (r) => String(r || '').toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ').trim();

    const needsSuperUser = allowedRoles.some((role) => hasSuperUserRole([role]));
    const hasPermission =
      allowedRoles.some((role) =>
        userRoles.some((ur) => norm(ur) === norm(role) || (hasSuperUserRole([ur]) && hasSuperUserRole([role])))
      ) ||
      (needsSuperUser && hasSuperUserAccess(userRoles, username));

    if (!hasPermission) {
      console.warn(`Access denied for user ${username}. Required roles: [${allowedRoles}], User roles: [${userRoles}]`);
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource' });
    }

    next();
  };
};

module.exports = authorize;
