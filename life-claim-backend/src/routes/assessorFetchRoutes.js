const express = require('express');
const {
  getDemogs,
  getRequirement,
  getAssessment,
  getDecision,
  getCalculateAmount,
} = require('../controllers/assessorController');
const { protect, hasAnyRole } = require('../middleware/keycloak');
const {
  authorizeClaimBodyAccess,
  authorizeClaimParamAccess,
} = require('../middleware/claimAccessMiddleware');
const { validateClaimNoBody } = require('../middleware/requestValidation');
const { injectClaimNoFromBody } = require('../middleware/assessorFetchBody');

const router = express.Router();

const assessorOrVerifier = ['Pre Assessor', 'Assessor', 'Verifier'];
const postClaimFetch = [
  protect(hasAnyRole(assessorOrVerifier)),
  validateClaimNoBody,
  authorizeClaimBodyAccess,
  injectClaimNoFromBody,
];

router.post('/demogs', ...postClaimFetch, getDemogs);
router.post('/require', ...postClaimFetch, getRequirement);
router.post('/assess', ...postClaimFetch, getAssessment);
router.post('/decision', ...postClaimFetch, getDecision);
router.post('/calcAmt', ...postClaimFetch, getCalculateAmount);

// Legacy GET routes — access-checked; prefer POST to avoid PII in URLs.
router.get('/demogs/:claimNo', protect(hasAnyRole(assessorOrVerifier)), authorizeClaimParamAccess, getDemogs);
router.get('/require/:claimNo', protect(hasAnyRole(assessorOrVerifier)), authorizeClaimParamAccess, getRequirement);
router.get('/assess/:claimNo', protect(hasAnyRole(assessorOrVerifier)), authorizeClaimParamAccess, getAssessment);
router.get('/decision/:claimNo', protect(hasAnyRole(assessorOrVerifier)), authorizeClaimParamAccess, getDecision);
router.get('/calcAmt/:claimNo', protect(hasAnyRole(assessorOrVerifier)), authorizeClaimParamAccess, getCalculateAmount);

module.exports = router;
