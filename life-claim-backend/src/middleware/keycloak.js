const crypto = require('crypto');
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');
const { readAccessToken } = require('../util/authCookies');

let keycloak;
const SESSION_IDLE_TIMEOUT_MINUTES = Number(process.env.SESSION_IDLE_TIMEOUT_MINUTES || 5);
const SESSION_IDLE_TIMEOUT_MS = SESSION_IDLE_TIMEOUT_MINUTES * 60 * 1000;

// Use an in-memory session store for development.
// If you later cluster the app, replace this with a shared store (e.g. Redis).
const memoryStore = new session.MemoryStore();

// Strong unique SESSION_SECRET required for stable sessions; production generates ephemeral secret if unset.
const sessionSecret = (() => {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  if (process.env.NODE_ENV === 'production') {
    console.error(
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
    secure: process.env.NODE_ENV === 'production' ? true : 'auto',
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
      realm: process.env.KEYCLOAK_REALM || 'life-claims',
      'auth-server-url': process.env.KEYCLOAK_URL || 'http://localhost:8080',
      resource: process.env.KEYCLOAK_CLIENT_ID || 'life-claims-frontend',
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

