// src/routes/configRoutes.js
//
// Admin routes for runtime configuration (roadmap 0.3). Superuser-only, mounted
// under the authenticated /api gate. Mirrors the auth pattern used by
// adminRoutes (authenticate -> authorize superuser).

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requirePermission = require('../middleware/requirePermission');
const { listConfig, upsertConfig, deleteConfig } = require('../controllers/configController');

const router = express.Router();

// Authenticate, then gate on the config-admin permission (roadmap 1.2). Only
// superuser holds admin.config.manage, so this stays superuser-only as before.
router.use(authMiddleware.authenticate);
router.use(requirePermission('admin.config.manage'));

router.get('/', listConfig);
router.put('/:key', upsertConfig);
router.delete('/:key', deleteConfig);

module.exports = router;
