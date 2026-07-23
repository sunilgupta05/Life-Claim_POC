const CapsAddAssessorPoolCases = require('../../models/add/CapsAddAssessorPoolCases');
const CapsAddDetails = require('../../models/add/CapsAddDetails');
const CapsAddContractDetails = require('../../models/add/CapsAddContractDetails');
const CapsAddLifeAssuredDetails = require('../../models/add/CapsAddLifeAssuredDetails');
const CapsAddDecision = require('../../models/add/CapsAddDecision');
const db = require('../../config/dbConfig');

/**
 * Inserts or updates a record in caps_add_assessor_pool_cases
 */
const upsertAssessorPoolCase = async (caseId, exclusionResult, batchId = null, additionalData = null) => {
    try {
        // Fetch all related data for the case using lowercase column names
        const queryText = `
            SELECT 
                d.case_id,
                d.policy_number,
                d.krn,
                d.source,
                d.referral_date,
                d.case_status,
                d.exclusion_type_rule,
                d.iris_status,
                cd.app_no AS application_no,
                cd.product_code,
                cd.policy_status,
                cd.base_sa,
                la.city,
                la.state,
                la.pincode,
                deci.scn_aging AS sch_aging
            FROM caps_add_details d 
            LEFT JOIN caps_add_contract_details cd ON d.case_id = cd.case_id 
            LEFT JOIN caps_add_life_assured_details la ON d.case_id = la.case_id 
            LEFT JOIN caps_add_decision deci ON d.case_id = deci.case_id 
            WHERE d.case_id = ?
        `;

        const [rows] = await db.query(queryText, [caseId]);
        
        if (!rows || rows.length === 0) {
            throw new Error(`Case ID ${caseId} not found`);
        }

        const caseData = rows[0];

        const isExcluded = exclusionResult.exclusionApplied ? 'Y' : 'N';
        const exclusionType = exclusionResult.exclusionType || null;

        const existingRecord = await CapsAddAssessorPoolCases.findOne({
            where: {
                case_id: caseId,
                batch_id: batchId
            }
        });

        const poolCaseData = {
            case_id: caseId,
            application_no: additionalData?.application_no || additionalData?.app_no || caseData.application_no || null,
            policy_no: additionalData?.policy_no || additionalData?.policy_number || caseData.policy_number || null,
            ksn: additionalData?.ksn || additionalData?.krn || caseData.krn || null,
            source: additionalData?.source || caseData.source || null,
            referral_date: additionalData?.referral_date || caseData.referral_date || null,
            trigger_date: additionalData?.trigger_date || new Date(),
            case_status: additionalData?.case_status || caseData.case_status || 'Assessor Action Pending',
            is_excluded: isExcluded,
            exclusion_type: exclusionType,
            status: isExcluded === 'N' ? 'Non-Exclusion' : 'Exclusion',
            irss_status: additionalData?.iris_status || caseData.iris_status || null,
            sch_aging: additionalData?.scn_aging || caseData.sch_aging || null,
            product_code: additionalData?.product_code || caseData.product_code || null,
            policy_status: additionalData?.policy_status || caseData.policy_status || null,
            base_sa: additionalData?.base_sa || caseData.base_sa || null,
            city: additionalData?.city || caseData.city || null,
            state: additionalData?.state || caseData.state || null,
            pincode: additionalData?.pincode || caseData.pincode || null,
            batch_id: batchId,
            created_at: existingRecord ? existingRecord.created_at : new Date()
        };

        if (existingRecord) {
            const updateData = {};
            Object.keys(poolCaseData).forEach(key => {
                if (key === 'is_excluded' || key === 'exclusion_type' || key === 'status' || 
                    key === 'trigger_date' || (poolCaseData[key] !== null && poolCaseData[key] !== undefined)) {
                    updateData[key] = poolCaseData[key];
                }
            });
            delete updateData.created_at;
            
            await CapsAddAssessorPoolCases.update(updateData, {
                where: {
                    case_id: caseId,
                    batch_id: batchId
                }
            });
            return { ...poolCaseData, id: existingRecord.id, updated: true };
        } else {
            const newRecord = await CapsAddAssessorPoolCases.create(poolCaseData);
            return { ...newRecord.toJSON(), updated: false };
        }

    } catch (error) {
        console.error('Error in upsertAssessorPoolCase:', error);
        throw error;
    }
};

const refreshAssessorPoolCase = async (caseId, batchId = null) => {
    try {
        const { checkForExclusionRule } = require('../../services/add/exclusionRulesService');
        const exclusionResult = await checkForExclusionRule(caseId);
        return await upsertAssessorPoolCase(caseId, exclusionResult, batchId);
    } catch (error) {
        console.error('Error in refreshAssessorPoolCase:', error);
        throw error;
    }
};

const batchUpsertAssessorPoolCases = async (caseIds, exclusionResults, batchId = null) => {
    try {
        const results = [];
        for (const caseId of caseIds) {
            const exclusionResult = exclusionResults[caseId] || { exclusionApplied: false, exclusionType: null };
            const result = await upsertAssessorPoolCase(caseId, exclusionResult, batchId);
            results.push(result);
        }
        return results;
    } catch (error) {
        console.error('Error in batchUpsertAssessorPoolCases:', error);
        throw error;
    }
};

const updateAssessorPoolStatus = async (caseIds, status, isExcluded = null) => {
    try {
        const updateData = { case_status: status };
        if (isExcluded !== null) {
            updateData.is_excluded = isExcluded;
            updateData.status = isExcluded === 'N' ? 'Non-Exclusion' : 'Exclusion';
        }

        const [affectedRows] = await CapsAddAssessorPoolCases.update(updateData, {
            where: { case_id: caseIds }
        });

        await CapsAddDetails.update({ case_status: status }, {
            where: { case_id: caseIds }
        });

        return { affectedRows };
    } catch (error) {
        console.error('Error in updateAssessorPoolStatus:', error);
        throw error;
    }
};

module.exports = {
    upsertAssessorPoolCase,
    batchUpsertAssessorPoolCases,
    refreshAssessorPoolCase,
    updateAssessorPoolStatus
};
