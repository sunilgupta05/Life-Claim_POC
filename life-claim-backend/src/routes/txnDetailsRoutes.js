const express = require('express');
const txnDetailsController = require('../controllers/txnDetailsController');
const { protect } = require('../middleware/keycloak');
const requirePermission = require('../middleware/requirePermission');
const { authorizePolicyOrClaimBodyAccess } = require('../middleware/claimAccessMiddleware');

const router = express.Router();
// Operational access (roadmap 1.2): protect() authenticates, requirePermission
// gates on policy.view (held by all operational roles today).
const txnAccess = [protect(), requirePermission('policy.view'), authorizePolicyOrClaimBodyAccess];

router.post('/txnDetails', ...txnAccess, txnDetailsController.getTxnDetailsController);
router.post('/transactionApiDBDetails', ...txnAccess, txnDetailsController.getTransactionApiDetailsController);
router.post('/txnSave', ...txnAccess, txnDetailsController.saveTransactionApiDetailsController);

module.exports = router;
