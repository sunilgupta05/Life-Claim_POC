const { refreshAssessorPoolCase, batchUpsertAssessorPoolCases, updateAssessorPoolStatus } = require('../../dataAccess/add/capsAssessorPoolCasesDao');
const { assertPoolAction } = require('../../util/capsAddCaseGuards');
const { checkForExclusionRule } = require('../../services/add/exclusionRulesService');
const exposeErrorDetails = process.env.NODE_ENV !== 'production';
const internalError = (res, error) =>
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(exposeErrorDetails ? { detail: error?.message || String(error) } : {}),
  });

/**
 * Refresh a single assessor pool case with latest data
 */
const refreshAssessorPoolCaseController = async (req, res, next) => {
    try {
        const { caseId, batchId } = req.body;

        if (!caseId) {
            return res.status(400).json({
                success: false,
                error: 'Case ID is required'
            });
        }

        const result = await refreshAssessorPoolCase(caseId, batchId || null);

        res.status(200).json({
            success: true,
            message: 'Assessor pool case refreshed successfully',
            data: result
        });
    } catch (error) {
        console.error('Error in refreshAssessorPoolCaseController:', error);
        internalError(res, error);
    }
};

/**
 * Refresh multiple assessor pool cases
 */
const refreshAssessorPoolCasesBatchController = async (req, res, next) => {
    try {
        const { caseIds, batchId } = req.body;

        if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Case IDs array is required and must not be empty'
            });
        }

        const results = [];
        const errors = [];

        for (const caseId of caseIds) {
            try {
                const exclusionResult = await checkForExclusionRule(caseId);
                const { upsertAssessorPoolCase } = require('../../dataAccess/add/capsAssessorPoolCasesDao');
                const result = await upsertAssessorPoolCase(caseId, exclusionResult, batchId || null);
                results.push({ caseId, result });
            } catch (error) {
                console.error(`Error refreshing case ${caseId}:`, error);
                errors.push({
                    caseId,
                    error: exposeErrorDetails ? (error?.message || 'Refresh failed') : 'Refresh failed',
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Refreshed ${results.length} cases successfully`,
            data: {
                successful: results,
                errors: errors
            }
        });
    } catch (error) {
        console.error('Error in refreshAssessorPoolCasesBatchController:', error);
        internalError(res, error);
    }
};

/**
 * Close multiple cases as exclusion
 */
const closeCasesAsExclusionController = async (req, res, next) => {
    try {
        const { caseIds } = req.body;

        if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Case IDs array is required'
            });
        }

        await assertPoolAction(caseIds, 'close_exclusion');
        const result = await updateAssessorPoolStatus(caseIds, 'CASE CLOSED');

        res.status(200).json({
            success: true,
            message: `${result.affectedRows} cases closed successfully`,
            data: result
        });
    } catch (error) {
        console.error('Error in closeCasesAsExclusionController:', error);
        internalError(res, error);
    }
};

/**
 * Move multiple cases to be referred (Non-Exclusion)
 */
const moveCasesToBeReferredController = async (req, res, next) => {
    try {
        const { caseIds } = req.body;

        if (!caseIds || !Array.isArray(caseIds) || caseIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Case IDs array is required'
            });
        }

        await assertPoolAction(caseIds, 'move_referred');
        const result = await updateAssessorPoolStatus(caseIds, 'MOVED TO BE REFFERED', 'N');

        res.status(200).json({
            success: true,
            message: `${result.affectedRows} cases moved to be referred successfully`,
            data: result
        });
    } catch (error) {
        console.error('Error in moveCasesToBeReferredController:', error);
        internalError(res, error);
    }
};

module.exports = {
    refreshAssessorPoolCaseController,
    refreshAssessorPoolCasesBatchController,
    closeCasesAsExclusionController,
    moveCasesToBeReferredController
};
