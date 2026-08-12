const express = require('express');
const router = express.Router();
const dashboardActivityController = require('../controllers/dashboardActivityController');
const { protect } = require('../middleware/keycloak');
const requirePermission = require('../middleware/requirePermission');

// VAPT: was reachable by any authenticated user regardless of role; restricted
// to the operational roles that actually work claims (matches every other
// claims-related route's access model).
// Operational access (roadmap 1.2): protect() authenticates, requirePermission
// gates on dashboard.view (held by all operational roles; superuser bypasses).
router.get('/activities', protect(), requirePermission('dashboard.view'), dashboardActivityController.getDashboardActivities);

module.exports = router;
