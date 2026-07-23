const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const roleController = require('../controllers/roleController');
const { validateCreateRoleBody } = require('../middleware/requestValidation');

const router = express.Router();

const superuserOnly = [authMiddleware.authenticate, authorize('superuser', 'super user')];

router.get('/getroles', ...superuserOnly, roleController.getAllRoles);
router.post('/addrole', ...superuserOnly, validateCreateRoleBody, roleController.createRole);

module.exports = router;
