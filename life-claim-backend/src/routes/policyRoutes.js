const express = require('express');
const policyController = require('../controllers/policyController');
const { protect } = require('../middleware/keycloak');
const requirePermission = require('../middleware/requirePermission');
const { validatePolicyIdBody } = require('../middleware/requestValidation');

const router = express.Router();

// Operational access (roadmap 1.2): protect() authenticates, requirePermission
// gates on policy.view (held by all operational roles today).
const operational = [protect(), requirePermission('policy.view')];
const policyAccess = [...operational, validatePolicyIdBody];

router.post('/details', ...policyAccess, policyController.getPolicyDetailsFromBody);

// Legacy GET — prefer POST /details to avoid policy numbers in URLs.
router.get('/:policyID', ...operational, policyController.getPolicyDetails);

module.exports = router;
