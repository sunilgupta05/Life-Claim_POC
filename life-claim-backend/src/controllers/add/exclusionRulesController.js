const { checkForExclusionRule } = require('../../services/add/exclusionRulesService');
const { upsertAssessorPoolCase } = require('../../dataAccess/add/capsAssessorPoolCasesDao');
const exposeErrorDetails = process.env.NODE_ENV !== 'production';
const internalError = (res, error) =>
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(exposeErrorDetails ? { detail: error?.message || String(error) } : {}),
  });

/**
 * Apply exclusion rules to a specific case
 */
const applyExclusionRulesToCase = async (req, res, next) => {
    try {
        const { caseId, batchId } = req.body;

        if (!caseId) {
            return res.status(400).json({
                success: false,
                error: 'Case ID is required'
            });
        }

        const exclusionResult = await checkForExclusionRule(caseId);
        await upsertAssessorPoolCase(caseId, exclusionResult, batchId || null);

        res.status(200).json({
            success: true,
            message: 'Exclusion rules applied successfully',
            data: {
                caseId,
                exclusionResult
            }
        });
    } catch (error) {
        console.error('Error in applyExclusionRulesToCase:', error);
        internalError(res, error);
    }
};

/**
 * Apply exclusion rules to multiple cases (batch processing)
 */
const applyExclusionRulesToMultipleCases = async (req, res, next) => {
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
                await upsertAssessorPoolCase(caseId, exclusionResult, batchId || null);
                results.push({ caseId, exclusionResult });
            } catch (error) {
                console.error(`Error processing case ${caseId}:`, error);
                errors.push({
                    caseId,
                    error: exposeErrorDetails ? (error?.message || 'Processing failed') : 'Processing failed',
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Processed ${results.length} cases successfully`,
            data: {
                successful: results,
                errors: errors
            }
        });
    } catch (error) {
        console.error('Error in applyExclusionRulesToMultipleCases:', error);
        internalError(res, error);
    }
};

module.exports = {
    applyExclusionRulesToCase,
    applyExclusionRulesToMultipleCases
};
