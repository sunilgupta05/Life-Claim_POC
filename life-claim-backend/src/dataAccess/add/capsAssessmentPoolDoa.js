const CapsAddDetails = require('../../models/add/CapsAddDetails');
const CapsAddContractDetails = require('../../models/add/CapsAddContractDetails');
const CapsAddLifeAssuredDetails = require('../../models/add/CapsAddLifeAssuredDetails');
const CapsAddDecision = require('../../models/add/CapsAddDecision');
const CapsAddAssessorPoolCases = require('../../models/add/CapsAddAssessorPoolCases');
const CapsAddFindings = require('../../models/add/CapsAddFindings');
const db = require('../../config/dbConfig');
const { formatProductName } = require('../../util/formatProductName');

//using raw query to get the data from the database
const getAssessmentPoolDataRaw = async (attribute, value) => {
    console.log(` dataAccess>>CapsAssessmentPoolDOA>>getAssessmentDataRaw>>caseId: Attribute: ${attribute} Value: ${value} `);
    if (!value) {
        return "Missing value! Add Data in the value field.";
    } else if (!attribute) {
        return "Missing attribute! Add Data in the attribute field.";
    } else {
        console.log(` dataAccess>>CapsAssessmentPoolDOA>>getAssessmentDataRaw>>caseId: Attribute: ${attribute} Value: ${value} else block`);
        try {
            // Whitelist allowed attributes to prevent SQL Injection on column names
            const allowedAttributes = {
                'case_id': 'd.case_id',
                'policy_number': 'd.policy_number',
                'krn': 'd.krn',
                'policy_no': 'd.policy_number'
            };

            const dbColumn = allowedAttributes[attribute.toLowerCase()];
            if (!dbColumn) {
                console.error(`Invalid attribute provided: ${attribute}`);
                return "Invalid search attribute.";
            }

            const response = await db.query(`SELECT d.case_id, d.policy_number, d.krn, d.source, d.referral_date, d.case_status, d.exclusion_type_rule, d.iris_status, cd.app_no AS application_number, cd.product_code AS product_code, cd.policy_status AS policy_status, cd.base_sa AS base_sum_assured, la.city, la.state, la.pincode, deci.scn_aging AS scn_aging 
            FROM CAPS_ADD_DETAILS d INNER JOIN CAPS_ADD_CONTRACT_DETAILS cd ON d.case_id = cd.case_id 
            INNER JOIN CAPS_ADD_LIFE_ASSURED_DETAILS la ON d.case_id = la.case_id 
            INNER JOIN CAPS_ADD_DECISION deci ON d.case_id = deci.case_id 
            where ${dbColumn} = ? LIMIT 10 offset 0;`, [value]);
            console.log(` dataAccess>>CapsAssessmentPoolDOA>>getAssessmentDataRaw>>response: `, response);
            return response;
        } catch (error) {
            console.log(` dataAccess>>CapsAssessmentPoolDOA>>getAssessmentDataRaw>>error: `, error);
            return error;
        }
    }
}

//using ORM to get the data from the database
const getAssessmentData = async (attribute, value) => {
    console.log(` dataAccess>>CapsAssessmentPoolDOA>>getAssessmentData>>caseId: Attribute: ${attribute} Value: ${value} `);

    try {
        const response = await CapsAddDetails.findAll({
            where: {
                policy_number: '04027489'
            },
            attributes: [
                'case_id',
                'policy_number',
                'krn',
                'source',
                'referral_date',
                'case_status',
                'exclusion_type_rule',
                'iris_status'
            ],
            include: [
                {
                    model: CapsAddContractDetails,
                    as: 'contractDetails',
                    attributes: [
                        ['app_no', 'application_number'],
                        ['product_code', 'product_code'],
                        ['policy_status', 'policy_status'],
                        ['base_sa', 'base_sum_assured']
                    ]
                },
                {
                    model: CapsAddLifeAssuredDetails,
                    as: 'lifeAssuredDetails',
                    attributes: ['city', 'state', 'pincode']
                },
                {
                    model: CapsAddDecision,
                    as: 'decision',
                    attributes: [['scn_aging', 'scn_aging']]
                }
            ],
            limit: 10,
            offset: 0
        });


        console.log(` dataAccess>>CapsAssessmentPoolDOA>>getAssessmentData>>response: `, response);
        return response;

    } catch (error) {
        console.log(` dataAccess>>CapsAssessmentPoolDOA>>getAssessmentData>>error: `, error);
        return error
    }
}

/**
 * Fetch assessor pool cases with data from related tables using LEFT JOINs
 * This ensures we always get the latest data from all related tables
 * Supports optional filtering by attribute and value
 * @param {string} attribute - Optional attribute to filter by
 * @param {string} value - Optional value to filter by
 * @param {string} exclusionFilter - Optional: 'Y' for exclusion cases, 'N' for non-exclusion cases, null for all
 * @returns {Promise<Array>}
 */
const getAssessorPoolCases = async (attribute = null, value = null, exclusionFilter = null, limit = 5, offset = 0) => {
    console.log(`dataAccess>>CapsAssessmentPoolDOA>>getAssessorPoolCases>>Attribute: ${attribute}, Value: ${value}, ExclusionFilter: ${exclusionFilter}, Limit: ${limit}, Offset: ${offset}`);
    
    try {
        // Build WHERE clause dynamically
        let whereConditions = [];
        let queryParams = [];
        
        // Map frontend attribute names to database column names for filtering
        const attributeMap = {
            'case_id': 'ap.CASE_ID',
            'policy_number': 'ap.POLICY_NO',
            'policy_no': 'ap.POLICY_NO',
            'krn': 'ap.KSN',
            'ksn': 'ap.KSN',
            'application_number': 'ap.APPLICATION_NO',
            'app_no': 'ap.APPLICATION_NO',
            'case_status': 'ap.CASE_STATUS',
            'irss_status': 'ap.IRSS_STATUS',
            'iris_status': 'ap.IRSS_STATUS',
            'product_code': 'ap.PRODUCT_CODE',
            'policy_status': 'ap.POLICY_STATUS',
            'base_sa': 'ap.BASE_SA',
            'city': 'ap.CITY',
            'state': 'ap.STATE',
            'pincode': 'ap.PINCODE'
        };
        
        // Add attribute filter if provided
        if (attribute && value) {
            const dbColumn = attributeMap[attribute.toLowerCase()];
            if (dbColumn) {
                let searchValue = String(value).trim();
                if (
                    (attribute.toLowerCase() === 'policy_number' || attribute.toLowerCase() === 'policy_no') &&
                    searchValue.length < 8 &&
                    /^\d+$/.test(searchValue)
                ) {
                    searchValue = searchValue.padStart(8, '0');
                }
                whereConditions.push(`${dbColumn} = ?`);
                queryParams.push(searchValue);
            } else {
                console.warn(`Attempted search with unsupported attribute: ${attribute}`);
                // Don't add a filter for an unknown attribute to keep it safe
            }
        }
        
        // Add exclusion filter if provided
        if (exclusionFilter !== null) {
            // Read directly from IS_EXCLUDED column in CAPS_ADD_ASSESSOR_POOL_CASES
            whereConditions.push(`ap.IS_EXCLUDED = ?`);
            queryParams.push(exclusionFilter);
        }
        
        // Build the complete query — one row per case (latest pool entry if duplicates exist)
        let queryText = `
            SELECT 
                ap.ID,
                ap.CASE_ID,
                ap.APPLICATION_NO,
                ap.POLICY_NO,
                ap.KSN,
                ap.SOURCE,
                ap.REFERRAL_DATE,
                ap.TRIGGER_DATE,
                ap.CASE_STATUS,
                ap.IS_EXCLUDED,
                ap.EXCLUSION_TYPE,
                ap.STATUS,
                ap.IRSS_STATUS,
                ap.SCH_AGING,
                ap.PRODUCT_CODE,
                ap.POLICY_STATUS,
                ap.BASE_SA,
                ap.CITY,
                ap.STATE,
                ap.PINCODE,
                ap.BATCH_ID,
                ap.CREATED_AT
            FROM CAPS_ADD_ASSESSOR_POOL_CASES ap
            INNER JOIN (
                SELECT CASE_ID, MAX(ID) AS latest_id
                FROM CAPS_ADD_ASSESSOR_POOL_CASES
                GROUP BY CASE_ID
            ) latest ON ap.ID = latest.latest_id
        `;
        
        // Build the count query
        let countQueryText = `
            SELECT COUNT(*) AS total
            FROM CAPS_ADD_ASSESSOR_POOL_CASES ap
            INNER JOIN (
                SELECT CASE_ID, MAX(ID) AS latest_id
                FROM CAPS_ADD_ASSESSOR_POOL_CASES
                GROUP BY CASE_ID
            ) latest ON ap.ID = latest.latest_id
        `;
        
        // Add WHERE clause if we have conditions
        if (whereConditions.length > 0) {
            queryText += ` WHERE ${whereConditions.join(' AND ')}`;
            countQueryText += ` WHERE ${whereConditions.join(' AND ')}`;
        }
        
        // Add ORDER BY and LIMIT/OFFSET for data query
        queryText += ` ORDER BY ap.CREATED_AT DESC LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);
        
        // Execute the count query
        console.log(`dataAccess>>CapsAssessmentPoolDOA>>getAssessorPoolCases>>Count Query:`, countQueryText);
        console.log(`dataAccess>>CapsAssessmentPoolDOA>>getAssessorPoolCases>>Count Query Params:`, queryParams.slice(0, -1));
        const [countRows] = await db.query(countQueryText, queryParams.slice(0, -2)); // Remove limit and offset for count query
        const totalCount = countRows[0][Object.keys(countRows[0])[0]];
        console.log(`dataAccess>>CapsAssessmentPoolDOA>>getAssessorPoolCases>>Total Count:`, totalCount);

        // Execute the data query
        const [rows] = await db.query(queryText, queryParams);
        
        // Transform data to match frontend expectations
        const transformedData = rows.map(caseItem => ({
            id: caseItem.ID,
            case_id: caseItem.CASE_ID,
            application_number: caseItem.APPLICATION_NO || null,
            application_no: caseItem.APPLICATION_NO || null,
            policy_number: caseItem.POLICY_NO || null,
            policy_no: caseItem.POLICY_NO || null,
            krn: caseItem.KSN || null,
            ksn: caseItem.KSN || null,
            source: caseItem.SOURCE || null,
            referral_date: caseItem.REFERRAL_DATE ? new Date(caseItem.REFERRAL_DATE).toISOString().split('T')[0] : null,
            trigger_date: caseItem.TRIGGER_DATE ? new Date(caseItem.TRIGGER_DATE).toISOString().split('T')[0] : null,
            case_status: caseItem.CASE_STATUS || 'Assessor Action Pending',
            exclusion_type: caseItem.EXCLUSION_TYPE || null,
            is_excluded: caseItem.IS_EXCLUDED || 'N',
            iris_status: caseItem.IRSS_STATUS || null,
            irss_status: caseItem.IRSS_STATUS || null,
            scn_aging: caseItem.SCH_AGING || null,
            sch_aging: caseItem.SCH_AGING || null,
            product_code: caseItem.PRODUCT_CODE || null,
            policy_status: caseItem.POLICY_STATUS || null,
            base_sum_assured: caseItem.BASE_SA || null,
            base_sa: caseItem.BASE_SA || null,
            city: caseItem.CITY || null,
            state: caseItem.STATE || null,
            pincode: caseItem.PINCODE || null,
            status: caseItem.STATUS || 'Non-Exclusion'
        }));
        
        console.log(`dataAccess>>CapsAssessmentPoolDOA>>getAssessorPoolCases>>Found ${transformedData.length} cases, Total: ${totalCount}`);
        return { data: transformedData, totalCount };
        
    } catch (error) {
        console.error(`dataAccess>>CapsAssessmentPoolDOA>>getAssessorPoolCases>>error:`, error);
        throw error;
    }
};

/**
 * Fetch detailed information for a single case
 * @param {number} caseId - The unique case ID
 * @returns {Promise<Object>}
 */
const getCaseDetailsById = async (caseId) => {
    console.log(`dataAccess>>CapsAssessmentPoolDOA>>getCaseDetailsById>>CaseID: ${caseId}`);
    try {
        const queryText = `
            SELECT 
                d.CASE_ID, d.POLICY_NUMBER, d.KRN, d.SOURCE, d.REFERRAL_DATE, d.INITIATION_DATE, d.CASE_STATUS, d.EXCLUSION_TYPE_RULE, d.IRIS_STATUS, d.CREATED_BY, d.ASSIGNED_TO,
                cd.APP_NO, cd.PRODUCT_NAME, cd.PRODUCT_CODE, cd.POLICY_DURATION, cd.RCD, cd.PAD, cd.FID, cd.ADBR_SA, cd.CI_SA, cd.PREMIUM_FREQUENCY, cd.PREMIUM_AMOUNT, cd.PREMIUMS_PAID, cd.ANNUAL_PREMIUM, cd.AGENT_CATEGORY, cd.AGENT_FSC_CODE, cd.AGENT_FSC_NAME, cd.UM_SM_CODE, cd.UM_SM_NAME, cd.AGENT_ACTIVE_NOT_ACTIVE, cd.UW_DECISION, cd.POLICY_STATUS, cd.AGENT_STAT_CODE, cd.BASE_SA,
                la.NAME, la.CLIENT_ID, la.DOB, la.AGE, la.GENDER, la.RES_STATUS, la.INCOME, la.OCCUPATION, la.EDUCATION, la.CITY, la.STATE, la.PAN_NO, la.MOBILE_NO, la.PINCODE, la.FLAT, la.ROAD, la.AREA, la.OCCUPATION_DESC,
                deci.RULE, deci.FINAL_DECISION, deci.SCN_AGING, deci.ADD_CASE_REMARKS
            FROM CAPS_ADD_DETAILS d
            LEFT JOIN CAPS_ADD_CONTRACT_DETAILS cd ON d.CASE_ID = cd.CASE_ID
            LEFT JOIN CAPS_ADD_LIFE_ASSURED_DETAILS la ON d.CASE_ID = la.CASE_ID
            LEFT JOIN CAPS_ADD_DECISION deci ON d.CASE_ID = deci.CASE_ID
            WHERE d.CASE_ID = ?
        `;

        const [rows] = await db.query(queryText, [caseId]);
        
        if (!rows || rows.length === 0) {
            return null;
        }

        const data = rows[0];

        const [decisionRow, findingsRows] = await Promise.all([
            CapsAddDecision.findOne({ where: { case_id: caseId }, raw: true }),
            CapsAddFindings.findAll({ where: { case_id: caseId }, raw: true, order: [['seq_no', 'ASC']] }),
        ]);

        const findings = (findingsRows || []).map((f) => ({
            caseId: f.case_id,
            findings: f.findings,
            remarks: f.remarks,
            rule: f.rule,
            decision: f.decision,
            severity: f.severity,
            ailmentName: f.ailment_name,
            ailmentType: f.ailment_type,
            evidenceType: f.type_of_evidence,
        }));

        const decision = decisionRow
            ? {
                case_id: decisionRow.case_id,
                policy_number: decisionRow.policy_number,
                rule: decisionRow.rule,
                final_decision: decisionRow.final_decision,
                scn_sent: decisionRow.scn_sent,
                add_case_remarks: decisionRow.add_case_remarks,
                scn_date: decisionRow.scn_date,
                scn_aging: decisionRow.scn_aging,
                scn_received: decisionRow.scn_received,
                scn_decision: decisionRow.scn_decision,
                sddr_date: decisionRow.sddr_date,
                sddr_received: decisionRow.sddr_received,
                sddr_decision: decisionRow.sddr_decision,
            }
            : null;
        
        // Structure the response for the frontend
        return {
            caseInfo: {
                caseId: data.CASE_ID,
                krn: data.KRN,
                triggeredDate: data.INITIATION_DATE,
                referralDate: data.REFERRAL_DATE,
                activityStatus: data.CASE_STATUS,
                policyNo: data.POLICY_NUMBER,
                exclusionType: data.EXCLUSION_TYPE_RULE,
                userId: data.CREATED_BY,
                assignedTo: data.ASSIGNED_TO,
                initialCaseRemark: data.ADD_CASE_REMARKS || decisionRow?.add_case_remarks,
                irisStatus: data.IRIS_STATUS,
            },
            decision,
            findings,
            lifeAssured: {
                name: data.NAME,
                clientID: data.CLIENT_ID,
                dob: data.DOB,
                age: data.AGE,
                gender: data.GENDER,
                residentStatus: data.RES_STATUS,
                income: data.INCOME,
                occupation: data.OCCUPATION,
                education: data.EDUCATION,
                flat: data.FLAT,
                area: data.AREA,
                road: data.ROAD,
                city: data.CITY,
                state: data.STATE,
                pinCode: data.PINCODE,
                mobileNo: data.MOBILE_NO
            },
            contract: {
                applicationNo: data.APP_NO,
                policyNo: data.POLICY_NUMBER,
                productName: formatProductName(data.PRODUCT_NAME),
                productCode: data.PRODUCT_CODE,
                policyStatus: data.POLICY_STATUS,
                policyDuration: data.POLICY_DURATION,
                rcd: data.RCD,
                pad: data.PAD,
                fid: data.FID,
                baseSA: data.BASE_SA,
                premiumFrequency: data.PREMIUM_FREQUENCY,
                premiumAmount: data.PREMIUM_AMOUNT,
                premiumsPaid: data.PREMIUMS_PAID,
                annualPremium: data.ANNUAL_PREMIUM,
                agentFscCode: data.AGENT_FSC_CODE,
                agentFscName: data.AGENT_FSC_NAME,
                agentStatus: data.AGENT_STAT_CODE,
                agentCategory: data.AGENT_CATEGORY,
                umSmCode: data.UM_SM_CODE,
                umSmName: data.UM_SM_NAME,
                uwDecision: data.UW_DECISION
            }
        };
    } catch (error) {
        console.error(`dataAccess>>CapsAssessmentPoolDOA>>getCaseDetailsById>>error:`, error);
        throw error;
    }
};

module.exports = {
    getAssessmentData, 
    getAssessmentPoolDataRaw,
    getAssessorPoolCases,
    getCaseDetailsById
}