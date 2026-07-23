const CapsAddRawData = require('../../models/add/CapsAddRawData');
const CapsAddDetails = require('../../models/add/CapsAddDetails');
const CapsAddContractDetails = require('../../models/add/CapsAddContractDetails');
const CapsAddLifeAssuredDetails = require('../../models/add/CapsAddLifeAssuredDetails');
const { checkForExclusionRule } = require('./exclusionRulesService');
const { upsertAssessorPoolCase } = require('../../dataAccess/add/capsAssessorPoolCasesDao');
const {
  fetchPolicySearch,
  assertPolicySearchHasData,
} = require('../transactionApiClient');
const { notifyClaimRegistered } = require('../claimRegistrationNotifyService');
const { formatProductName } = require('../../util/formatProductName');

const DETAILS_REMARKS_MAX = 500;

function trimInitiationRemarks(value) {
    if (value == null || value === '') return null;
    return String(value).trim().slice(0, DETAILS_REMARKS_MAX) || null;
}

/**
 * Shared logic to fetch data from Life Asia and update/create records
 */
const enrichCaseData = async (caseId, policyNo, username = 'System') => {
    const { data: apiResponse, formattedPolicyNo } = await fetchPolicySearch(policyNo);

    console.log(`EnrichmentService >> Enriching Case: ${caseId}, Policy: ${formattedPolicyNo}`);

    const finalElement = assertPolicySearchHasData(apiResponse, formattedPolicyNo);

    const hasContract =
      finalElement.ContractDetails && finalElement.ContractDetails.length > 0;
    const hasLifeAssured =
      finalElement.LifeAssured?.ClientDetails &&
      finalElement.LifeAssured.ClientDetails.length > 0;
    const client = hasLifeAssured ? finalElement.LifeAssured.ClientDetails[0] : {};
    const contract = hasContract ? finalElement.ContractDetails[0] : {};

    // 2. Update/Create Life Assured Details
    const laData = {
        case_id: caseId,
        name: client.Name || 'N/A',
        client_id: client.ClientID || 'N/A',
        dob: client.DOB ? new Date(client.DOB) : new Date('1900-01-01'), 
        age: String(client.Age || '0'),
        gender: client.Gender === 'F' ? 'Female' : 'Male',
        res_status: client.ResStatus || 'I',
        income: String(client.Income || '0'),
        occupation: client.OccCode || 'N/A',
        education: client.Education || 'N/A',
        city: client.City || 'N/A',
        state: client.State || 'N/A',
        pan_no: client.PAN || 'N/A',
        mobile_no: String(client.MobileNo || '0000000000'),
        pincode: String(client.Pincode || '000000'),
        flat: client.Flat || 'N/A',
        road: client.Road || 'N/A',
        area: client.Area || 'N/A',
        occupation_desc: client.OccDesc || 'N/A',
        modified_by: username,
        modified_on: new Date()
    };

    const existingLA = await CapsAddLifeAssuredDetails.findOne({ where: { case_id: caseId } });
    if (existingLA) {
        await existingLA.update(laData);
    } else {
        laData.created_by = username;
        laData.created_on = new Date();
        await CapsAddLifeAssuredDetails.create(laData);
    }

    // 3. Update/Create Contract Details
    const cdData = {
        case_id: caseId,
        app_no: contract.ApplicationNo || 'N/A',
        policy_no: formattedPolicyNo,
        product_name: formatProductName(contract.ProductName) || 'N/A',
        product_code: contract.ProductCode || 'N/A',
        policy_duration: String(contract.Term || '0'),
        rcd: contract.RCD ? new Date(contract.RCD) : new Date('1900-01-01'),
        pad: contract.PropRECDDate ? new Date(contract.PropRECDDate).toISOString().split('T')[0] : '1900-01-01',
        fid: contract.FID || 'N/A',
        adbr_sa: String(contract.SumAssured || '0'), 
        ci_sa: '0',
        premium_frequency: String(contract.PremFreq || '0'),
        premium_amount: String(contract.TotalPremPaid || '0'),
        premiums_paid: String(contract.TotalPremPaid || '0'),
        annual_premium: String(contract.TotalPremPaid || '0'),
        channel_9: 'N/A',
        channel_4: 'N/A',
        agent_category: 'N/A',
        agent_fsc_code: contract.AdvisorCode || 'N/A',
        agent_fsc_name: contract.AdvisorName || 'N/A',
        um_sm_code: 'N/A',
        um_sm_name: 'N/A',
        agent_active_not_active: contract.CurrentStatus || 'Active',
        uw_decision: contract.UWDecision || 'Standard',
        biu_output: 'N/A',
        nb_risk_done: 'N/A',
        medicals_done: 'N/A',
        pvv_done: 'N/A',
        experian_credit_score: '0',
        policy_status: contract.PolicyStatus || 'N/A',
        agent_stat_code: 'N/A',
        base_sa: parseInt(contract.SumAssured || 0)
    };

    const existingCD = await CapsAddContractDetails.findOne({ where: { case_id: caseId } });
    if (existingCD) {
        await existingCD.update(cdData);
    } else {
        await CapsAddContractDetails.create(cdData);
    }

    // 4. Update Main Details (Iris status etc)
    await CapsAddDetails.update({
        krn: client.ClientID || null,
        iris_status: client.LifeFlag || 'N/A',
        modified_by: username,
        modified_on: new Date()
    }, { where: { case_id: caseId } });

    // 5. Re-apply Exclusion Rules
    const exclusionResult = await checkForExclusionRule(caseId);

    // 6. Refresh Assessor Pool Case
    await upsertAssessorPoolCase(caseId, exclusionResult);

    return {
      formattedPolicyNo,
      customerName: laData.name,
      mobileNo: laData.mobile_no,
      email: client.Email || client.EmailId || client.EMAIL || null,
    };
};

/**
 * Service to enrich raw excel data with Life Asia API information
 */
const processRawDataBatch = async () => {
    console.log('EnrichmentService >> Starting background processing...');
    try {
        const pendingRecords = await CapsAddRawData.findAll({ where: { processed_flag: 0 } });
        if (pendingRecords.length === 0) return;
        console.log(`EnrichmentService >> Found ${pendingRecords.length} records to process.`);
        for (const record of pendingRecords) {
            await processSingleRecord(record);
        }
    } catch (error) {
        console.error('EnrichmentService >> Batch processing error:', error);
    }
};

const processSingleRecord = async (record) => {
    let policyNo = String(record.policy_number);
    if (policyNo.length < 8) policyNo = policyNo.padStart(8, '0');

    try {
        // Create the case in caps_add_details first
        const createdCase = await CapsAddDetails.create({
            policy_number: policyNo,
            source: record.source || 'Excel',
            referral_date: record.referral_date,
            initiation_date: new Date(),
            case_status: 'Assessor Action Pending',
            created_by: record.created_by || 'System',
            created_on: new Date(),
            initiation_remarks: trimInitiationRemarks(record.initiation_remarks)
        });

        // Use the shared enrichment logic
        const enrichResult = await enrichCaseData(
          createdCase.case_id,
          policyNo,
          record.created_by
        );

        if (enrichResult?.mobileNo && enrichResult.mobileNo !== '0000000000') {
          notifyClaimRegistered({
            mobileNo: enrichResult.mobileNo,
            name: enrichResult.customerName,
            claimNo: `CAPS-${createdCase.case_id}`,
            email: enrichResult.email,
          }).catch((err) => {
            console.error('EnrichmentService >> CAPS notify error:', err.message || err);
          });
        }

        // Mark raw record as successful
        await record.update({ processed_flag: 1, modified_on: new Date(), initiation_remarks: 'Successfully enriched' });
        console.log(`EnrichmentService >> Successfully processed Policy: ${policyNo}`);

    } catch (error) {
        console.error(`EnrichmentService >> Error processing Policy ${policyNo}:`, error.message);
        await record.update({ processed_flag: 2, initiation_remarks: error.message.substring(0, 499), modified_on: new Date() });
    }
};

/**
 * Manually refresh data for a single case
 */
const refreshSingleCase = async (caseId, username) => {
    const caseRecord = await CapsAddDetails.findByPk(caseId);
    if (!caseRecord) throw new Error(`Case ID ${caseId} not found`);

    return await enrichCaseData(caseId, caseRecord.policy_number, username);
};

module.exports = { processRawDataBatch, refreshSingleCase };
