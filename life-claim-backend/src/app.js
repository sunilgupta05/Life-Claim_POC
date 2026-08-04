require('dotenv').config();
const appConfig = require('./config/configService');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { getKeycloak, protect, sessionConfig } = require('./middleware/keycloak');
const { requireApiAuth } = require('./middleware/requireApiAuth');
const { injectBearerFromSession } = require('./util/authCookies');
const router = require('./routes/commonRoutes');
const sequelize = require('./config/sequelize');
 
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/rolesRoutes');
const authRoutes = require('./routes/authRoutes');
const orgProfileRoutes = require('./routes/orgProfileRoutes');
const orgProfileService = require('./services/orgProfileService');
const configRoutes = require('./routes/configRoutes');
const configService = require('./config/configService');
const mailRoute = require('./routes/mail')
const attachmentsRoute = require('./routes/attachment')
const policyRoutes = require('./routes/policyRoutes')
const countriesRoutes = require('./routes/countriesRoute')
const statesRoutes=require('./routes/statesRoutes')
const caseReasonsRoutes=require('./routes/caseReasonsRoutes')
// api for policy search page to fetch table
const historySearchRoutes=require('./routes/historySearchRoutes')
// api for claim search page to fetch table
const claimSearchRoutes=require('./routes/claimSearchRoutes')
const trapScoreRoutes=require('./routes/trapScoreRoutes')
const poolSelectionRoutes=require('./routes/poolSelectionRoutes')
 
const assessorFetchRoutes=require('./routes/assessorFetchRoutes')
 
const emailService = require('./services/emailService');
 
const registerClaimRoutes = require('./routes/registerClaimRoutes');
 
const claimsRoutes = require('./routes/claimsRoutes')
 
const calculateAmountRoutes=require('./routes/calculateAmountRoutes')
const causeEventRoutes=require('./routes/causeEventRoutes')
const agentRepudiationRoutes=require('./routes/agentRepudiationRoutes')
const systemDecisionRoutes = require('./routes/systemDecisionRoutes')
 
const assessmentQuestionsRoutes = require('./routes/assessmentQuestionsRoutes')
const documentListRoutes = require('./routes/documentListRoutes')
const UploadedDocumentsRoutes = require('./routes/UploadedDocumentRoutes')
const documentUploadRoutes = require('./routes/documentUploadRoutes')
 
const adminRoutes = require('./routes/adminRoutes');
 
//ADD screen import routes
const capsAddDetailsRoutes = require('./routes/add/capsAddDetailsRoutes');
 
//Fraud Prevention routes
const fraudPreventionRoutes = require('./routes/fraudPreventionRoutes');
 
// Dashboard Activity routes
const dashboardActivityRoutes = require('./routes/dashboardActivityRoutes');
 
//Txn Details routes
const transactionDetailsRoutes = require('./routes/txnDetailsRoutes');
const { closeAllStaleSessions } = require('./services/auditLogService');
const { apiLimiter } = require('./middleware/rateLimiters');
const { httpMethodFilter } = require('./middleware/httpMethodFilter');

const app = express();
app.disable('x-powered-by');
app.use(httpMethodFilter);
if (appConfig.get('TRUST_PROXY') === 'true') {
  app.set('trust proxy', 1);
}
const keycloak = getKeycloak();

const isProduction = appConfig.get('NODE_ENV') === 'production';
const ENABLE_TEST_ROUTES =
  appConfig.get('ENABLE_TEST_ROUTES') === 'true' || appConfig.get('NODE_ENV') !== 'production';
const parseCsv = (raw) =>
  String(raw || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
const toOrigin = (urlLike) => {
  try {
    return new URL(urlLike).origin;
  } catch {
    return null;
  }
};

const runtimeAppOrigins = [
  appConfig.get('SERVER_IP') && appConfig.get('PORT')
    ? `http://${appConfig.get('SERVER_IP')}:${appConfig.get('PORT')}`
    : null,
  appConfig.get('SERVER_IP') && appConfig.get('PORT')
    ? `https://${appConfig.get('SERVER_IP')}:${appConfig.get('PORT')}`
    : null,
].filter(Boolean);

const DEV_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:3011',
  'http://127.0.0.1:3011',
  'http://localhost:3012',
  'https://localhost:3012',
  'http://localhost:3015',
  'https://localhost:3015',
  ...runtimeAppOrigins,
];

// Production allowlist should come from env and should use public hostnames/domains.
const PROD_CORS_ORIGINS = [];
const configuredOriginsRaw = parseCsv(appConfig.get('CORS_ALLOWED_ORIGINS'));
const hasWildcardCorsOrigin = configuredOriginsRaw.includes('*');
if (hasWildcardCorsOrigin) {
  console.error('[security] CORS_ALLOWED_ORIGINS contains "*" which is not permitted; ignoring wildcard.');
}
const configuredOrigins = configuredOriginsRaw.filter((origin) => origin !== '*');
const allowedOrigins = configuredOrigins.length
  ? configuredOrigins
  : (isProduction ? PROD_CORS_ORIGINS : DEV_CORS_ORIGINS);

const keycloakOrigin = toOrigin(appConfig.get('KEYCLOAK_URL') || '');
const cspConnectSrc = Array.from(
  new Set(
    [
      "'self'",
      'https://www.google.com',
      'https://www.recaptcha.net',
      ...(isProduction ? [] : ['http://localhost:8080', 'https://localhost:8080']),
      ...allowedOrigins,
      ...(keycloakOrigin ? [keycloakOrigin] : []),
    ].filter(Boolean)
  )
);
 
// Security Middleware: allow Google reCAPTCHA (script + frame + connect); keep rest of Helmet defaults
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://www.recaptcha.net",
          "https://recaptcha.google.com",
        ],
        frameSrc: [
          "'self'",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://www.recaptcha.net",
          "https://recaptcha.google.com",
        ],
        // Allow backend API origin for XHR/fetch (authService, etc.)
        connectSrc: cspConnectSrc,
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://www.gstatic.com",
          "https://www.google.com",
          "https://www.recaptcha.net",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://www.recaptcha.net",
        ],
      },
    },
  })
);
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.noSniff());
// VAPT: force HTTPS on repeat visits (no-op over plain HTTP, harmless in local dev) + limit referrer leakage.
app.use(helmet.hsts({ maxAge: 15552000, includeSubDomains: true }));
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
 
// 🛑 Prevent browser caching for sensitive API data (Back/Refresh Attack Protection)
app.use((req, res, next) => {
  // VAPT #25: prevent framework/server banner leakage in response headers.
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
const hasTraversalPattern = (value) => {
  const raw = String(value || '');
  const lower = raw.toLowerCase();
  const decodedOnce = safeDecode(raw);
  const decodedTwice = safeDecode(decodedOnce);
  const candidates = [lower, decodedOnce.toLowerCase(), decodedTwice.toLowerCase()];

  return candidates.some((candidate) =>
    candidate.includes('../') ||
    candidate.includes('..\\') ||
    /(^|[\\/])\.\.([\\/]|$)/.test(candidate) ||
    candidate.includes('%2e%2e')
  );
};

// VAPT: block path traversal vectors early to avoid auth-route bypass attempts.
app.use((req, res, next) => {
  const target = `${req.originalUrl || ''}`;
  if (hasTraversalPattern(target)) {
    return res.status(400).json({ message: 'Invalid request path.' });
  }
  next();
});

// VAPT #26: reject auth requests over insecure transport in production to reduce replay/MITM risk.
const REQUIRE_HTTPS_AUTH =
  appConfig.get('REQUIRE_HTTPS_AUTH') === 'true' || appConfig.get('NODE_ENV') === 'production';
const isSecureTransport = (req) => {
  if (req.secure) return true;
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  return forwardedProto.split(',').map((v) => v.trim()).includes('https');
};
app.use((req, res, next) => {
  if (!REQUIRE_HTTPS_AUTH) return next();
  const isSensitiveAuthPath =
    req.path === '/api/user/login' ||
    req.path === '/api/auth/keycloak/token' ||
    req.path === '/api/auth/authenticate';
  if (!isSensitiveAuthPath) return next();
  if (isSecureTransport(req)) return next();
  return res.status(400).json({
    message: 'Secure transport required for authentication.',
  });
});

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server / curl without browser origin header
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));

// VAPT: restrict browser feature access (Permissions-Policy has no Helmet default).
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), camera=(), microphone=(), payment=(), usb=()'
  );
  next();
});

// VAPT: don't let Express auto-answer OPTIONS with an Allow-header method enumeration.
// cors() already terminates real CORS preflights above (res.headersSent === true by
// the time we get here); anything else hitting OPTIONS gets a bare 204 instead of
// falling through to the router's default per-route method-list response.
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS' || res.headersSent) return next();
  return res.status(204).end();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// VAPT #23: if an XSRF-TOKEN cookie exists, force secure HttpOnly attributes.
// This app does not require JS-readable XSRF tokens in current flow.
app.use((req, res, next) => {
  const xsrfToken = req.cookies?.['XSRF-TOKEN'];
  if (!xsrfToken) return next();

  const useHttps = appConfig.get('USE_HTTPS') === 'true';
  res.cookie('XSRF-TOKEN', xsrfToken, {
    httpOnly: true,
    secure: useHttps || isProduction,
    sameSite: 'strict',
    path: '/api',
  });
  next();
});

// Broad API rate limit (VAPT); set RATE_LIMIT_API_MAX=0 to disable
app.use('/api', apiLimiter);

// Session must be registered before Keycloak middleware
app.use(session(sessionConfig));

// Mirror httpOnly cookie / server session token into Authorization for Keycloak.
app.use(injectBearerFromSession);

// Routes that don't need Keycloak protection
app.use('/api/auth', authRoutes);

// Active-organization profile (roadmap 0.2) — public so the login page can load
// branding before authentication. Read-only; safe to expose. Preloaded below.
app.use('/api/org-profile', orgProfileRoutes);

// Keycloak must run before requireApiAuth and protected routes so Bearer tokens populate req.kauth.
// Scope it to /api so non-API routes (/, static assets) never hit auth middleware.
// Do not mount protected /api routes above this line.
app.use('/api', keycloak.middleware());

// Default-deny: valid Bearer JWT required for all /api routes except the public whitelist.
app.use('/api', requireApiAuth);
 
 
app.use('/api/user', userRoutes);
app.use('/api/role', roleRoutes);
app.use('/api/mail', mailRoute);
app.use('/api/attachment', attachmentsRoute);
app.use('/api/policy', policyRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/states', statesRoutes);//many similar apis are inside states like requirement and portfolio
app.use('/api/case-reasons', caseReasonsRoutes);
//app.use('/api/case-reasons', caseReasonsRoutes);
app.use('/api/agentRepudiation',agentRepudiationRoutes)
 
// policy search page to fetch table if record exists
app.use('/api/history-search',historySearchRoutes)
app.use('/api/claim-search',claimSearchRoutes)
app.use('/api/trap-score',trapScoreRoutes)
app.use('/api/pool-selection',poolSelectionRoutes)
 
app.use('/api/assessor-fetch',assessorFetchRoutes)
app.use('/api/calculate-amount',calculateAmountRoutes)
app.use('/api/cause-event',causeEventRoutes)
 
app.use('/api/app', router);

app.use('/api/register-claim', registerClaimRoutes);
 
app.use('/api/claims', claimsRoutes)
 
 
//System Decision part begins from here
app.use('/api/systemDec', systemDecisionRoutes);
 
app.use('/api/assessment-questions',assessmentQuestionsRoutes)
 
app.use('/api/documents', documentListRoutes)
app.use('/api/uploaded', UploadedDocumentsRoutes)/**get all details from the 'UploadedDocumnets' table based on the claimnumber */
//app.use('api/Uploaded-document', UploadedDocumentsRoutes)
app.use('/api/upload', documentUploadRoutes); /** to upload document on alfresco (DMS) */
app.use('/api/document', documentUploadRoutes); /** Preview uploaded file on Alfresco DMS */
 
/** ADD Screens routes */
app.use('/api/capsAddDetails', capsAddDetailsRoutes); //** to add data into the table
app.use('/api/case-search', capsAddDetailsRoutes); //** to add data into the table
app.use('/api/Assessment', capsAddDetailsRoutes); //** to add data into the table
app.use('/api/caseassignment', capsAddDetailsRoutes); //** to get data from users and capsAddDetals  table
app.use('/api/case-assignment', capsAddDetailsRoutes); // alias for bulk assign POST /add
 
//Fraud Prevention routes
app.use('/api/fraudprevention', fraudPreventionRoutes);
 
//transaction details routes
app.use('/api/txn', transactionDetailsRoutes);
 
// Dashboard activity routes
app.use('/api/dashboard', dashboardActivityRoutes);
 
// Admin routes (dashboard + audit/user management)
app.use('/api/superuser', adminRoutes);

// Runtime configuration admin API (roadmap 0.3). Superuser-only (enforced inside
// the router). Edits hot-reload immediately via the config service.
app.use('/api/config', configRoutes);

// Centralized error handler: prevent leaking stack traces/internal details to clients.
// In non-production we still return a short detail string for debugging convenience.
app.use((err, req, res, next) => {
  const status = Number(err?.status) || 500;
  const message = status >= 500 ? 'Internal server error' : (err?.message || 'Request failed');
  const body = { message };
  const exposeErrorDetail = appConfig.get('EXPOSE_ERROR_DETAIL') === 'true';
  if (exposeErrorDetail && err?.message) {
    body.detail = err.message;
  }
  console.error('Unhandled API error:', err?.message || err);
  res.status(status).json(body);
});

// Warm the centralized config cache at startup (roadmap 0.3). Best-effort:
// if app_config isn't migrated yet, the service simply falls back to .env.
configService.init().catch((err) => {
  console.warn('[config] startup init skipped:', err?.message);
});

// Preload the active-organization profile at startup (roadmap 0.2).
// Best-effort: failures fall back to built-in defaults inside the service, so
// this never blocks or breaks boot even if migration 0003 hasn't been run.
orgProfileService.load().catch((err) => {
  console.warn('[orgProfile] startup preload skipped:', err?.message);
});

// Periodic audit reconciliation:
// close stale open sessions so timeout/abrupt-close sessions are eventually marked logged out.
const AUDIT_RECONCILE_MS = Number(appConfig.get('AUDIT_RECONCILE_MS') || 5 * 60 * 1000);
setInterval(async () => {
  try {
    await closeAllStaleSessions();
  } catch (error) {
    console.error('Audit reconciliation error:', error.message);
  }
}, AUDIT_RECONCILE_MS);

if (ENABLE_TEST_ROUTES) {
  // Test-only endpoints; keep disabled in production unless explicitly enabled.
  app.get('/api/secure/test', protect(), (req, res) => {
    const token = req.kauth?.grant?.access_token?.content;

    if (!token) {
      return res.status(401).json({ message: 'No access token found' });
    }

    return res.json({
      message: 'Keycloak protection OK',
      username: token.preferred_username,
      name: token.name,
      roles: token.realm_access?.roles || [],
    });
  });

  app.get('/api/secure/pre-assessor', protect('realm:Pre Assessor'), (req, res) => {
    const token = req.kauth?.grant?.access_token?.content;

    return res.json({
      message: 'Pre Assessor access granted',
      username: token?.preferred_username,
      roles: token?.realm_access?.roles || [],
    });
  });
}
 
//app.use('/api/fraudprevention', fraudPreventionRoutes);
//app.use('/api/fraudprevention', fraudPreventionRoutes);
// const syncDatabase = async () => {
//   try {
//     await sequelize.sync(); // Creates the tables if they don't exist
//     console.log('Database synced successfully.');
//   } catch (error) {
//     console.error('Error syncing database:', error);
//   }
// };

// syncDatabase();

//emailService.handleNewMail();

// Apply middleware for authentication
//app.use('/api', authMiddleware.authenticate);

// Define routes
//app.use('/auth/auth', authRoutes);

// Deployment mode: backend serves built frontend (SPA support).
const frontendBuildPath = appConfig.get('FRONTEND_BUILD_PATH')
  ? path.resolve(appConfig.get('FRONTEND_BUILD_PATH'))
  : path.join(__dirname, '../../life-claim-frontend/build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));

  // Catch-all handler: send back index.html for any non-API routes.
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.status(404).json({
      error:
        'Frontend build not found. Run: npm run build in life-claim-frontend directory. ' +
        'If the repo was moved, run the backend from the new root or set FRONTEND_BUILD_PATH to the build folder.',
      buildPath: frontendBuildPath
    });
  });
}

module.exports = app;