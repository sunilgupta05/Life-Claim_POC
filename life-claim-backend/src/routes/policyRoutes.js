const express = require('express');
const policyController = require('../controllers/policyController');
const { protect, hasAnyRole } = require('../middleware/keycloak');
const { validatePolicyIdBody } = require('../middleware/requestValidation');

const router = express.Router();

const operationalRoles = ['Pre Assessor', 'Assessor', 'Verifier'];
const policyAccess = [protect(hasAnyRole(operationalRoles)), validatePolicyIdBody];

router.post('/details', ...policyAccess, policyController.getPolicyDetailsFromBody);

// Legacy GET — prefer POST /details to avoid policy numbers in URLs.
router.get('/:policyID', protect(hasAnyRole(operationalRoles)), policyController.getPolicyDetails);

module.exports = router;
