const express = require('express');
const { getSelectedPool, updateAssignedUser } = require('../controllers/poolSelectionController');
const { protect, hasAnyRole } = require('../middleware/keycloak');
const { authorizePoolAssignAccess } = require('../middleware/claimAccessMiddleware');

const router = express.Router();

const poolRoles = ['Assessor', 'Verifier'];

router.post('/', protect(hasAnyRole(poolRoles)), getSelectedPool);
router.patch('/:claimNumber', protect(hasAnyRole(poolRoles)), authorizePoolAssignAccess, updateAssignedUser);

module.exports = router;