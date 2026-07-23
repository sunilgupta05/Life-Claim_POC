const CapsAddDecisionMaster = require('../../models/add/CapsAddDecisionMaster');
const CapsAddDecision = require('../../models/add/CapsAddDecision');
const { assertCaseEditable } = require('../../util/capsAddCaseGuards');

/**
 * Fetch all decision master data for dropdowns
 */
const getDecisionMasterData = async () => {
    try {
        return await CapsAddDecisionMaster.findAll();
    } catch (error) {
        console.error('Error in getDecisionMasterData DAO:', error);
        throw error;
    }
};

/**
 * Save or update decision for a case
 */
const saveDecision = async (decisionData, username) => {
    try {
        const caseId = Number(decisionData.case_id);
        if (!Number.isFinite(caseId)) {
            throw new Error('Invalid case id');
        }

        await assertCaseEditable(caseId);

        const dataToSave = {
            ...decisionData,
            case_id: caseId,
            modified_by: username,
            modified_on: new Date(),
        };

        const [decision, created] = await CapsAddDecision.upsert(dataToSave, {
            returning: true,
        });

        return { decision, created };
    } catch (error) {
        console.error('Error in saveDecision DAO:', error);
        throw error;
    }
};

module.exports = {
    getDecisionMasterData,
    saveDecision
};

