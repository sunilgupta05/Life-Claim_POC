const express = require('express');
const { getAllCaseReasons, getSystemAssessorRemarks } = require('../controllers/caseReasonsController');
const { protect } = require('../middleware/keycloak');
const requirePermission = require('../middleware/requirePermission');

const router = express.Router();

// Security: Protect case reasons and assessor remarks for assessor-related roles
// Operational access (roadmap 1.2): protect() authenticates, requirePermission
// gates on claims.view (held by all operational roles today).
const operational = [protect(), requirePermission('claims.view')];

router.get('/', ...operational, getAllCaseReasons);
router.post('/system-assessor-remarks', ...operational, getSystemAssessorRemarks);

module.exports = router;
