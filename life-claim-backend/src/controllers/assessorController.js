const Claim = require("../models/Claim");
const appConfig = require('../config/configService');
const { getTransactionApiBase } = require("../services/transactionApiClient");

const IntimationDetail = require("../models/IntimationDetail");
const CauseEvent = require("../models/CauseEvent");
const PayeeDetail = require("../models/PayeeDetail");
const ClaimantDetail = require("../models/ClaimantDetail");
const LifeAssuredDetail = require("../models/LifeAssuredDetail");
const ContactDetail = require("../models/ContactDetail");
const EagleScreen = require("../models/EagleScreen");
const TrapScore = require("../models/TrapScore");
const AgentRepudiationHistory = require("../models/AgentRepudiationHistory");
const DoctorDetails = require("../models/DoctorDetails");
const HospitalDetails = require("../models/HospitalDetails");
const ProofDetails = require("../models/ProofDetails");
const InsuranceProofDetails = require("../models/InsuranceProofDetails");
const WitnessDetails = require("../models/WitnessDetails");
const IncomeDetails = require("../models/IncomeDetails");
const EstablishedCause= require("../models/EstablishedCause");

const Requirement = require("../models/Requirement");
const RequirementTable = require("../models/RequirementTable");
const ReqCommonDetails = require("../models/ReqCommonDetails");
const ReqRiderDetails = require("../models/ReqRiderDetails");
const ReqEmail = require("../models/ReqEmail");
const ReqLetter = require("../models/ReqLetter");
const SmsScript = require("../models/SmsScript");

const ClaimQuestions = require("../models/ClaimsQuestions");
const SystemAssessorReamrks = require("../models/SystemAssessorRemark");
const TelecallingTable = require("../models/Telecalling");
const CaseTriggerTable = require("../models/CaseTrigger");
const SystemRemarksTable = require("../models/SystemRemark");
// const FraudFlagsTable=require("../models/FraudFlag")
const PriorityFlagTable = require("../models/PriorityFlag");
const IibEnquiry=require("../models/IibEnquiry")

const DecisionAccessor = require("../models/DecisionAccessor");
const DecisionSystem = require("../models/DecisionSystem");
const DecisionVerificationAndSummary = require("../models/DecisionVerificationAndSummary");

const { camelToSnakeCase, snakeToCamelCase } = require("../util/convertCase");
const RiderDetailsTable = require("../models/RiderDetailsTable");
const { ensureDecisionDetailsForClaim } = require("../dataAccess/decisionDetailsDao");

// this is the page for assesor stage where all data is fetched from backend
// used in claim search and work on it

const getDemogs = async (req, res) => {
  try {
    const { claimNo } = req.params;
    
    // Ensure req.user exists before destructuring, providing fallbacks for Keycloak tokens
    const user = req.user || {};
    const username = user.username || (req.kauth && req.kauth.grant && req.kauth.grant.access_token.content.preferred_username) || '';
    const roles = user.roles || (req.kauth && req.kauth.grant && req.kauth.grant.access_token.content.realm_access.roles) || [];

    const claim = await Claim.findOne({
      where: { CLAIM_NUMBER: claimNo },
    });

    // 1. Check if the claim exists
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // 2. Security: Forceful Browsing / IDOR Protection
    // For the current testing phase, allow any authenticated Assessor/Verifier/admin
    // to view demographics for any claim. Write actions remain protected elsewhere.

    const intimation = await IntimationDetail.findOne({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const trapScore = await TrapScore.findOne({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const cause = await CauseEvent.findOne({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const payee = await PayeeDetail.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const claimant = await ClaimantDetail.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const lifeAssured = await LifeAssuredDetail.findOne({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const contact = await ContactDetail.findOne({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const eagle = await EagleScreen.findOne({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const agentHistory = await AgentRepudiationHistory.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const hospitalDetails = await HospitalDetails.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const doctorDetails = await DoctorDetails.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const proofDetails = await ProofDetails.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const insuranceProofDetails = await InsuranceProofDetails.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const witnessDetails = await WitnessDetails.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const incomeDetails = await IncomeDetails.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const riderDetails = await RiderDetailsTable.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const establishedCause = await EstablishedCause.findOne({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const responseData = {
      claim: snakeToCamelCase(claim?.dataValues),
      intimation: snakeToCamelCase(intimation?.dataValues),
      trap: snakeToCamelCase(trapScore?.dataValues),
      cause: snakeToCamelCase(cause?.dataValues),
      payee: payee.map((record) => snakeToCamelCase(record.dataValues)),
      claimant: claimant.map((record) => snakeToCamelCase(record.dataValues)),
      lifeAssured: snakeToCamelCase(lifeAssured?.dataValues),
      contact: snakeToCamelCase(contact?.dataValues),
      eagle: snakeToCamelCase(eagle?.dataValues),
      establishedCause: snakeToCamelCase(establishedCause?.dataValues),
      agentHistoryTable: agentHistory.map((record) =>
        snakeToCamelCase(record.dataValues)
      ),
      hospitalDetailsTable: hospitalDetails.map((record) =>
        snakeToCamelCase(record.dataValues)
      ),
      doctorDetailsTable: doctorDetails.map((record) =>
        snakeToCamelCase(record.dataValues)
      ),
      proofDetailsTable: proofDetails.map((record) =>
        snakeToCamelCase(record.dataValues)
      ),
      insuranceProofDetailsTable: insuranceProofDetails.map((record) =>
        snakeToCamelCase(record.dataValues)
      ),
      witnessDetailsTable: witnessDetails.map((record) =>
        snakeToCamelCase(record.dataValues)
      ),
      incomeDetailsTable: incomeDetails.map((record) =>
        snakeToCamelCase(record.dataValues)
      ),
      riderDetailsTable: riderDetails.map((record) =>
        snakeToCamelCase(record.dataValues)
      ),
    };
    return res.status(200).json({
      message: "Data fetching done",
      data: responseData,
    });
  } catch (error) {
    console.log(error);
  }
};

// getRequirement function
const getRequirement = async (req, res) => {
  try {
    const { claimNo } = req.params;
    
    // Ensure req.user exists before destructuring, providing fallbacks for Keycloak tokens
    const user = req.user || {};
    const username = user.username || (req.kauth && req.kauth.grant && req.kauth.grant.access_token.content.preferred_username) || '';
    const roles = user.roles || (req.kauth && req.kauth.grant && req.kauth.grant.access_token.content.realm_access.roles) || [];

    const claim = await Claim.findOne({
      where: { CLAIM_NUMBER: claimNo },
    });

    if (!claim) {
      return res.status(404).json({
        message: "Claim not found",
      });
    }

    // Security: IDOR Protection
    // Relaxed for testing: allow any authenticated Assessor/Verifier/admin to view requirements.

    const requirement = await Requirement.findOne({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    // Registration saves one row per document on `requirements` (Requirement model).
    let requirementTable = await Requirement.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    // Legacy fallback if nothing on requirements table
    if (!requirementTable.length) {
      requirementTable = await RequirementTable.findAll({
        where: { CLAIM_ID: claim.CLAIM_ID },
      });
    }

    const reqCommonDetails = await ReqCommonDetails.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const reqRiderDetails = await ReqRiderDetails.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const reqEmailDetails = await ReqEmail.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const reqLetterDetails = await ReqLetter.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const smsScriptDetails = await SmsScript.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const responseData = {
      claim: snakeToCamelCase(claim?.dataValues),
      requirement: snakeToCamelCase(requirement?.dataValues),
      requirementTable: requirementTable.map((req) =>
        snakeToCamelCase(req?.dataValues)
      ),
      reqCommonDetailsTable: reqCommonDetails.map((req) =>
        snakeToCamelCase(req?.dataValues)
      ),
      reqRiderDetailsTable: reqRiderDetails.map((req) =>
        snakeToCamelCase(req?.dataValues)
      ),
      reqEmailDetailsTable: reqEmailDetails.map((req) =>
        snakeToCamelCase(req?.dataValues)
      ),
      reqLetterDetailsTable: reqLetterDetails.map((req) =>
        snakeToCamelCase(req?.dataValues)
      ),
      smsScriptTable: smsScriptDetails.map((req) =>
        snakeToCamelCase(req?.dataValues)
      ),
    };
    return res.status(200).json({
      message: "Requirement Data fetching done",
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// getDecision function
const getDecision = async (req, res) => {
  try {
    const { claimNo } = req.params;
    
    // Ensure req.user exists before destructuring, providing fallbacks for Keycloak tokens
    const user = req.user || {};
    const username = user.username || (req.kauth && req.kauth.grant && req.kauth.grant.access_token.content.preferred_username) || '';
    const roles = user.roles || (req.kauth && req.kauth.grant && req.kauth.grant.access_token.content.realm_access.roles) || [];

    const claim = await Claim.findOne({
      where: { CLAIM_NUMBER: claimNo },
    });

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Security: IDOR Protection
    // Relaxed for testing: allow any authenticated Assessor/Verifier/admin to view decision data.

    const decisionAccessor = await DecisionAccessor.findOne({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const decisionSystem = await DecisionSystem.findOne({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const decisionVerificationAndSummary =
      await DecisionVerificationAndSummary.findOne({
        where: { CLAIM_ID: claim.CLAIM_ID },
      });

      const riderDetails = await RiderDetailsTable.findAll({
        where: { CLAIM_ID: claim.CLAIM_ID },
      });

    const responseData = {
      claim: snakeToCamelCase(claim?.dataValues),
      decisionAccessor: snakeToCamelCase(decisionAccessor?.dataValues),
      decisionSystem: snakeToCamelCase(decisionSystem?.dataValues),
      decisionVerificationAndSummary: snakeToCamelCase(
        decisionVerificationAndSummary?.dataValues
        
      ),
      riderDetailsTable: riderDetails.map((record) =>
        snakeToCamelCase(record.dataValues)
      ),
    };
    return res.status(200).json({
      message: "Decision data fetching done",
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching decision data:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// getAssessment function
const getAssessment = async (req, res) => {
  try {
    const { claimNo } = req.params;
    
    // Ensure req.user exists before destructuring, providing fallbacks for Keycloak tokens
    const user = req.user || {};
    const username = user.username || (req.kauth && req.kauth.grant && req.kauth.grant.access_token.content.preferred_username) || '';
    const roles = user.roles || (req.kauth && req.kauth.grant && req.kauth.grant.access_token.content.realm_access.roles) || [];

    const claim = await Claim.findOne({
      where: { CLAIM_NUMBER: claimNo },
    });

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Security: IDOR Protection
    // Relaxed for testing: allow any authenticated Assessor/Verifier/admin to view assessment data.

    // Fetch assessment-related data
    const assessment = await ClaimQuestions.findOne({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });
    
    const iibEnquiry = await IibEnquiry.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const remarks = await SystemAssessorReamrks.findOne({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const telecalling = await TelecallingTable.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const caseTrigger = await CaseTriggerTable.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const systemRemarks = await SystemRemarksTable.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const trapScores = await TrapScore.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    // const fraudFlags = await FraudFlagsTable.findAll({
    //   where: { CLAIM_ID: claim.CLAIM_ID },
    // });

    const priorityFlags = await PriorityFlagTable.findAll({
      where: { CLAIM_ID: claim.CLAIM_ID },
    });

    const responseData = {
      claim: snakeToCamelCase(claim?.dataValues),
      iibEnquiryTable: iibEnquiry.map((record) => {
        // snakeToCamelCase can't tell IIB_TOTAL_SA apart from an "Sa" word — it
        // comes back as iibTotalSa, so restore the casing the frontend expects.
        const row = snakeToCamelCase(record?.dataValues);
        if ("iibTotalSa" in row) {
          row.iibTotalSA = row.iibTotalSa;
          delete row.iibTotalSa;
        }
        return row;
      }),
      assessment: snakeToCamelCase(assessment?.dataValues),
      remarks: snakeToCamelCase(remarks?.dataValues),
      telecallingTable: telecalling.map((record) =>
        snakeToCamelCase(record?.dataValues)
      ),
      caseTriggerTable: caseTrigger.map((record) =>
        snakeToCamelCase(record?.dataValues)
      ),
      systemRemarksTable: systemRemarks.map((record) =>
        snakeToCamelCase(record?.dataValues)
      ),
      trapScoreTable: trapScores.map((record) =>
        snakeToCamelCase(record?.dataValues)
      ),
      // fraudFlags: fraudFlags.map((record) => snakeToCamelCase(record?.dataValues)),
      priorityFlagTable: priorityFlags.map((record) =>
        snakeToCamelCase(record?.dataValues)
      ),
    
    };
    return res.status(200).json({
      message: "Assessment data fetching done",
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching assessment data:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// to fetch la data in assessor tab
const getCalculateAmount = async (req, res) => {
  try {
    const { claimNo } = req.params;
    
    // Ensure req.user exists before destructuring, providing fallbacks for Keycloak tokens
    const user = req.user || {};
    const username = user.username || (req.kauth && req.kauth.grant && req.kauth.grant.access_token.content.preferred_username) || '';
    const roles = user.roles || (req.kauth && req.kauth.grant && req.kauth.grant.access_token.content.realm_access.roles) || [];

    const claim = await Claim.findOne({
      where: { CLAIM_NUMBER: claimNo },
    });

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    const url = `${getTransactionApiBase()}/api/decisionDetails/${claimNo}`;
    let laRes = await fetch(url);
    let data = await laRes.json().catch(() => null);

    // New claims may lack a decision_details row (registration used to skip it).
    // Insert once from decision_system BASE, then re-read. Existing rows are never overwritten.
    const missing =
      !laRes.ok ||
      !data ||
      data.message === "Record not found" ||
      (data.BASE_SEC == null && data.baseSec == null);
    if (missing) {
      try {
        const decisionSystem = await DecisionSystem.findOne({
          where: { CLAIM_ID: claim.CLAIM_ID },
        });
        const payableBase =
          decisionSystem?.BASE ??
          decisionSystem?.TOTAL_AMT_PAYABLE ??
          0;
        await ensureDecisionDetailsForClaim(
          claimNo,
          payableBase,
          username || "AutoEnsure"
        );
        laRes = await fetch(url);
        data = await laRes.json().catch(() => data);
      } catch (ensureErr) {
        console.error(
          "assessorController.js >> getCalculateAmount >> decision_details ensure failed :>",
          ensureErr.message || ensureErr
        );
      }
    }

    const camelCasedData = snakeToCamelCase(data);

    return res.status(200).json({
      message: "Calculate Amount data fetching done",
      data: camelCasedData,
    });
  } catch (error) {
    console.error('assessorController.js >> getCalculateAmount >> error :>', error);
    res.status(503).json({
      message: 'Service unavailable',
      ...(appConfig.get('EXPOSE_ERROR_DETAIL') === 'true'
        ? {
            detail: error.message || 'Failed to connect to transaction service',
            code: error.code || undefined,
          }
        : {}),
    });
  }
};
module.exports = {
  getDemogs,
  getRequirement,
  getDecision,
  getAssessment,
  getCalculateAmount,
};
