/**
 * Dev-only JWT fixtures for security E2E when Keycloak is unavailable.
 * Never used in production unless E2E_MINT_DEV_TOKENS=true is explicitly set.
 */
const crypto = require('crypto');

async function findUserByUsername(username) {
  const userDao = require('../src/dataAccess/userDao');
  return userDao.getUserByUsername(username);
}

async function findOperationalUser() {
  const User = require('../src/models/User');
  const rows = await User.findAll({ limit: 100 });
  const operational = new Set(['Pre Assessor', 'Assessor', 'Verifier']);
  return rows.find((user) => {
    const roles = Array.isArray(user.roles) ? user.roles : [];
    return roles.some((role) => operational.has(role));
  }) || null;
}

async function findSuperUser() {
  const userDao = require('../src/dataAccess/userDao');
  const direct = await userDao.getUserByUsername('superuser');
  if (direct) return direct;
  const User = require('../src/models/User');
  const rows = await User.findAll({ limit: 100 });
  return rows.find((user) => {
    const roles = Array.isArray(user.roles) ? user.roles : [];
    return roles.some((role) => String(role).toLowerCase().includes('super'));
  }) || null;
}

function normalizeRoles(user) {
  if (!user) return [];
  const roles = user.roles;
  if (Array.isArray(roles)) return roles;
  if (typeof roles === 'string') {
    try {
      const parsed = JSON.parse(roles);
      return Array.isArray(parsed) ? parsed : [roles];
    } catch {
      return roles ? [roles] : [];
    }
  }
  return [];
}

async function mintDevTokenForUser(user) {
  if (!user?.id) return null;
  const jwtUtil = require('../src/util/jwtUtil');
  const userDao = require('../src/dataAccess/userDao');
  const sessionId = crypto.randomUUID();
  await userDao.setCurrentSessionIdByUserId(user.id, sessionId);
  const roles = normalizeRoles(user);
  const token = jwtUtil.sign({
    userId: user.id,
    username: user.username,
    roles,
    sessionId,
  });
  return { token, username: user.username, roles };
}

async function mintDevAuth(username, roleHint = 'operational') {
  const isProd = process.env.NODE_ENV === 'production';
  const allowed = !isProd || process.env.E2E_MINT_DEV_TOKENS === 'true';
  if (!allowed) return null;

  let user = null;
  if (username) {
    user = await findUserByUsername(username);
  }
  if (!user && roleHint === 'superuser') {
    user = await findSuperUser();
  }
  if (!user && roleHint === 'operational') {
    user = await findOperationalUser();
  }
  if (!user) return null;
  return mintDevTokenForUser(user);
}

module.exports = {
  mintDevAuth,
  findOperationalUser,
  findSuperUser,
};
