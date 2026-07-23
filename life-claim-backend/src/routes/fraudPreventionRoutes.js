const express = require('express');
const router = express.Router();
const { protect, hasAnyRole } = require('../middleware/keycloak');
const fraudPreventionController = require('../controllers/fraudPreventionController');
const {
  authorizeClaimBodyAccess,
} = require('../middleware/claimAccessMiddleware');
const { validateFraudClaimBody } = require('../middleware/requestValidation');

const operationalRoles = ['Pre Assessor', 'Assessor', 'Verifier'];
const operational = protect(hasAnyRole(operationalRoles));
const claimScoped = [operational, validateFraudClaimBody, authorizeClaimBodyAccess];

router.post('/getSafeCityPincodeCheck', operational, fraudPreventionController.getSafeCityPincodeCheck);
router.post('/claimant_Bankdetails_Check', ...claimScoped, fraudPreventionController.getClaimantBankdetailsCheck);
router.post('/agent_Trend_Check', ...claimScoped, fraudPreventionController.agentTrendCheckController);
router.post('/mobile_Number_Check', operational, fraudPreventionController.mobileNumberCheckController);
router.post('/add_remarks_decisions', ...claimScoped, fraudPreventionController.addRemarksController);
router.post('/get_eagle_rule_details', ...claimScoped, fraudPreventionController.getEagleRuleDetailsController);
router.post('/update_eagle_rule_details', ...claimScoped, fraudPreventionController.updateEagleRuleDetailsController);
router.put('/update_eagle_rule_details', ...claimScoped, fraudPreventionController.updateEagleRuleDetailsController);

module.exports = router;
