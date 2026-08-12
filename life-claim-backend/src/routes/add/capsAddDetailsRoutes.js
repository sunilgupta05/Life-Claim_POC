const express = require('express');
const { protect } = require('../../middleware/keycloak');
const requirePermission = require('../../middleware/requirePermission');
const capsAddDetailsController = require('../../controllers/add/capsAddDetailsController');
const capsAddCaseSearchController = require('../../controllers/add/caseSearchController');
const capsAssessmentPoolController = require('../../controllers/add/capsAssessmentPoolController');
const exclusionRulesController = require('../../controllers/add/exclusionRulesController');
const assessorPoolCasesController = require('../../controllers/add/assessorPoolCasesController');
const capsAddDecisionController = require('../../controllers/add/capsAddDecisionController');
const capsAddFindingsController = require('../../controllers/add/capsAddFindingsController');
const { authorizeAddCaseBodyAccess } = require('../../middleware/addCaseAccessMiddleware');
const assertBodyUsernameMatchesSession = require('../../middleware/assertBodyUsername');
const router = express.Router();

// Fine-grained ADD (Advance Intelligence) access (roadmap 1.5 follow-on):
//   assessment.view — load/search/pool/refresh (read the ADD workspace)
//   assessment.act  — save findings / apply exclusion rules / assign / close / move
//   decision.act    — save final decision / approver approve
// Migration 0008 grants these to the operational roles so behaviour is unchanged
// until an admin narrows them. Arrays are passed as one arg; Express flattens.
const view = [protect(), requirePermission('assessment.view')];
const viewWithUser = [...view, assertBodyUsernameMatchesSession];
const act = [protect(), requirePermission('assessment.act')];
const decide = [protect(), requirePermission('decision.act')];

router.post('/addValue', viewWithUser, capsAddDetailsController.addExcelDataToTable);
router.post('/resetDemoData', view, capsAddDetailsController.resetAddDemoDataController);
router.get('/decisionMasterData', view, capsAddDecisionController.getDecisionMasterData);
router.post('/saveDecision', decide, authorizeAddCaseBodyAccess, capsAddDecisionController.saveDecisionController);
router.post('/saveFindings', act, authorizeAddCaseBodyAccess, capsAddFindingsController.saveFindingsController);
router.post('/getData', viewWithUser, capsAddDetailsController.getCapsAddDetailsByDecision);
router.post('/approver-approve', decide, authorizeAddCaseBodyAccess, capsAddDetailsController.updateCapsAddDetailsCaseStatusController);
router.post('/search', viewWithUser, capsAddCaseSearchController.getCaseSearchController);
router.post('/pool', viewWithUser, capsAssessmentPoolController.getAssessmentPoolData);
router.post('/getCaseDetails', view, authorizeAddCaseBodyAccess, capsAssessmentPoolController.getCaseDetails);
router.post('/refreshLifeAsiaData', view, authorizeAddCaseBodyAccess, capsAssessmentPoolController.refreshCaseData);
router.post('/policynumberusername', view, capsAddDetailsController.getCapsAddDetailsPolicyNumberUsername);
router.post('/add', viewWithUser, capsAddDetailsController.addCaseAssignmentBulk);
router.post('/assign', act, authorizeAddCaseBodyAccess, capsAddDetailsController.assignCasesByCaseIdsController);
router.post('/applyExclusionRules', act, authorizeAddCaseBodyAccess, exclusionRulesController.applyExclusionRulesToCase);
router.post('/applyExclusionRulesBatch', act, authorizeAddCaseBodyAccess, exclusionRulesController.applyExclusionRulesToMultipleCases);
router.post('/refreshAssessorPoolCase', view, authorizeAddCaseBodyAccess, assessorPoolCasesController.refreshAssessorPoolCaseController);
router.post('/refreshAssessorPoolCasesBatch', view, authorizeAddCaseBodyAccess, assessorPoolCasesController.refreshAssessorPoolCasesBatchController);
router.post('/closeCasesAsExclusion', act, authorizeAddCaseBodyAccess, assessorPoolCasesController.closeCasesAsExclusionController);
router.post('/moveCasesToBeReferred', act, authorizeAddCaseBodyAccess, assessorPoolCasesController.moveCasesToBeReferredController);

module.exports = router;
