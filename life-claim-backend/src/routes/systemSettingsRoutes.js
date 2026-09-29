// src/routes/systemSettingsRoutes.js
//
// IT Administrator settings API (roadmap 3.5). Superuser-gated (same permission
// as the runtime config console). Mounted AFTER the auth gate.

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requirePermission = require('../middleware/requirePermission');
const { getSettings, updateSetting, resetSetting } = require('../controllers/systemSettingsController');

const router = express.Router();

router.use(authMiddleware.authenticate);
router.use(requirePermission('admin.config.manage'));

router.get('/', getSettings);
router.put('/:key', updateSetting);
router.delete('/:key', resetSetting);

module.exports = router;
