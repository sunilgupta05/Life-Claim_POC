const express = require('express');
const { getSelectedPool, updateAssignedUser } = require('../controllers/poolSelectionController');
const { protect } = require('../middleware/keycloak');
const requirePermission = require('../middleware/requirePermission');
const { authorizePoolAssignAccess } = require('../middleware/claimAccessMiddleware');

const router = express.Router();

// Pool access (roadmap 1.2): protect() authenticates, requirePermission gates on
// pool.assign, which only Assessor and Verifier hold today (Pre Assessor excluded).
const poolAccess = [protect(), requirePermission('pool.assign')];

router.post('/', ...poolAccess, getSelectedPool);
router.patch('/:claimNumber', ...poolAccess, authorizePoolAssignAccess, updateAssignedUser);

module.exports = router;