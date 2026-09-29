// src/routes/healthPublicRoutes.js
//
// Public health probes (roadmap 3.2). Mounted BEFORE the auth gate and before the
// API rate limiter so load balancers / uptime checks can poll them without a
// token and without consuming the rate-limit budget. No sensitive data.

const express = require('express');
const { liveness, readiness } = require('../controllers/healthController');

const router = express.Router();

router.get('/', liveness);
router.get('/live', liveness);
router.get('/ready', readiness);

module.exports = router;
