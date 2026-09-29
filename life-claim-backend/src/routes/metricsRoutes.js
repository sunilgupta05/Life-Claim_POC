// src/routes/metricsRoutes.js
//
// Prometheus scrape endpoint (roadmap 4.3). Internal-only: Prometheus runs inside
// the trust boundary, so this is gated by requireInternal (loopback / private
// CIDRs / X-Internal-Api-Key) rather than the user auth gate. Mounted BEFORE the
// auth gate so a scraper doesn't need a user token.

const express = require('express');
const { requireInternal } = require('../middleware/requireInternal');
const { metricsHandler } = require('../util/metrics');

const router = express.Router();

router.get('/', requireInternal(), metricsHandler);

module.exports = router;
