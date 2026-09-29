// src/config/openapi.js
//
// OpenAPI 3.0 specification for the Life Claims API (roadmap 4.4). Built with
// swagger-jsdoc: this file provides the base document (info, servers, security
// schemes, reusable schemas, and the core operational + admin paths), and any
// `@openapi` JSDoc blocks in the route files are merged in via `apis` below, so
// teams can annotate additional endpoints incrementally without editing this file.
//
// Served (with Swagger UI) from /api/docs — see routes/docsRoutes.js.

const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');
const appConfig = require('./configService');

const serverUrl = () => {
  const ip = appConfig.get('SERVER_IP') || 'localhost';
  const port = appConfig.get('PORT') || '3010';
  const scheme = appConfig.get('USE_HTTPS') === 'true' ? 'https' : 'https';
  return `${scheme}://${ip}:${port}`;
};

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'DH Digital — Life Claims API',
    version: '2.0.0',
    description:
      'REST API for the Life Claims management system (Registration → Assessment → Decision → Approval). '
      + 'Most `/api/*` routes require a Bearer token (Keycloak or local JWT). Admin routes require the '
      + '`admin.config.manage` permission (superuser).',
  },
  servers: [
    { url: serverUrl(), description: 'This deployment' },
    { url: 'https://localhost:3010', description: 'Local dev (HTTPS)' },
  ],
  tags: [
    { name: 'Auth', description: 'Login, token issuance, auth-method discovery' },
    { name: 'Health', description: 'Liveness, readiness, integration health (3.2)' },
    { name: 'Claims', description: 'Claim registration and lifecycle' },
    { name: 'Policy', description: 'Life Asia policy search' },
    { name: 'Documents', description: 'Alfresco upload / preview (proxied)' },
    { name: 'Config', description: 'Runtime configuration (superuser, 0.3)' },
    { name: 'Settings', description: 'IT Admin curated settings (superuser, 3.5)' },
    { name: 'RBAC', description: 'Roles / permissions / modules (superuser, 1.x)' },
    { name: 'Org Profile', description: 'Branding & enabled modules (2.1)' },
    { name: 'Form Config', description: 'Per-deployment field overrides (2.3)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          code: { type: 'string', example: 'NOT_FOUND' },
          requestId: { type: 'string', example: 'a1b2c3d4-...' },
        },
      },
      HealthLiveness: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          service: { type: 'string', example: 'life-claim-backend' },
          uptimeSeconds: { type: 'integer', example: 3421 },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      IntegrationHealth: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'degraded'] },
          generatedAt: { type: 'string', format: 'date-time' },
          integrations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                endpoint: { type: 'string' },
                state: { type: 'string', enum: ['closed', 'half-open', 'open', 'unknown'] },
                healthy: { type: 'boolean' },
              },
            },
          },
        },
      },
      TokenRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: { username: { type: 'string' }, password: { type: 'string', format: 'password' } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'], summary: 'Liveness probe', security: [],
        responses: { 200: { description: 'Service is up', content: { 'application/json': { schema: { $ref: '#/components/schemas/HealthLiveness' } } } } },
      },
    },
    '/api/health/ready': {
      get: {
        tags: ['Health'], summary: 'Readiness probe (DB + config)', security: [],
        responses: { 200: { description: 'Ready' }, 503: { description: 'Not ready' } },
      },
    },
    '/api/health/integrations': {
      get: {
        tags: ['Health'], summary: 'Per-integration health + circuit-breaker state',
        responses: {
          200: { description: 'Integration status', content: { 'application/json': { schema: { $ref: '#/components/schemas/IntegrationHealth' } } } },
          401: { description: 'Unauthenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/keycloak/token': {
      post: {
        tags: ['Auth'], summary: 'Exchange username/password for a token (password grant, proxied)', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TokenRequest' } } } },
        responses: { 200: { description: 'Token issued' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/api/auth/methods': {
      get: { tags: ['Auth'], summary: 'List enabled auth methods', security: [], responses: { 200: { description: 'Methods' } } },
    },
    '/api/org-profile': {
      get: { tags: ['Org Profile'], summary: 'Active organization profile (branding + enabled modules)', security: [], responses: { 200: { description: 'Profile' } } },
      put: { tags: ['Org Profile'], summary: 'Update branding (superuser)', responses: { 200: { description: 'Saved' }, 403: { description: 'Forbidden' } } },
    },
    '/api/config': {
      get: { tags: ['Config'], summary: 'List runtime config (superuser)', responses: { 200: { description: 'Config items' }, 403: { description: 'Forbidden' } } },
    },
    '/api/config/{key}': {
      put: {
        tags: ['Config'], summary: 'Upsert a runtime setting (superuser)',
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Saved' }, 403: { description: 'Forbidden' } },
      },
      delete: {
        tags: ['Config'], summary: 'Delete a runtime setting (superuser)',
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },
    '/api/settings': {
      get: { tags: ['Settings'], summary: 'Curated grouped settings (superuser)', responses: { 200: { description: 'Grouped settings' }, 403: { description: 'Forbidden' } } },
    },
    '/api/settings/{key}': {
      put: {
        tags: ['Settings'], summary: 'Update one catalogued setting (superuser)',
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Saved' }, 404: { description: 'Unknown setting' }, 422: { description: 'Invalid value' } },
      },
    },
    '/api/rbac/roles': {
      get: { tags: ['RBAC'], summary: 'List roles (superuser)', responses: { 200: { description: 'Roles' }, 403: { description: 'Forbidden' } } },
    },
    '/api/rbac/my-permissions': {
      get: { tags: ['RBAC'], summary: 'Effective permissions for the current user', responses: { 200: { description: 'Permissions' } } },
    },
    '/api/form-config': {
      get: { tags: ['Form Config'], summary: 'All per-deployment field overrides', responses: { 200: { description: 'Overrides' } } },
    },
    '/api/form-config/{formKey}': {
      get: {
        tags: ['Form Config'], summary: 'Overrides for one form',
        parameters: [{ name: 'formKey', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Field overrides' } },
      },
      put: {
        tags: ['Form Config'], summary: 'Set overrides for one form (superuser)',
        parameters: [{ name: 'formKey', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Saved' }, 403: { description: 'Forbidden' } },
      },
    },
    '/api/policy/policySearch/{policyNo}': {
      get: {
        tags: ['Policy'], summary: 'Search a Life Asia policy',
        parameters: [{ name: 'policyNo', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Policy master' }, 404: { description: 'Not found' }, 502: { description: 'Upstream unavailable' }, 504: { description: 'Upstream timeout' } },
      },
    },
    '/api/register-claim': {
      post: { tags: ['Claims'], summary: 'Register a new claim', responses: { 201: { description: 'Registered' }, 400: { description: 'Validation failed' } } },
    },
    '/api/upload': {
      post: { tags: ['Documents'], summary: 'Upload a document to Alfresco (multipart)', responses: { 201: { description: 'Uploaded' }, 409: { description: 'Duplicate' }, 504: { description: 'DMS timeout' } } },
    },
  },
};

let cached = null;
/** Build (once) the merged OpenAPI document. */
function getSpec() {
  if (cached) return cached;
  cached = swaggerJSDoc({
    definition,
    // Merge any @openapi JSDoc annotations added in route files over time.
    apis: [path.join(__dirname, '..', 'routes', '**', '*.js')],
  });
  return cached;
}

module.exports = { getSpec, definition };
