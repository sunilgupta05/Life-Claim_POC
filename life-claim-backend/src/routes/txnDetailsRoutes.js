const express = require('express');
const txnDetailsController = require('../controllers/txnDetailsController');
const { protect, hasAnyRole } = require('../middleware/keycloak');
const { authorizePolicyOrClaimBodyAccess } = require('../middleware/claimAccessMiddleware');

const router = express.Router();
const operationalRoles = ['Pre Assessor', 'Assessor', 'Verifier'];
const txnAccess = [protect(hasAnyRole(operationalRoles)), authorizePolicyOrClaimBodyAccess];

router.post('/txnDetails', ...txnAccess, txnDetailsController.getTxnDetailsController);
router.post('/transactionApiDBDetails', ...txnAccess, txnDetailsController.getTransactionApiDetailsController);
router.post('/txnSave', ...txnAccess, txnDetailsController.saveTransactionApiDetailsController);

module.exports = router;
