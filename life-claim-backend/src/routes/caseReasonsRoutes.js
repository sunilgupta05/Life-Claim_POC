const express = require('express');
const { getAllCaseReasons, getSystemAssessorRemarks } = require('../controllers/caseReasonsController');
const { protect, hasAnyRole } = require('../middleware/keycloak');

const router = express.Router();

// Security: Protect case reasons and assessor remarks for assessor-related roles
const assessorRoles = ['Pre Assessor', 'Assessor', 'Verifier'];

router.get('/', protect(hasAnyRole(assessorRoles)), getAllCaseReasons);
router.post('/system-assessor-remarks', protect(hasAnyRole(assessorRoles)), getSystemAssessorRemarks);

module.exports = router;
