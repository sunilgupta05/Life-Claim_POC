const express = require('express');
const { protect, hasAnyRole } = require('../../middleware/keycloak');
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

const assessorOrVerifier = ['Pre Assessor', 'Assessor', 'Verifier'];
const addRole = protect(hasAnyRole(assessorOrVerifier));
const addWithUser = [addRole, assertBodyUsernameMatchesSession];

router.post('/addValue', ...addWithUser, capsAddDetailsController.addExcelDataToTable);
router.post('/resetDemoData', addRole, capsAddDetailsController.resetAddDemoDataController);
router.get('/decisionMasterData', addRole, capsAddDecisionController.getDecisionMasterData);
router.post('/saveDecision', addRole, authorizeAddCaseBodyAccess, capsAddDecisionController.saveDecisionController);
router.post('/saveFindings', addRole, authorizeAddCaseBodyAccess, capsAddFindingsController.saveFindingsController);
router.post('/getData', ...addWithUser, capsAddDetailsController.getCapsAddDetailsByDecision);
router.post('/approver-approve', addRole, authorizeAddCaseBodyAccess, capsAddDetailsController.updateCapsAddDetailsCaseStatusController);
router.post('/search', ...addWithUser, capsAddCaseSearchController.getCaseSearchController);
router.post('/pool', ...addWithUser, capsAssessmentPoolController.getAssessmentPoolData);
router.post('/getCaseDetails', addRole, authorizeAddCaseBodyAccess, capsAssessmentPoolController.getCaseDetails);
router.post('/refreshLifeAsiaData', addRole, authorizeAddCaseBodyAccess, capsAssessmentPoolController.refreshCaseData);
router.post('/policynumberusername', addRole, capsAddDetailsController.getCapsAddDetailsPolicyNumberUsername);
router.post('/add', ...addWithUser, capsAddDetailsController.addCaseAssignmentBulk);
router.post('/assign', addRole, authorizeAddCaseBodyAccess, capsAddDetailsController.assignCasesByCaseIdsController);
router.post('/applyExclusionRules', addRole, authorizeAddCaseBodyAccess, exclusionRulesController.applyExclusionRulesToCase);
router.post('/applyExclusionRulesBatch', addRole, authorizeAddCaseBodyAccess, exclusionRulesController.applyExclusionRulesToMultipleCases);
router.post('/refreshAssessorPoolCase', addRole, authorizeAddCaseBodyAccess, assessorPoolCasesController.refreshAssessorPoolCaseController);
router.post('/refreshAssessorPoolCasesBatch', addRole, authorizeAddCaseBodyAccess, assessorPoolCasesController.refreshAssessorPoolCasesBatchController);
router.post('/closeCasesAsExclusion', addRole, authorizeAddCaseBodyAccess, assessorPoolCasesController.closeCasesAsExclusionController);
router.post('/moveCasesToBeReferred', addRole, authorizeAddCaseBodyAccess, assessorPoolCasesController.moveCasesToBeReferredController);

module.exports = router;
