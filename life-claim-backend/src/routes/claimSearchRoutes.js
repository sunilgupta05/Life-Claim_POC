const express = require('express');
const { getClaimSearch, updateAssessor, updateVerifier } = require('../controllers/claimSearchController');
const { protect } = require('../middleware/keycloak');
const requirePermission = require('../middleware/requirePermission');
const { authorizeClaimBodyAccess } = require('../middleware/claimAccessMiddleware');

const router = express.Router();

// Operational access (roadmap 1.2): protect() authenticates, requirePermission
// gates. claims.search is held by all operational roles today; update-ver is
// Verifier-only, so it uses the Verifier-exclusive claims.verify (migration 0006).
const operational = [protect(), requirePermission('claims.search')];

router.post('/', ...operational, authorizeClaimBodyAccess, getClaimSearch);
router.post('/update-ass', protect(), requirePermission('claims.edit'), authorizeClaimBodyAccess, updateAssessor);
router.post('/update-ver', protect(), requirePermission('claims.verify'), authorizeClaimBodyAccess, updateVerifier);

module.exports = router;