const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/keycloak');
const requirePermission = require('../middleware/requirePermission');
const fraudPreventionController = require('../controllers/fraudPreventionController');
const {
  authorizeClaimBodyAccess,
} = require('../middleware/claimAccessMiddleware');
const { validateFraudClaimBody } = require('../middleware/requestValidation');

// Operational access (roadmap 1.2): authenticate via protect(), then require a
// permission the operational roles hold today (claims.view).
// Fraud access gated on fraud.view (granted to operational roles by 0008).
const operational = [protect(), requirePermission('fraud.view')];
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
