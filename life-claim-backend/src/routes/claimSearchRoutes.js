const express = require('express');
const { getClaimSearch, updateAssessor, updateVerifier } = require('../controllers/claimSearchController');
const { protect, hasAnyRole } = require('../middleware/keycloak');
const { authorizeClaimBodyAccess } = require('../middleware/claimAccessMiddleware');

const router = express.Router();

const assessorRoles = ['Pre Assessor', 'Assessor', 'Verifier'];

router.post('/', protect(hasAnyRole(assessorRoles)), authorizeClaimBodyAccess, getClaimSearch);
router.post('/update-ass', protect(hasAnyRole(assessorRoles)), authorizeClaimBodyAccess, updateAssessor);
router.post('/update-ver', protect('realm:Verifier'), authorizeClaimBodyAccess, updateVerifier);

module.exports = router;