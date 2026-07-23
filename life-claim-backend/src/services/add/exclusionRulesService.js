const CapsAddExclusionMaster = require('../../models/add/CapsAddExclusionMaster');
const CapsAddDetails = require('../../models/add/CapsAddDetails');
const CapsAddContractDetails = require('../../models/add/CapsAddContractDetails');
const db = require('../../config/dbConfig');
const { evaluateAddExclusion, isRulesEngineEnabled } = require('../rulesEngineClient');

const MASTER_TYPES = [
    'Claim received',
    'In-active policy status',
    'Top advisor',
    'Partner Exclusion',
    'Product Norms',
    'ULIP Policy',
];

const inListIgnoreCase = (value, list) => {
    if (!value || !Array.isArray(list) || list.length === 0) return false;
    const normalized = String(value).trim().toLowerCase();
    return list.some((item) => item && String(item).trim().toLowerCase() === normalized);
};

const loadExclusionMasterLists = async () => {
    const lists = {};
    for (const exclusionType of MASTER_TYPES) {
        const rows = await CapsAddExclusionMaster.findAll({
            where: { exclusion_type: exclusionType },
            attributes: ['exclusion_value'],
        });
        lists[exclusionType] = rows.map((row) => row.exclusion_value).filter(Boolean);
    }
    return lists;
};

const applyExclusionRulesJs = (facts) => {
    let exclusionApplied = false;
    let exclusionType = null;

    if (inListIgnoreCase(facts.claimType, facts.claimReceivedValues)) {
        return { exclusionApplied: true, exclusionType: 'Claim Received' };
    }

    if (inListIgnoreCase(facts.policyStatus, facts.inactivePolicyStatusValues)) {
        return { exclusionApplied: true, exclusionType: 'In-active policy status' };
    }

    if (facts.contractPresent && facts.rcdYears >= 3) {
        return { exclusionApplied: true, exclusionType: 'RCD more than 3 years' };
    }

    const prdCode = facts.productCode || '';
    const prdUpper = prdCode.toUpperCase();
    if (
        facts.contractPresent &&
        facts.premiumAmount &&
        facts.premiumFrequency &&
        prdCode &&
        (prdUpper.startsWith('E') || prdUpper.startsWith('U')) &&
        facts.annualPremium >= 500000
    ) {
        return { exclusionApplied: true, exclusionType: 'Annual Premium > 5 lakh saving cases' };
    }

    if (facts.lifeAssuredPresent && String(facts.residentialStatus || '').toUpperCase() === 'N') {
        return { exclusionApplied: true, exclusionType: 'NRI customer' };
    }

    if (inListIgnoreCase(facts.advisorCode, facts.topAdvisorValues)) {
        return { exclusionApplied: true, exclusionType: 'Top advisor' };
    }

    if (inListIgnoreCase(facts.partnerName, facts.partnerExclusionValues)) {
        return { exclusionApplied: true, exclusionType: 'Partner Exclusion' };
    }

    if (
        facts.contractPresent &&
        prdCode &&
        (inListIgnoreCase(prdCode, facts.productNormsValues) ||
            prdUpper.startsWith('G') ||
            prdUpper.startsWith('I'))
    ) {
        return { exclusionApplied: true, exclusionType: 'Product Norms' };
    }

    if (facts.lifeAssuredPresent && facts.ageInYears > 0 && facts.ageInYears <= 18) {
        return { exclusionApplied: true, exclusionType: 'Minor Life Assured' };
    }

    if (facts.contractPresent && prdCode && inListIgnoreCase(prdCode, facts.ulipPolicyValues)) {
        return { exclusionApplied: true, exclusionType: 'ULIP Policy' };
    }

    return { exclusionApplied, exclusionType };
};

/**
 * Applies exclusion rules to a case via Drools (life-claim-rules), with JS fallback.
 * @param {number} caseId - The case ID to check
 * @returns {Promise<{exclusionApplied: boolean, exclusionType: string|null}>}
 */
const checkForExclusionRule = async (caseId) => {
    try {
        const queryText = `
            SELECT 
                d.case_id,
                cd.policy_status,
                cd.rcd,
                cd.annual_premium,
                cd.product_code,
                cd.premium_amount,
                cd.premium_frequency,
                cd.agent_stat_code,
                cd.agent_fsc_name,
                la.res_status,
                la.dob,
                la.age
            FROM caps_add_details d 
            LEFT JOIN caps_add_life_assured_details la ON d.case_id = la.case_id 
            LEFT JOIN caps_add_contract_details cd ON d.case_id = cd.case_id 
            WHERE d.case_id = ?
        `;

        const [rows] = await db.query(queryText, [caseId]);

        if (!rows || rows.length === 0) {
            console.log(`Case ID ${caseId} not found`);
            return { exclusionApplied: false, exclusionType: null };
        }

        const caseData = rows[0];
        const hasContractDetails = caseData.policy_status !== null;
        const hasLifeAssuredDetails = caseData.dob !== null;

        const claimType = caseData.policy_status || '';
        const policyStatus = caseData.policy_status || '';
        const residentialStatus = caseData.res_status || '';
        const advisor = caseData.agent_stat_code || '';
        const partner = caseData.agent_fsc_name || '';
        const premiumAmt = parseFloat(caseData.premium_amount) || 0;
        const premiumFreq = parseFloat(caseData.premium_frequency) || 0;
        const prdCode = caseData.product_code || '';
        const riskCommencementDate = caseData.rcd ? new Date(caseData.rcd) : null;
        const laDob = caseData.dob ? new Date(caseData.dob) : null;

        let annualPremium = 0;
        if (hasContractDetails && premiumAmt && premiumFreq) {
            annualPremium = premiumAmt * premiumFreq;
            if (annualPremium > 0) {
                await CapsAddContractDetails.update(
                    { annual_premium: annualPremium.toString() },
                    { where: { case_id: caseId } }
                );
            }
        }

        let differenceInYears = 0;
        if (hasContractDetails && riskCommencementDate) {
            const currentDate = new Date();
            const differenceInMillisec = currentDate.getTime() - riskCommencementDate.getTime();
            differenceInYears = Math.floor(differenceInMillisec / (1000 * 60 * 60 * 24 * 365));
        }

        let ageInYears = 0;
        if (hasLifeAssuredDetails && laDob) {
            const currDate = new Date();
            const ageInMillis = currDate.getTime() - laDob.getTime();
            ageInYears = Math.floor(ageInMillis / (1000 * 60 * 60 * 24 * 365));
        }

        const masterLists = await loadExclusionMasterLists();
        const facts = {
            caseId,
            contractPresent: hasContractDetails,
            lifeAssuredPresent: hasLifeAssuredDetails,
            claimType,
            policyStatus,
            rcdYears: differenceInYears,
            annualPremium,
            premiumAmount: premiumAmt,
            premiumFrequency: premiumFreq,
            productCode: prdCode,
            residentialStatus,
            advisorCode: advisor,
            partnerName: partner,
            ageInYears,
            claimReceivedValues: masterLists['Claim received'],
            inactivePolicyStatusValues: masterLists['In-active policy status'],
            topAdvisorValues: masterLists['Top advisor'],
            partnerExclusionValues: masterLists['Partner Exclusion'],
            productNormsValues: masterLists['Product Norms'],
            ulipPolicyValues: masterLists['ULIP Policy'],
        };

        let exclusionApplied = false;
        let exclusionType = null;

        if (isRulesEngineEnabled()) {
            try {
                const droolsResult = await evaluateAddExclusion(facts);
                if (droolsResult?.excluded) {
                    exclusionApplied = true;
                    exclusionType = droolsResult.exclusionType || null;
                }
            } catch (rulesErr) {
                console.warn(
                    'exclusionRulesService >> Drools failed, using JS fallback:',
                    rulesErr.message
                );
                const jsResult = applyExclusionRulesJs(facts);
                exclusionApplied = jsResult.exclusionApplied;
                exclusionType = jsResult.exclusionType;
            }
        } else {
            const jsResult = applyExclusionRulesJs(facts);
            exclusionApplied = jsResult.exclusionApplied;
            exclusionType = jsResult.exclusionType;
        }

        if (exclusionType) {
            await CapsAddDetails.update(
                { exclusion_type_rule: exclusionType },
                { where: { case_id: caseId } }
            );
        }

        return { exclusionApplied, exclusionType };
    } catch (error) {
        console.error('Error in checkForExclusionRule:', error);
        throw error;
    }
};

module.exports = { checkForExclusionRule, applyExclusionRulesJs, loadExclusionMasterLists };
