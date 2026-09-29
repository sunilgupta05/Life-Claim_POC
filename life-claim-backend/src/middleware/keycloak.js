const logger = require('../util/logger');
const crypto = require('crypto');
const appConfig = require('../config/configService');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');
const { readAccessToken } = require('../util/authCookies');

let keycloak;
const SESSION_IDLE_TIMEOUT_MINUTES = Number(appConfig.get('SESSION_IDLE_TIMEOUT_MINUTES') || 5);
const SESSION_IDLE_TIMEOUT_MS = SESSION_IDLE_TIMEOUT_MINUTES * 60 * 1000;

// Redis-backed session store when REDIS_URL is configured (survives restarts, works
// across multiple instances). Falls back to the in-memory store for local dev when unset.
function buildSessionStore() {
  if (!appConfig.get('REDIS_URL')) {
    logger.warn(
      '[security] REDIS_URL is not set — using in-memory session store (lost on restart, ' +
        'not safe for multiple instances). Set REDIS_URL in production.'
    );
    return new session.MemoryStore();
  }
  try {
    const { createClient } = require('redis');
    // connect-redis export shape varies by version: v7.1.1 (installed) exposes the
    // class only as `default` under CJS; other versions add a named `RedisStore`.
    // Resolve defensively so the store is never silently undefined (which would
    // throw and fall back to MemoryStore even with REDIS_URL set).
    const connectRedis = require('connect-redis');
    const RedisStore = connectRedis.RedisStore || connectRedis.default || connectRedis;
    const redisClient = createClient({ url: appConfig.get('REDIS_URL') });
    redisClient.on('error', (err) => logger.error('[security] Redis session store error:', err.message));
    redisClient.connect().catch((err) => {
      logger.error('[security] Failed to connect to Redis for sessions:', err.message);
    });
    return new RedisStore({ client: redisClient, prefix: 'sess:' });
  } catch (err) {
    logger.error(
      '[security] REDIS_URL is set but redis/connect-redis failed to initialize; falling back to in-memory store:',
      err.message
    );
    return new session.MemoryStore();
  }
}

// Shared by express-session and Keycloak's own grant store below.
const memoryStore = buildSessionStore();

// Strong unique SESSION_SECRET required for stable sessions; production generates ephemeral secret if unset.
const sessionSecret = (() => {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  if (appConfig.get('NODE_ENV') === 'production') {
    logger.error(
      '[security] SESSION_SECRET is not set — using ephemeral per-process secret; set SESSION_SECRET in .env for stable sessions across restarts.'
    );
    return crypto.randomBytes(32).toString('hex');
  }
  return 'change-this-session-secret-dev-only';
})();

const sessionConfig = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  store: memoryStore,
  cookie: {
    // Use secure cookies automatically on HTTPS requests without breaking local HTTP workflows.
    secure: appConfig.get('NODE_ENV') === 'production' ? true : 'auto',
    httpOnly: true,
    sameSite: 'lax',
    path: '/api',
    maxAge: SESSION_IDLE_TIMEOUT_MS,
  },
};

function getKeycloak() {
  if (keycloak) {
    return keycloak;
  }

  keycloak = new Keycloak(
    { store: memoryStore },
    {
      realm: appConfig.get('KEYCLOAK_REALM') || 'life-claims',
      'auth-server-url': appConfig.get('KEYCLOAK_URL') || 'http://localhost:8080',
      resource: appConfig.get('KEYCLOAK_CLIENT_ID') || 'life-claims-frontend',
      'bearer-only': true,
      'ssl-required': 'external',
      credentials: {
        secret: process.env.KEYCLOAK_CLIENT_SECRET || '',
      },
      'confidential-port': 0,
    }
  );

  return keycloak;
}

// Helper middleware for Keycloak to check if user has ANY of the provided roles
const hasAnyRole = (roles) => (token, request) => {
  return roles.some(role => token.hasRealmRole(role));
};

// Check if user has required role (for backend JWT). roleSpec: 'realm:Pre Assessor' -> 'Pre Assessor'
const parseRoleSpec = (spec) => spec && typeof spec === 'string' ? spec.replace(/^realm:/, '') : null;

// Flexible protect: try backend JWT first, then Keycloak. Supports any user, role string, or hasAnyRole()
function ensureBearerFromCookie(req) {
  if (!req.headers.authorization) {
    const token = readAccessToken(req);
    if (token) req.headers.authorization = `Bearer ${token}`;
  }
  return readAccessToken(req);
}

function protect(roleSpec) {
  return async (req, res, next) => {
    const token = ensureBearerFromCookie(req);
    // If the incoming token is a Keycloak-style token (typically RS256 with a kid),
    // skip backend JWT verification (HS256) and validate via Keycloak directly.
    if (token) {
      const decodedHeader = jwt.decode(token, { complete: true })?.header || {};
      const alg = decodedHeader.alg;
      const hasKid = Boolean(decodedHeader.kid);
      const looksLikeKeycloak = (typeof alg === 'string' && alg.startsWith('RS')) || hasKid;
      if (looksLikeKeycloak) {
        return runKeycloakProtect(req, res, next, roleSpec);
      }
      try {
        const user = await authService.authenticateUser(token);
        let roles = user.roles;
        if (Array.isArray(roles)) { /* ok */ }
        else if (typeof roles === 'string') roles = roles ? [roles] : [];
        else roles = roles ? [roles] : [];
        const role = parseRoleSpec(roleSpec);
        if (role && !roles.includes(role)) {
          return res.status(403).json({ message: 'Forbidden: insufficient role' });
        }
        if (typeof roleSpec === 'function') {
          const hasRole = roleSpec({ hasRealmRole: (r) => roles.includes(r) }, req);
          if (!hasRole) return res.status(403).json({ message: 'Forbidden: insufficient role' });
        }
        req.user = { userId: user.id, username: user.username, roles, email: user.email };
        req.kauth = { grant: { access_token: { content: { sub: user.id, preferred_username: user.username, realm_access: { roles } } } } };
        return next();
      } catch (e) {
        return runKeycloakProtect(req, res, next, roleSpec);
      }
    }
    return runKeycloakProtect(req, res, next, roleSpec);
  };
}

function runKeycloakProtect(req, res, next, roleSpec) {
  const kc = getKeycloak();
  const mw = roleSpec ? kc.protect(roleSpec) : kc.protect();
  mw(req, res, next);
}

module.exports = {
  getKeycloak,
  sessionConfig,
  hasAnyRole,
  protect,
};

