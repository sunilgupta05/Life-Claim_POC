const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requirePermission = require('../middleware/requirePermission');
const roleController = require('../controllers/roleController');
const { validateCreateRoleBody } = require('../middleware/requestValidation');

const router = express.Router();

// Legacy role admin — authenticate then gate on the RBAC-admin permission
// (roadmap 1.2). Only superuser holds admin.rbac.manage (superuser-only as before).
const superuserOnly = [authMiddleware.authenticate, requirePermission('admin.rbac.manage')];

router.get('/getroles', ...superuserOnly, roleController.getAllRoles);
router.post('/addrole', ...superuserOnly, validateCreateRoleBody, roleController.createRole);

module.exports = router;
