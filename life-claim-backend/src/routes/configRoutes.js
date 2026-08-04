// src/routes/configRoutes.js
//
// Admin routes for runtime configuration (roadmap 0.3). Superuser-only, mounted
// under the authenticated /api gate. Mirrors the auth pattern used by
// adminRoutes (authenticate -> authorize superuser).

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const { listConfig, upsertConfig, deleteConfig } = require('../controllers/configController');

const router = express.Router();

router.use(authMiddleware.authenticate);
router.use(authorize('superuser', 'super user'));

router.get('/', listConfig);
router.put('/:key', upsertConfig);
router.delete('/:key', deleteConfig);

module.exports = router;
