const express = require('express');
const router = express.Router();
const dashboardActivityController = require('../controllers/dashboardActivityController');
const { protect, hasAnyRole } = require('../middleware/keycloak');

// VAPT: was reachable by any authenticated user regardless of role; restricted
// to the operational roles that actually work claims (matches every other
// claims-related route's access model).
const operationalRoles = ['Pre Assessor', 'Assessor', 'Verifier', 'superuser', 'super user'];
router.get('/activities', protect(hasAnyRole(operationalRoles)), dashboardActivityController.getDashboardActivities);

module.exports = router;
