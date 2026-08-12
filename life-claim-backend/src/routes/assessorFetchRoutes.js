const express = require('express');
const {
  getDemogs,
  getRequirement,
  getAssessment,
  getDecision,
  getCalculateAmount,
} = require('../controllers/assessorController');
const { protect } = require('../middleware/keycloak');
const requirePermission = require('../middleware/requirePermission');
const {
  authorizeClaimBodyAccess,
  authorizeClaimParamAccess,
} = require('../middleware/claimAccessMiddleware');
const { validateClaimNoBody } = require('../middleware/requestValidation');
const { injectClaimNoFromBody } = require('../middleware/assessorFetchBody');

const router = express.Router();

// Fine-grained access (roadmap 1.5 follow-on): protect() authenticates, then the
// permission is specific to the workspace tab the data feeds — demographics /
// requirements / calc use claims.view, the Assessment tab uses assessment.view,
// the Decision tab uses decision.view. Migration 0008 grants these to the
// operational roles so today's access is preserved until an admin narrows it.
const post = (perm) => [
  protect(),
  requirePermission(perm),
  validateClaimNoBody,
  authorizeClaimBodyAccess,
  injectClaimNoFromBody,
];
const get = (perm) => [protect(), requirePermission(perm), authorizeClaimParamAccess];

router.post('/demogs', ...post('claims.view'), getDemogs);
router.post('/require', ...post('claims.view'), getRequirement);
router.post('/assess', ...post('assessment.view'), getAssessment);
router.post('/decision', ...post('decision.view'), getDecision);
router.post('/calcAmt', ...post('claims.view'), getCalculateAmount);

// Legacy GET routes — access-checked; prefer POST to avoid PII in URLs.
router.get('/demogs/:claimNo', ...get('claims.view'), getDemogs);
router.get('/require/:claimNo', ...get('claims.view'), getRequirement);
router.get('/assess/:claimNo', ...get('assessment.view'), getAssessment);
router.get('/decision/:claimNo', ...get('decision.view'), getDecision);
router.get('/calcAmt/:claimNo', ...get('claims.view'), getCalculateAmount);

module.exports = router;
