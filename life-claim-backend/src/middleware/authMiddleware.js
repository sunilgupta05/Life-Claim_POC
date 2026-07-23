// backend/middleware/authMiddleware.js

const { getKeycloak } = require('./keycloak');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');
const { extractKeycloakRoles, extractKeycloakUsername } = require('../util/keycloakRoles');

const authenticate = async (req, res, next) => {
const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || (req.cookies && req.cookies.token);

  if (token) {
    // If token looks like a Keycloak token (RS* alg or kid present), skip backend JWT verification.
    const decodedHeader = jwt.decode(token, { complete: true })?.header || {};
    const alg = decodedHeader.alg;
    const hasKid = Boolean(decodedHeader.kid);
    const looksLikeKeycloak = (typeof alg === 'string' && alg.startsWith('RS')) || hasKid;
    if (looksLikeKeycloak) {
      runKeycloak(req, res, next);
      return;
    }
    try {
      const user = await authService.authenticateUser(token);
      req.user = {
        userId: user.id,
        username: user.username,
        roles: user.roles || [],
        email: user.email
      };
      req.kauth = {
        grant: {
          access_token: {
            content: {
              sub: user.id,
              preferred_username: user.username,
              realm_access: { roles: user.roles || [] },
              email: user.email
            }
          }
        }
      };
      return next();
    } catch {
      runKeycloak(req, res, next);
      return;
    }
  }
  runKeycloak(req, res, next);
};

function runKeycloak(req, res, next) {
  const keycloak = getKeycloak();
  const middleware = keycloak.protect();
  middleware(req, res, (err) => {
    if (err) return next(err);
    if (req.kauth && req.kauth.grant && req.kauth.grant.access_token) {
      const token = req.kauth.grant.access_token.content;
      req.user = {
        userId: token.sub,
        username: extractKeycloakUsername(token),
        roles: extractKeycloakRoles(token),
        email: token.email
      };
    }
    next();
  });
}

module.exports = {
  authenticate,
};
