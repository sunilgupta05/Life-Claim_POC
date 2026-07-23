//const CapsAddDetails = require('../add/CapsAddDetails');
const CapsAddDetails = require('../../models/add/CapsAddDetails');
const CapsAddDecision = require('../../models/add/CapsAddDecision');
const CapsAddRawData = require('../../models/add/CapsAddRawData');
const Users = require('../../models/User');
const { checkForExclusionRule } = require('../../services/add/exclusionRulesService');
const { upsertAssessorPoolCase } = require('./capsAssessorPoolCasesDao');
const dataEnrichmentService = require('../../services/add/dataEnrichmentService');
const { assertCasePendingApprover } = require('../../util/capsAddCaseGuards');

// to insert data into the table
const insertCapsAddDetails = async ({username, data}) => {
    try {
        console.log('DataAccess > capsAddDetailsDao.js : insertCapsAddDetails (Saving to RAW)', username, data);
       
        if (!Array.isArray(data)) {
            throw new Error('Data must be an array of objects');
        }
 
        if (data.length === 0) {
            throw new Error('Data array cannot be empty');
        }

        const insertPromises = data.map(async (item, index) => {
            const policyNumber = item.POLICY_NUMBER || item.policy_number;
            if (!policyNumber || !String(policyNumber).trim()) {
                throw new Error(`POLICY_NUMBER is required for item at index ${index}`);
            }

            const remarks = item.REMARKS ?? item.REMARK ?? item.remarks ?? item.initiation_remarks ?? null;
            const formattedReferralDate = formatDateString(item.REFERRAL_DATE ?? item.referral_date);
 
            // Save to Staging/Raw table instead of final tables directly
            const rawRecord = await CapsAddRawData.create({
                policy_number: String(policyNumber).trim(),
                source: item.SOURCE || item.source || 'Excel',
                referral_date: formattedReferralDate,
                initiation_remarks: remarks != null ? String(remarks).trim() || null : null,
                processed_flag: 0, // Pending
                created_by: username || null,
                created_on: new Date()
            });

            return rawRecord;
        });
 
        const addedRawData = await Promise.all(insertPromises);

        // 🚀 TRIGGER BACKGROUND ENRICHMENT AUTOMATICALLY
        // We don't 'await' this so the user gets a fast response while the API calls happen in background
        dataEnrichmentService.processRawDataBatch().catch(err => {
            console.error('DataAccess >> Enrichment trigger error:', err);
        });

        return addedRawData;
    } catch (err) {
        console.error('DataAccess > capsAddDetailsDao.js > insertCapsAddDetails, Error inserting into Raw Table:', err);
        throw err;
    }
}
 
function formatDateString(dateStr) {
    if (!dateStr) {
        throw new Error('Date string is required');
    }
 
    // ✅ Excel numeric date (e.g. 45703)
    if (typeof dateStr === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + dateStr * 86400000);
        return date.toISOString().split('T')[0];
    }
 
    // ✅ If already Date object
    if (dateStr instanceof Date) {
        return dateStr.toISOString().split('T')[0];
    }
 
    // Convert to string
    dateStr = String(dateStr);
 
    // YYYY-MM-DD
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
        return dateStr;
    }
 
    // DD-MM-YYYY
    if (dateStr.includes('-')) {
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
 
    // DD/MM/YYYY
    if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
 
    throw new Error(`Invalid date format: ${dateStr}`);
}
 
// to get data from the table [NOT INUSED CURRENTLY]
const getCapsAddDetails = async (attribute, value) => {
    try {
        console.log('capsAddDetailsDoa.js >> getCapsAddDetails: ', attribute, value);
        const capsAddDetails = await CapsAddDetails.findAll({
            where: {
                [attribute]: value,
                }
        });
        console.log('capsAddDetailsDoa.js >> getCapsAddDetails: ', capsAddDetails);
        return capsAddDetails;
    } catch (err) {
        console.error('DataAccess > capsAddDetailsDao.js > getCapsAddDetails, Error getting data from CapsAddDetails:', err);
        throw err;
    }
}
 
// to get based on the desicion selection of the user
// Complex query to get case details with findings and decisions
const getCapsAddDetailsByDecision = async (caseType, attribute, value, limit, offset) => {
    try {
        console.log('capsAddDetailsDoa.js >> getCapsAddDetailsWithFindings: ', caseType, attribute, value, limit, offset);

        if (!caseType || !attribute || value == null || String(value).trim() === '') {
            throw new Error('caseType, attribute, and value are required');
        }

        const allowedAttributes = {
            case_id: 'd.case_id',
            policy_number: 'd.policy_number',
            policy_no: 'd.policy_number',
            krn: 'd.krn',
            case_status: 'd.case_status',
        };

        const dbColumn = allowedAttributes[String(attribute).toLowerCase()];
        if (!dbColumn) {
            throw new Error(`Invalid search attribute: ${attribute}`);
        }

        let searchValue = String(value).trim();
        if (
            (attribute.toLowerCase() === 'policy_number' || attribute.toLowerCase() === 'policy_no') &&
            searchValue.length < 8 &&
            /^\d+$/.test(searchValue)
        ) {
            searchValue = searchValue.padStart(8, '0');
        }

        const whereClause = `f.decision = :caseType AND ${dbColumn} = :value
            AND UPPER(COALESCE(d.case_status, '')) NOT LIKE '%APPROVED BY APPROVER%'
            AND UPPER(COALESCE(d.case_status, '')) NOT LIKE '%REJECTED BY APPROVER%'
            AND UPPER(COALESCE(d.case_status, '')) NOT LIKE '%CASE CLOSED%'`;
        const replacements = { caseType, value: searchValue };

        const countRows = await CapsAddDetails.sequelize.query(
            `
            SELECT COUNT(DISTINCT d.case_id) AS total
            FROM caps_add_details d
            INNER JOIN caps_add_findings f ON d.case_id = f.case_id
            WHERE ${whereClause}
            `,
            { replacements, type: CapsAddDetails.sequelize.QueryTypes.SELECT }
        );
        const totalCount = Number(countRows?.[0]?.total ?? 0);

        const result = await CapsAddDetails.sequelize.query(
            `
            SELECT
                d.case_id AS CASE_ID,
                MAX(cd.app_no) AS APP_No,
                d.policy_number AS Policy_Number,
                d.krn AS KRN,
                d.case_status AS CaseStatus,
                GROUP_CONCAT(DISTINCT f.findings ORDER BY f.seq_no SEPARATOR '; ') AS Finding,
                GROUP_CONCAT(DISTINCT f.remarks ORDER BY f.seq_no SEPARATOR '; ') AS Remarks,
                GROUP_CONCAT(DISTINCT f.rule ORDER BY f.seq_no SEPARATOR ', ') AS Rule,
                MAX(f.decision) AS Decision,
                MAX(c.scn_aging) AS SCNAging,
                d.iris_status AS IRISStatus
            FROM caps_add_details d
            LEFT JOIN caps_add_contract_details cd ON d.case_id = cd.case_id
            LEFT JOIN caps_add_decision c ON d.case_id = c.case_id
            INNER JOIN caps_add_findings f ON d.case_id = f.case_id
            WHERE ${whereClause}
            GROUP BY d.case_id, d.policy_number, d.krn, d.case_status, d.iris_status
            ORDER BY d.case_id DESC
            LIMIT :limit OFFSET :offset
            `,
            {
                replacements: {
                    ...replacements,
                    limit: parseInt(limit, 10) || 10,
                    offset: parseInt(offset, 10) || 0,
                },
                type: CapsAddDetails.sequelize.QueryTypes.SELECT,
            }
        );

        return { data: result, totalCount };
    } catch (err) {
        console.error('DataAccess > capsAddDetailsDao.js > getCapsAddDetailsWithFindings, Error getting data:', err);
        throw err;
    }
}
 
 
const updateCapsAddDetailsCaseStatus = async (caseIds, caseStatus, username) => {
    console.log('capsAddDetailsDoa.js >> updateCapsAddDetailsCaseStatus: ', caseIds, caseStatus);

    const ids = (Array.isArray(caseIds) ? caseIds : [caseIds])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id));

    if (!ids.length) {
        throw new Error('No valid case IDs provided');
    }

    try {
        const results = [];
        for (const caseId of ids) {
            await assertCasePendingApprover(caseId);

            const capsAddDetails = await CapsAddDetails.update(
                { case_status: caseStatus, modified_by: username, modified_on: new Date() },
                { where: { case_id: caseId } },
            );

            let finalDecision = '';
            if (String(caseStatus).includes('Approved')) finalDecision = 'Approved';
            else if (String(caseStatus).includes('Rejected')) finalDecision = 'Rejected';

            if (finalDecision) {
                await CapsAddDecision.update(
                    {
                        final_decision: finalDecision,
                        modified_by: username,
                        modified_on: new Date(),
                    },
                    { where: { case_id: caseId } },
                );
            }

            results.push({ caseId, updated: capsAddDetails });
        }

        return results;
    } catch (err) {
        console.error('DataAccess > capsAddDetailsDao.js > updateCapsAddDetailsCaseStatus, Error updating data:', err);
        throw err;
    }
}
 
const getCapsAddDetailsPolicyNumberUsername = async () => {
 
    try{
        const policyRows = await CapsAddDetails.findAll({
            attributes: ['policy_number']
        });
       
        const userRows = await Users.findAll({
            attributes: ['username'],
        });
 
        const responsePolicyNumber = policyRows.map((r) => r.policy_number).filter(Boolean);
        const responseUsername = userRows.map((r) => r.username).filter(Boolean);
        return { responsePolicyNumber, responseUsername };
       // return responsePolicyNumber;
    }catch(err){
        console.error('DataAccess > capsAddDetailsDao.js > getCapsAddDetailsLpolicyNumber, Error getting data:', err);
        throw err;
    }
   
}
 
/** Bulk assign CAPS cases by policy number (Excel POLICY_ID + ASSIGNED_TO). */
const bulkAssignCasesByPolicy = async (rows, uploadedBy) => {
    const updated = [];
    const failed = [];

    for (const row of rows) {
        const policyId = String(row.POLICY_ID || row.policy_id || '').trim();
        const assignedTo = String(row.ASSIGNED_TO || row.assigned_to || '').trim();
        if (!policyId || !assignedTo) {
            failed.push({ policyId: policyId || '—', reason: 'Missing POLICY_ID or ASSIGNED_TO' });
            continue;
        }

        let searchPolicy = policyId;
        if (searchPolicy.length < 8 && /^\d+$/.test(searchPolicy)) {
            searchPolicy = searchPolicy.padStart(8, '0');
        }

        const [affected] = await CapsAddDetails.update(
            {
                assigned_to: assignedTo,
                assigned_by: uploadedBy,
                modified_by: uploadedBy,
                modified_on: new Date(),
            },
            { where: { policy_number: searchPolicy } }
        );

        if (affected > 0) {
            updated.push({ policyId: searchPolicy, assignedTo, rowsUpdated: affected });
        } else {
            failed.push({ policyId: searchPolicy, reason: 'Policy not found in caps_add_details' });
        }
    }

    return { updated, failed };
};

/** Assign one or more CAPS cases by numeric case_id. */
const assignCasesByCaseIds = async (caseIds, assignedTo, assignedBy) => {
    const updated = [];
    const failed = [];

    for (const rawId of caseIds) {
        const caseId = parseInt(rawId, 10);
        if (!Number.isFinite(caseId)) {
            failed.push({ caseId: rawId, reason: 'Invalid case id' });
            continue;
        }

        const [affected] = await CapsAddDetails.update(
            {
                assigned_to: assignedTo,
                assigned_by: assignedBy,
                modified_by: assignedBy,
                modified_on: new Date(),
            },
            { where: { case_id: caseId } }
        );

        if (affected > 0) {
            updated.push(caseId);
        } else {
            failed.push({ caseId, reason: 'Case not found in caps_add_details' });
        }
    }

    return { updated, failed };
};

module.exports = {
    insertCapsAddDetails,
    getCapsAddDetails,
    getCapsAddDetailsByDecision,
    updateCapsAddDetailsCaseStatus,
    getCapsAddDetailsPolicyNumberUsername,
    bulkAssignCasesByPolicy,
    assignCasesByCaseIds,
};
