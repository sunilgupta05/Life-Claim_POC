const express = require('express');
const claimsController = require('../controllers/claimsController');
const { protect } = require('../middleware/keycloak');
const requirePermission = require('../middleware/requirePermission');
const {
  validateClaimByUsernameBody,
  validateAssignClaimsBody,
  validateChangeStatusBody,
} = require('../middleware/requestValidation');
const { authorizeClaimBodyAccess, authorizeAssignClaimsBodyAccess } = require('../middleware/claimAccessMiddleware');

const router = express.Router();

// Security: use POST body instead of URL path to avoid exposing username in request URL.
router.post('/claimByUsername', protect(), validateClaimByUsernameBody, claimsController.getClaimByUsername);

// Pre Assessors and Verifiers can assign claims
router.post(
  '/assignClaim',
  protect(),
  requirePermission('claims.view'),
  validateAssignClaimsBody,
  authorizeAssignClaimsBodyAccess,
  claimsController.assignClaims
);

// Any authenticated user with Pre Assessor role can change status
router.post(
  '/changeStatus',
  protect(),
  requirePermission('registration.edit'),
  validateChangeStatusBody,
  authorizeClaimBodyAccess,
  claimsController.changeStatus,
);

module.exports = router;