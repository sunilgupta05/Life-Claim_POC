const express = require('express');
const router = express.Router();
const registerClaimController = require('../controllers/registerClaimController');
const { updateClaim } = require('../controllers/updateClaimController');
const { protect } = require('../middleware/keycloak');
const requirePermission = require('../middleware/requirePermission');
const { authorizeClaimBodyAccess } = require('../middleware/claimAccessMiddleware');
const { validateBody } = require('../middleware/validateJoi');
const {
  registerClaimBodySchema,
  updateClaimBodySchema,
} = require('../validation/registerClaimSchemas');

// Roadmap 1.2: protect() authenticates; requirePermission gates. registration.create
// is Pre-Assessor-only today; claims.view (below) is held by all operational roles.

// Pre Assessors can register claims
router.post(
  '/',
  protect(),
  requirePermission('registration.create'),
  validateBody(registerClaimBodySchema),
  registerClaimController.registerClaim,
);
router.post(
  '/update',
  protect(),
  requirePermission('claims.view'),
  validateBody(updateClaimBodySchema),
  authorizeClaimBodyAccess,
  updateClaim,
);

module.exports = router;
