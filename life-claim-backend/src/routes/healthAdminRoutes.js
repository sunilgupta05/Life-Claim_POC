// src/routes/healthAdminRoutes.js
//
// Detailed integration health (roadmap 3.2) — endpoints, circuit-breaker state
// and stats. Mounted AFTER the auth gate and gated on the same config-admin
// permission as the runtime config console (superuser in the shipped RBAC).

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requirePermission = require('../middleware/requirePermission');
const { integrations } = require('../controllers/healthController');

const router = express.Router();

router.use(authMiddleware.authenticate);
router.use(requirePermission('admin.config.manage'));

router.get('/integrations', integrations);

module.exports = router;
