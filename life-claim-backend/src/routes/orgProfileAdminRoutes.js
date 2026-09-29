// src/routes/orgProfileAdminRoutes.js
//
// Superuser branding admin writes (roadmap 2.1). Mounted at /api/org-profile
// AFTER the global Keycloak + requireApiAuth gate (same as configRoutes /
// rbacRoutes), so req.user is fully populated and requirePermission's superuser
// bypass works. GET stays on the public orgProfileRoutes (before the gate).

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requirePermission = require('../middleware/requirePermission');
const { updateOrgProfile, uploadLogo } = require('../controllers/orgProfileController');

const router = express.Router();

router.use(authMiddleware.authenticate);
router.use(requirePermission('admin.config.manage'));

router.put('/', updateOrgProfile);
router.post('/logo', uploadLogo);

module.exports = router;
