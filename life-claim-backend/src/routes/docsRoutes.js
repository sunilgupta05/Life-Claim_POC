// src/routes/docsRoutes.js
//
// API documentation (roadmap 4.4). Serves the OpenAPI spec + an interactive
// Swagger UI so a client's own developers can explore the API.
//
//   GET /api/docs           → Swagger UI
//   GET /api/docs/openapi.json → raw OpenAPI 3.0 spec
//
// Exposure: in production the docs are OFF by default (avoid leaking the API
// surface publicly); enable with API_DOCS_ENABLED=true. In non-production they
// are on by default for developer convenience. Mounted BEFORE the auth gate so
// developers can read the contract without a token — the spec contains no secrets.

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const appConfig = require('../config/configService');
const { getSpec } = require('../config/openapi');

const router = express.Router();

const docsEnabled = () =>
  appConfig.getBool('API_DOCS_ENABLED', appConfig.get('NODE_ENV') !== 'production');

// Gate the whole docs surface on the toggle.
router.use((req, res, next) => {
  if (!docsEnabled()) return res.status(404).json({ message: 'API docs are disabled', code: 'NOT_FOUND' });
  next();
});

router.get('/openapi.json', (req, res) => {
  res.json(getSpec());
});

router.use('/', swaggerUi.serve, (req, res, next) =>
  swaggerUi.setup(getSpec(), {
    explorer: true,
    customSiteTitle: 'Life Claims API — Docs',
  })(req, res, next)
);

module.exports = router;
