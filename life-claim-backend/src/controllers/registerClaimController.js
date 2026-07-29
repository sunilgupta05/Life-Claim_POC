const IntimationDetail = require("../models/IntimationDetail");
const TrapScore = require("../models/TrapScore")
const CauseEvent = require("../models/CauseEvent");
const PayeeDetail = require("../models/PayeeDetail");
const ClaimantDetail = require("../models/ClaimantDetail");
const LifeAssuredDetail = require("../models/LifeAssuredDetail");
const ContactDetail = require("../models/ContactDetail");
const EagleScreen = require("../models/EagleScreen");
const Requirement = require("../models/Requirement");
const RequirementTable = require("../models/RequirementTable");
const DecisionAccessor = require("../models/DecisionAccessor");
const DecisionSystem = require("../models/DecisionSystem");
const DecisionVerificationAndSummary = require("../models/DecisionVerificationAndSummary");
const sequelize = require("../config/sequelize");
const ClaimSequence = require("../models/ClaimSequence");
const StatusHistory = require("../models/StatusHistory")
const RiderDetailsTable = require("../models/RiderDetailsTable")

const {
  camelToSnakeCase,
  snakeToCamelCase,
  sanitizeDbDate,
  sanitizeDateFields,
} = require("../util/convertCase");
const { ensureDecisionDetailsForClaim } = require("../dataAccess/decisionDetailsDao");
const {
  mapHospitalRowToDb,
  mapDoctorRowToDb,
  mapProofRowToDb,
  mapInsuranceProofRowToDb,
  mapWitnessRowToDb,
  mapIncomeRowToDb,
} = require("../util/eagleTableMappers");

const INTIMATION_DATE_KEYS = [
  "INITIATION_DATE",
  "INTIMATION_DATE",
  "DATE_OF_DEATH_EVENT",
  "DATE_OF_DEATH_REG",
  "DATE_OF_CREMATION",
  "DATE_OF_ACCIDENT",
  "DEATH_CERTIFICATE_REG_DATE",
];
const CAUSE_EVENT_DATE_KEYS = ["DATE_OF_EVENT"];
const CONTACT_DATE_KEYS = [
  "RCD",
  "ISSUE_DATE",
  "PAID_TO_DATE",
  "CDF_DATE",
  "UW_DECISION_DATE",
  "RISK_CESSATION_DATE",
];
const ClaimQuestions = require("../models/ClaimsQuestions");
const Claim = require("../models/Claim");

const trapScoreService = require('../services/trapScoreService');
const { notifyClaimRegistered } = require('../services/claimRegistrationNotifyService');
const { evaluateAcuity } = require('../services/acuityDecisionService');
const SystemAssessorRemark = require("../models/SystemAssessorRemark");

// simrans tables 
const AgentHistoryTable = require('../models/AgentRepudiationHistory');
const HospitalDetailsTable = require('../models/HospitalDetails')
const DoctorDetailsTable = require('../models/DoctorDetails')
const ProofDetailsTable = require('../models/ProofDetails')
const InsuranceProofDetailsTable = require('../models/InsuranceProofDetails')
const WitnessDetailsTable = require('../models/WitnessDetails')
const IncomeDetailsTable = require('../models/IncomeDetails')
const ReqCommonDetailsTable = require('../models/ReqCommonDetails')
const ReqRiderDetailsTable = require('../models/ReqRiderDetails')
const ReqEmailTable = require('../models/ReqEmail')
const ReqLetterTable = require('../models/ReqLetter')

const SmsScript = require("../models/SmsScript");
const Telecalling = require("../models/Telecalling");
const IibEnquiry = require("../models/IibEnquiry");
const CaseTrigger = require("../models/CaseTrigger");
const SystemRemark = require("../models/SystemRemark");
const PriorityFlag = require("../models/PriorityFlag");
const ParallelPolicy = require("../models/ParallelPolicy");

const { buildRequirementRowSnake } = require("../util/buildRequirementRow");

/** API payloads sometimes send { data: [...] } instead of a bare array. */
function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  if (typeof value === "object") {
    for (const key of [
      "data",
      "rows",
      "records",
      "list",
      "items",
      "agentHistory",
      "agentRepudiation",
    ]) {
      const nested = value[key];
      if (Array.isArray(nested)) return nested;
      if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        const inner = asArray(nested);
        if (inner.length) return inner;
      }
    }
  }
  return [];
}

const fs = require("fs");
const path = require("path");
const DEBUG_LOG_PATH = path.join(__dirname, "../../register-claim-debug.log");
function debugLog(label, data) {
  try {
    fs.appendFileSync(
      DEBUG_LOG_PATH,
      `[${new Date().toISOString()}] ${label} = ${JSON.stringify(data)}\n`
    );
  } catch (e) {
    console.error("debugLog write failed:", e.message);
  }
}

const registerClaim = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start transaction
  console.log('registerClaimController >> registerClaim request received');
  console.log('[DEBUG] req.body.lifeAssuredDetails RAW =', JSON.stringify(req.body.lifeAssuredDetails));
  debugLog('lifeAssuredDetails RAW', req.body.lifeAssuredDetails);
  debugLog('laCity/laState/laPincode on req.body', {
    laCity: req.body.laCity,
    laState: req.body.laState,
    laPincode: req.body.laPincode,
    laFlat: req.body.laFlat,
  });
  try {
    let {
      intimationDetails = {},
      causeEvent = {},
      payeeDetails = [],
      claimantDetails = [],
      lifeAssuredDetails = {},
      contactDetails = {},
      eagleScreen = {},
      requirements = {},
      requirementTable = [],
      systemDetails = {},
      accessorDetails = {},
      verifierDetails = {},
      claimQuestions = {},
      systemAssessorRemarks = {},
      trapScoreData,
      policyID,
      createdBy,

      agentHistoryTable = [],
      hospitalDetailsTable = [],
      doctorDetailsTable = [],
      proofDetailsTable = [],
      insuranceProofDetailsTable = [],
      witnessDetailsTable = [],
      incomeDetailsTable = [],

      reqCommonDetailsTable = [],
      reqRiderDetailsTable = [],
      reqEmailTable = [],
      reqLetterTable = [],

      smsData = [],
      telecalling = [],
      caseTrigger = [],
      systemRemarks = [],
      fraudFlags,
      priorityFlag = [],
      unregisteredPolicies = [],
      stpPolicies = [],
      nonStpPolicies = [],
      riderDetailsTable1 = [],

      // IIB (Insurance Information Bureau) manual enquiry — Assessment tab, "IIB Enquiry" sub-tab
      iibRefNo,
      iibEnquiryDate,
      iibStatus,
      iibPoliciesFound,
      iibTotalSA,
      iibFraudFlag,
      iibMultiplePolicy,
      iibNonDisclosure,
      iibRemarks,
    } = req.body;

    payeeDetails = asArray(payeeDetails);
    claimantDetails = asArray(claimantDetails);
    requirementTable = asArray(requirementTable);
    agentHistoryTable = asArray(agentHistoryTable);
    hospitalDetailsTable = asArray(hospitalDetailsTable);
    doctorDetailsTable = asArray(doctorDetailsTable);
    proofDetailsTable = asArray(proofDetailsTable);
    insuranceProofDetailsTable = asArray(insuranceProofDetailsTable);
    witnessDetailsTable = asArray(witnessDetailsTable);
    incomeDetailsTable = asArray(incomeDetailsTable);
    reqCommonDetailsTable = asArray(reqCommonDetailsTable);
    reqRiderDetailsTable = asArray(reqRiderDetailsTable);
    reqEmailTable = asArray(reqEmailTable);
    reqLetterTable = asArray(reqLetterTable);
    smsData = asArray(smsData);
    telecalling = asArray(telecalling);
    caseTrigger = asArray(caseTrigger);
    systemRemarks = asArray(systemRemarks);
    priorityFlag = asArray(priorityFlag);
    unregisteredPolicies = asArray(unregisteredPolicies);
    riderDetailsTable1 = asArray(riderDetailsTable1);

    // console.log(smsData)
    // console.log(telecalling)
    // console.log(caseTrigger)
    // console.log(systemRemarks)
    // console.log(fraudFlags)
    // console.log(priorityFlag)
    // console.log(unregisteredPolicies)

    const modifiedBy = createdBy;

    const claimSeq = await ClaimSequence.findOne({
      where: { ID: 1 },
      transaction,
    });

    if (!claimSeq) {
      throw new Error("Claim sequence not found");
    }

    const { SEQ_NO } = claimSeq;
    const claimNumber = `CL${SEQ_NO}`;

    console.log({ message: `Your claim number is ${claimNumber}` });

    const intimationDetailsSnake = sanitizeDateFields(
      camelToSnakeCase({
        ...intimationDetails,
        createdBy,
        modifiedBy,
      }),
      INTIMATION_DATE_KEYS
    );
    const causeEventSnake = sanitizeDateFields(
      camelToSnakeCase({
        ...causeEvent,
        createdBy,
        modifiedBy,
      }),
      CAUSE_EVENT_DATE_KEYS
    );
    const payeeFirst = Array.isArray(payeeDetails) ? payeeDetails[0] || {} : payeeDetails || {};
    const payeeDetailSnake = camelToSnakeCase({
      ...payeeFirst,
      createdBy,
      modifiedBy,
    });

    const payeeDetail = (payeeDetails || []).map((payee) =>
      camelToSnakeCase({ ...payee, createdBy, modifiedBy })
    )

    const claimantFirst = Array.isArray(claimantDetails) ? claimantDetails[0] || {} : claimantDetails || {};
    const claimantDetailsSnake = camelToSnakeCase({
      ...claimantFirst,
      createdBy,
      modifiedBy,
    });

    const claimantDetail = (claimantDetails || []).map((claimant) =>
      camelToSnakeCase({ ...claimant, createdBy, modifiedBy })
    )

    // Registration wizard also sends the raw laCity/laState/laPincode (and
    // laFlat/laRoad/laArea) fields flat on req.body (DemographicsTab's fallback
    // display value isn't always committed into lifeAssuredDetails in time for
    // submit), so fall back to those before giving up on an empty address field.
    const lifeAssuredDetailsSnake = camelToSnakeCase({
      ...lifeAssuredDetails,
      emailId1: lifeAssuredDetails.emailId1 || lifeAssuredDetails.emailId,
      mobileNo1: lifeAssuredDetails.mobileNo1 || lifeAssuredDetails.mobileNo,
      flat1: lifeAssuredDetails.flat1 || lifeAssuredDetails.flat || req.body.laFlat,
      road1: lifeAssuredDetails.road1 || lifeAssuredDetails.road || req.body.laRoad,
      area1: lifeAssuredDetails.area1 || lifeAssuredDetails.area || req.body.laArea,
      city1: lifeAssuredDetails.city1 || lifeAssuredDetails.city || req.body.laCity,
      state1: lifeAssuredDetails.state1 || lifeAssuredDetails.state || req.body.laState,
      pincode1: lifeAssuredDetails.pincode1 || lifeAssuredDetails.pincode || req.body.laPincode,
      createdBy,
      modifiedBy,
    });
    if (!lifeAssuredDetailsSnake.EMAIL_ID1 && lifeAssuredDetailsSnake.EMAIL_ID) {
      lifeAssuredDetailsSnake.EMAIL_ID1 = lifeAssuredDetailsSnake.EMAIL_ID;
    }
    if (!lifeAssuredDetailsSnake.MOBILE_NO1 && lifeAssuredDetailsSnake.MOBILE_NO) {
      lifeAssuredDetailsSnake.MOBILE_NO1 = lifeAssuredDetailsSnake.MOBILE_NO;
    }
    if (!lifeAssuredDetailsSnake.FLAT1 && lifeAssuredDetailsSnake.FLAT) {
      lifeAssuredDetailsSnake.FLAT1 = lifeAssuredDetailsSnake.FLAT;
    }
    if (!lifeAssuredDetailsSnake.ROAD1 && lifeAssuredDetailsSnake.ROAD) {
      lifeAssuredDetailsSnake.ROAD1 = lifeAssuredDetailsSnake.ROAD;
    }
    if (!lifeAssuredDetailsSnake.AREA1 && lifeAssuredDetailsSnake.AREA) {
      lifeAssuredDetailsSnake.AREA1 = lifeAssuredDetailsSnake.AREA;
    }
    if (!lifeAssuredDetailsSnake.CITY1 && lifeAssuredDetailsSnake.CITY) {
      lifeAssuredDetailsSnake.CITY1 = lifeAssuredDetailsSnake.CITY;
    }
    if (!lifeAssuredDetailsSnake.STATE1 && lifeAssuredDetailsSnake.STATE) {
      lifeAssuredDetailsSnake.STATE1 = lifeAssuredDetailsSnake.STATE;
    }
    if (!lifeAssuredDetailsSnake.PINCODE1 && lifeAssuredDetailsSnake.PINCODE) {
      lifeAssuredDetailsSnake.PINCODE1 = lifeAssuredDetailsSnake.PINCODE;
    }
    const contactDetailsSnake = sanitizeDateFields(
      camelToSnakeCase({
        ...contactDetails,
        createdBy,
        modifiedBy,
      }),
      CONTACT_DATE_KEYS
    );
    const eagleScreenSnake = sanitizeDateFields(
      camelToSnakeCase({
        ...eagleScreen,
        createdBy,
        modifiedBy,
      }),
      ["ACCOUNT_OPEN_DATE"]
    );

    const requirementsSnake = camelToSnakeCase({
      ...requirements,
      createdBy,
      modifiedBy,
    });

    const systemAssessorSnake = camelToSnakeCase({
      ...systemAssessorRemarks,
      createdBy,
      modifiedBy
    })

    // const requirementTableSnake = camelToSnakeCase({
    //   ...requirementTable,
    //   createdBy,
    //   modifiedBy,
    // });

    const systemSnake = camelToSnakeCase({
      ...systemDetails,
      createdBy,
      modifiedBy,
    });

    const accessorSnake = camelToSnakeCase({
      ...accessorDetails,
      createdBy,
      modifiedBy,
    });
    const verifierSnake = camelToSnakeCase({
      ...verifierDetails,
      createdBy,
      modifiedBy,
    });
    const claimQuestionsSnake = camelToSnakeCase({
      ...claimQuestions,
      createdBy,
      modifiedBy,
    });


    let trapScoreDataStore = trapScoreData;

    if (!trapScoreData) {
      console.log("message")
      const data = {
        //24 values excluding comments
        gender: lifeAssuredDetails.gender,
        avlSA: null,//
        ageAtDeath: lifeAssuredDetails.ageAtDeath,
        policyAge: contactDetails.policyAge,
        education: lifeAssuredDetails.education,
        state: lifeAssuredDetails.state,
        productCategory: null,//
        occCategory: lifeAssuredDetails.occCategory,
        advStatus: null,//
        claimRepudiate: contactDetails.claimsRupidiate,
        causeOfDeath: null,//
        placeOfClaim: null,//
        firPMReceived: intimationDetails.firPmReceived,
        declareByDR: intimationDetails.declaredByDoctor,
        cityFlag: null,
        pincodeFlag: null,
        nullRemark: "SUCCESS",
        umCode: contactDetails.umCode,
        advisorCode: contactDetails.advisorCode,
        advisorCategory: null,//
        advisorClub: null,//
        dateOfDisability: null,//
        claimType: intimationDetails.claimType,
        source: intimationDetails.source,
        intimationDate: intimationDetails.intimationDate,
        dateOfDeath: intimationDetails.dateOfDeathReg,
        typeOfClaim: causeEvent.typeOfClaim,
        productCode: contactDetails.productCode,
        // added city and pincode to check fraud master 
        city: lifeAssuredDetails.city,
        pin: lifeAssuredDetails.pincode,
      }

      trapScoreDataStore = await trapScoreService.getTrapScore(data)
    }
    console.log(trapScoreDataStore)

    const trapScoreSnake = sanitizeDateFields(
      camelToSnakeCase({
        ...trapScoreDataStore,
        assessorId: createdBy,
        trapScoreDate: trapScoreDataStore.trapScoreDate || trapScoreDataStore.trapDate,
        trapScore:
          trapScoreDataStore.trapScore != null
            ? parseFloat(trapScoreDataStore.trapScore)
            : trapScoreDataStore.trapScore,
      }),
      ["TRAP_SCORE_DATE"]
    );
    console.log(trapScoreSnake)

    const claim = await Claim.create(
      {
        ...intimationDetailsSnake,
        ...causeEventSnake,
        ...payeeDetailSnake,
        ...claimantDetailsSnake,
        ...lifeAssuredDetailsSnake,
        ...contactDetailsSnake,
        ...eagleScreenSnake,
        ...requirementsSnake,
        // ...requirementTableSnake,
        ...systemSnake,
        ...accessorSnake,
        ...verifierSnake,
        // createdBy,
        // modifiedBy,
        CLAIM_NUMBER: claimNumber,
        POLICY_ID: policyID,
        STATUS: "Pending Assessor Allocation",
        ROLE: "Assessor"
      },
      { transaction }
    );

    intimationDetailsSnake.CLAIM_ID = claim.CLAIM_ID;

    const intimation = await IntimationDetail.create(intimationDetailsSnake, { transaction });

    trapScoreSnake.CLAIM_ID = claim.CLAIM_ID
    const trap = await TrapScore.create(trapScoreSnake, { transaction });

    causeEventSnake.CLAIM_ID = claim.CLAIM_ID;
    const cause = await CauseEvent.create(causeEventSnake, { transaction });


    const payee = await Promise.all(
      payeeDetail.map(async (val) => {
        val.CLAIM_ID = claim.CLAIM_ID;
        return PayeeDetail.create(val, { transaction });
      })
    );

    const claimant = await Promise.all(
      claimantDetail.map(async (val) => {
        val.CLAIM_ID = claim.CLAIM_ID;
        return ClaimantDetail.create(val, { transaction });
      })
    );

    lifeAssuredDetailsSnake.CLAIM_ID = claim.CLAIM_ID;
    console.log('[DEBUG] lifeAssuredDetailsSnake ABOUT TO SAVE =', JSON.stringify(lifeAssuredDetailsSnake));
    debugLog('lifeAssuredDetailsSnake ABOUT TO SAVE', lifeAssuredDetailsSnake);
    const lifeAssured = await LifeAssuredDetail.create(
      lifeAssuredDetailsSnake,
      { transaction }
    );
    console.log('[DEBUG] lifeAssured SAVED ROW =', JSON.stringify(lifeAssured?.dataValues));
    debugLog('lifeAssured SAVED ROW', lifeAssured?.dataValues);

    contactDetailsSnake.CLAIM_ID = claim.CLAIM_ID;
    const contact = await ContactDetail.create(contactDetailsSnake, {
      transaction,
    });

    eagleScreenSnake.CLAIM_ID = claim.CLAIM_ID;
    const eagle = await EagleScreen.create(eagleScreenSnake, { transaction });

    let require = null;
    const hasLegacyRequirementsPayload =
      requirements &&
      Object.keys(requirements).some(
        (key) => requirements[key] != null && String(requirements[key]).trim() !== ""
      );
    if (hasLegacyRequirementsPayload && !(requirementTable || []).length) {
      requirementsSnake.CLAIM_ID = claim.CLAIM_ID;
      require = await Requirement.create(requirementsSnake, { transaction });
    }

    claimQuestionsSnake.CLAIM_ID = claim.CLAIM_ID;
    const questions = await ClaimQuestions.create(claimQuestionsSnake, {
      transaction,
    });

    // IIB Enquiry is persisted AFTER transaction.commit() below.
    // Reason: a failed INSERT inside this InnoDB transaction would abort the
    // whole claim (and historically some environments failed IIB while the rest
    // of registration was expected to succeed). Payload is built here so we
    // still have claim.CLAIM_ID + req fields in scope after commit.
    const iibEnquiryPayload = {
      CLAIM_ID: String(claim.CLAIM_ID),
      IIB_REF_NO: iibRefNo || null,
      IIB_ENQUIRY_DATE: sanitizeDbDate(iibEnquiryDate),
      IIB_STATUS: iibStatus || null,
      IIB_POLICIES_FOUND:
        iibPoliciesFound != null && iibPoliciesFound !== ""
          ? parseInt(iibPoliciesFound, 10)
          : null,
      IIB_TOTAL_SA:
        iibTotalSA != null && iibTotalSA !== "" ? parseFloat(iibTotalSA) : null,
      IIB_FRAUD_FLAG: iibFraudFlag || null,
      IIB_MULTIPLE_POLICY: iibMultiplePolicy || null,
      IIB_NON_DISCLOSURE: iibNonDisclosure || null,
      IIB_REMARKS: iibRemarks || null,
      CREATED_BY: createdBy,
      MODIFIED_BY: modifiedBy,
    };
    let iibEnquiry = null;

    systemAssessorSnake.CLAIM_ID = claim.CLAIM_ID
    const sysRemark = await SystemAssessorRemark.create(systemAssessorSnake, {
      transaction
    })

    systemSnake.CLAIM_ID = claim.CLAIM_ID;
    const system = await DecisionSystem.create(systemSnake, { transaction });

    accessorSnake.CLAIM_ID = claim.CLAIM_ID;
    const accessor = await DecisionAccessor.create(accessorSnake, {
      transaction,
    });

    verifierSnake.CLAIM_ID = claim.CLAIM_ID;
    const verifier = await DecisionVerificationAndSummary.create(
      verifierSnake,
      { transaction }
    );

    // Persist each checklist row on requirements (auto-increment PK per row)
    const requirementTablePromises = (requirementTable || []).map(async (reqItem) => {
      const requirementRowSnake = buildRequirementRowSnake(
        reqItem,
        createdBy,
        modifiedBy
      );
      requirementRowSnake.CLAIM_ID = claim.CLAIM_ID;
      return Requirement.create(requirementRowSnake, { transaction });
    });
    const requirementTableResults = await Promise.all(requirementTablePromises);

    const smsDataResults = await Promise.all(smsData.map(async (sms) => {
      const smsSnake = camelToSnakeCase(sms)
      smsSnake.CLAIM_ID = claim.CLAIM_ID
      smsSnake.CREATED_BY = createdBy
      smsSnake.MODIFIED_BY = modifiedBy
      return await SmsScript.create(smsSnake, { transaction })
    }))

    const telecallingResult = await Promise.all(telecalling.map(async (row) => {
      const rowSnake = camelToSnakeCase(row);
      rowSnake.CLAIM_ID = claim.CLAIM_ID;
      rowSnake.CALL_TO = row.callTo;
      rowSnake.THE_DATE = row.theDate || row.callDate;
      rowSnake.CALL_BY = row.callBy || row.callerName;
      rowSnake.OUTCOME = row.outcome || row.callStatus;
      rowSnake.DETAILS = row.details || row.remarks;
      rowSnake.CREATED_BY = createdBy;
      rowSnake.MODIFIED_BY = modifiedBy;
      return await Telecalling.create(rowSnake, { transaction });
    }));

    const caseTriggerResult = await Promise.all(caseTrigger.map(async (row) => {
      const rowSnake = camelToSnakeCase(row);
      rowSnake.CLAIM_ID = claim.CLAIM_ID;
      rowSnake.REASON = row.reason || row.caseTrigger;
      rowSnake.REMARKS = row.remarks || row.triggerReason;
      rowSnake.PRIORITY_FLAG = row.priorityFlag || row.PRIORITY_FLAG || null;
      rowSnake.CREATEDBY = createdBy;
      rowSnake.MODIFIEDBY = modifiedBy;
      return await CaseTrigger.create(rowSnake, { transaction });
    }));

    const systemRemarkResult = await Promise.all(systemRemarks.map(async (row) => {
      const rowSnake = camelToSnakeCase(row)
      rowSnake.CLAIM_ID = claim.CLAIM_ID
      rowSnake.CREATEDBY = createdBy
      rowSnake.MODIFIEDBY = modifiedBy
      return await SystemRemark.create(rowSnake, { transaction })
    }))


    const priorityFlagResult = await Promise.all(priorityFlag.map(async (row) => {
      const rowSnake = camelToSnakeCase(row);
      rowSnake.CLAIM_ID = claim.CLAIM_ID;
      rowSnake.REASON = row.reason || row.priorityFlag;
      rowSnake.CREATEDBY = createdBy;
      rowSnake.MODIFIEDBY = modifiedBy;
      return await PriorityFlag.create(rowSnake, { transaction });
    }));


    const unregisteredPoliciesResult = await Promise.all(unregisteredPolicies.map(async (row) => {
      const rowSnake = camelToSnakeCase(row)
      rowSnake.CLAIM_ID = claim.CLAIM_ID
      rowSnake.POLICY_NUMBER = row.policyNo
      return await ParallelPolicy.create(rowSnake, { transaction })
    }))


    // agent repudiation history table 
    const AgentHistoryTablePromises = agentHistoryTable.map(async (agentItem) => {
      const agentHistoryData = {
        ...agentItem,
        CLAIM_ID: claim.CLAIM_ID,
        CREATED_BY: createdBy, // Add CREATED_BY
        MODIFIED_BY: modifiedBy // Add MODIFIED_BY
      };

      return AgentHistoryTable.create(agentHistoryData, { transaction });
    });
    const AgentHistoryTableResults = await Promise.all(AgentHistoryTablePromises);


    //hospital details table in eagle screen
    const HospitalDetailsTablePromises = hospitalDetailsTable.map(async (hospitalItem) => {
      const HospitalDetailsTableSnake = {
        ...mapHospitalRowToDb({ ...hospitalItem, createdBy, modifiedBy }),
        CLAIM_ID: claim.CLAIM_ID,
        CREATED_BY: createdBy,
        MODIFIED_BY: modifiedBy,
      };
      return HospitalDetailsTable.create(HospitalDetailsTableSnake, { transaction });
    });
    // console.log(HospitalDetailsTablePromises)
    const HospitalDetailsTableResults = await Promise.all(HospitalDetailsTablePromises);

    // doctor details tab in eagle screen
    const DoctorDetailsTablePromises = doctorDetailsTable.map(async (doctorItem) => {
      const DoctorDetailsTableSnake = {
        ...mapDoctorRowToDb({ ...doctorItem, createdBy, modifiedBy }),
        CLAIM_ID: claim.CLAIM_ID,
        CREATED_BY: createdBy,
        MODIFIED_BY: modifiedBy,
      };
      return DoctorDetailsTable.create(DoctorDetailsTableSnake, { transaction });
    });
    // console.log(DoctorDetailsTablePromises);
    const DoctorDetailsTableResults = await Promise.all(DoctorDetailsTablePromises);


    // for proof details tab in eagle screen
    const ProofDetailsTablePromises = proofDetailsTable.map(async (proofItem) => {
      const ProofDetailsTableSnake = {
        ...mapProofRowToDb({ ...proofItem, createdBy, modifiedBy }),
        CLAIM_ID: claim.CLAIM_ID,
        CREATED_BY: createdBy,
        MODIFIED_BY: modifiedBy,
      };
      return ProofDetailsTable.create(ProofDetailsTableSnake, { transaction });
    });
    const ProofDetailsTableResults = await Promise.all(ProofDetailsTablePromises);


    // for insurance proof details table in eagle screen
    const InsuranceProofDetailsTablePromises = insuranceProofDetailsTable.map(async (insuranceProofItem) => {
      const InsuranceProofDetailsTableSnake = {
        ...mapInsuranceProofRowToDb({ ...insuranceProofItem, createdBy, modifiedBy }),
        CLAIM_ID: claim.CLAIM_ID,
        CREATED_BY: createdBy,
        MODIFIED_BY: modifiedBy,
      };
      return InsuranceProofDetailsTable.create(InsuranceProofDetailsTableSnake, { transaction });
    });
    const InsuranceProofDetailsTableResults = await Promise.all(InsuranceProofDetailsTablePromises);

    // for witness details tab in eagle screen
    const WitnessDetailsTablePromises = witnessDetailsTable.map(async (witnessItem) => {
      const WitnessDetailsTableSnake = {
        ...mapWitnessRowToDb({ ...witnessItem, createdBy, modifiedBy }),
        CLAIM_ID: claim.CLAIM_ID,
        CREATED_BY: createdBy,
        MODIFIED_BY: modifiedBy,
      };
      return WitnessDetailsTable.create(WitnessDetailsTableSnake, { transaction });
    });

    const WitnessDetailsTableResults = await Promise.all(WitnessDetailsTablePromises);


    // for income details tab in eagle screen
    const IncomeDetailsTablePromises = incomeDetailsTable.map(async (incomeItem) => {
      const IncomeDetailsTableSnake = {
        ...mapIncomeRowToDb({ ...incomeItem, createdBy, modifiedBy }),
        CLAIM_ID: claim.CLAIM_ID,
        CREATED_BY: createdBy,
        MODIFIED_BY: modifiedBy,
      };
      return IncomeDetailsTable.create(IncomeDetailsTableSnake, { transaction });
    });

    const IncomeDetailsTableResults = await Promise.all(IncomeDetailsTablePromises);


    // requirement tab 1-common details table
    const ReqCommonDetailsPromises = reqCommonDetailsTable.map(async (reqCommonItem) => {
      const ReqCommonDetailsSnake = camelToSnakeCase({ ...reqCommonItem, createdBy, modifiedBy });
      ReqCommonDetailsSnake.CLAIM_ID = claim.CLAIM_ID; // Ensure CLAIM_ID is set correctly
      return ReqCommonDetailsTable.create(ReqCommonDetailsSnake, { transaction });
    });

    const ReqCommonDetailsResults = await Promise.all(ReqCommonDetailsPromises);

    //requirement tab 1-rider details table
    const ReqRiderDetailsPromises = reqRiderDetailsTable.map(async (reqRiderItem) => {
      const ReqRiderDetailsSnake = camelToSnakeCase({ ...reqRiderItem, createdBy, modifiedBy });
      ReqRiderDetailsSnake.CLAIM_ID = claim.CLAIM_ID; // Ensure CLAIM_ID is set correctly
      return ReqRiderDetailsTable.create(ReqRiderDetailsSnake, { transaction });
    });

    const ReqRiderDetailsResults = await Promise.all(ReqRiderDetailsPromises);


    //requirement tab 2-email table
    const ReqEmailTablePromises = reqEmailTable.map(async (reqEmailItem) => {
      const ReqEmailTableSnake = camelToSnakeCase({ ...reqEmailItem, createdBy, modifiedBy });
      ReqEmailTableSnake.CLAIM_ID = claim.CLAIM_ID; // Ensure CLAIM_ID is set correctly
      return ReqEmailTable.create(ReqEmailTableSnake, { transaction });
    });

    const ReqEmailTableResults = await Promise.all(ReqEmailTablePromises);

    //requirement tab 2-letter table
    const ReqLetterTablePromises = reqLetterTable.map(async (reqLetterItem) => {
      const ReqLetterTableSnake = camelToSnakeCase({ ...reqLetterItem, createdBy, modifiedBy });
      ReqLetterTableSnake.CLAIM_ID = claim.CLAIM_ID; // Ensure CLAIM_ID is set correctly
      return ReqLetterTable.create(ReqLetterTableSnake, { transaction });
    });

    const ReqLetterTableResults = await Promise.all(ReqLetterTablePromises);

    //rider details in contract-same table will be for system and assesor tab rider details
    const RiderDetailsTablePromises = riderDetailsTable1.map(async (riderItem) => {
      const RiderDetailsTableSnake = camelToSnakeCase({ ...riderItem, createdBy, modifiedBy });
      RiderDetailsTableSnake.CLAIM_ID = claim.CLAIM_ID; // Ensure CLAIM_ID is set correctly
      return RiderDetailsTable.create(RiderDetailsTableSnake, { transaction });
    });

    const RiderDetailsTableResults = await Promise.all(RiderDetailsTablePromises);


    const status = {
      "CLAIM_NUMBER": claimNumber,
      "POLICY_NUMBER": policyID,
      "MODIFIED_BY": modifiedBy,
      "CREATED_BY": createdBy,
      "STATUS": "Pending Assessor Allocation"
    }

    const status_history = await StatusHistory.create(status, { transaction })

    const selectedPayeeId = req.body.selectedPayeeId;
    const payeesForAcuity = selectedPayeeId
      ? payeeDetails.filter(
        (p) => String(p.clientId || p.CLIENT_ID || '') === String(selectedPayeeId)
      )
      : payeeDetails.slice(0, 1);
    const acuity = await evaluateAcuity({
      claimantDetails,
      payeeDetails: payeesForAcuity.length ? payeesForAcuity : payeeDetails.slice(0, 1),
    });
    await Claim.update(
      {
        CLAIMANT_ACUITY_DECISION: acuity.claimantAcuityDecision,
        PAYEE_ACUITY_DECISION: acuity.payeeAcuityDecision,
        FINAL_ACUITY_DECISION: acuity.finalAcuityDecision,
      },
      { where: { CLAIM_ID: claim.CLAIM_ID }, transaction }
    );
    console.log('registerClaim >> acuity', { claimNumber, ...acuity });

    // Update the claimSequence table for the next sequence number
    await ClaimSequence.update(
      { SEQ_NO: (parseInt(claimSeq.SEQ_NO) + 1).toString() },
      { where: { ID: 1 }, transaction }
    );

    await transaction.commit(); // Commit transaction

    // IIB Enquiry — after commit so a bad IIB insert cannot roll back the claim.
    // Always write one row per claim (same pattern as telecalling/questions, but
    // outside the main txn for reliability). Raw SQL avoids Sequelize PK quirks
    // on iib_enquiry (model marks CLAIM_ID as PK; physical table has none).
    try {
      console.log('[IIB] registerClaim >> post-commit iib_enquiry INSERT', iibEnquiryPayload);
      debugLog('iibEnquiryPayload post-commit', iibEnquiryPayload);
      await sequelize.query(
        `INSERT INTO iib_enquiry (
          CLAIM_ID, IIB_REF_NO, IIB_ENQUIRY_DATE, IIB_STATUS,
          IIB_POLICIES_FOUND, IIB_TOTAL_SA, IIB_FRAUD_FLAG,
          IIB_MULTIPLE_POLICY, IIB_NON_DISCLOSURE, IIB_REMARKS,
          CREATED_BY, MODIFIED_BY
        ) VALUES (
          :CLAIM_ID, :IIB_REF_NO, :IIB_ENQUIRY_DATE, :IIB_STATUS,
          :IIB_POLICIES_FOUND, :IIB_TOTAL_SA, :IIB_FRAUD_FLAG,
          :IIB_MULTIPLE_POLICY, :IIB_NON_DISCLOSURE, :IIB_REMARKS,
          :CREATED_BY, :MODIFIED_BY
        )`,
        { replacements: iibEnquiryPayload }
      );
      iibEnquiry = await IibEnquiry.findOne({
        where: { CLAIM_ID: iibEnquiryPayload.CLAIM_ID },
      });
      console.log('[IIB] registerClaim >> iib_enquiry saved', iibEnquiry?.dataValues || iibEnquiryPayload);
      debugLog('iibEnquiry saved', iibEnquiry?.dataValues || iibEnquiryPayload);
    } catch (iibErr) {
      console.error('[IIB] registerClaim >> post-commit iib_enquiry INSERT FAILED', {
        message: iibErr?.message,
        original: iibErr?.original?.sqlMessage || iibErr?.original,
        payload: iibEnquiryPayload,
      });
      debugLog('iibEnquiry FAILED post-commit', {
        message: iibErr?.message,
        original: iibErr?.original?.sqlMessage || String(iibErr?.original),
        payload: iibEnquiryPayload,
      });
    }

    // Payable breakdown for Life Asia decisionDetails / Live & payable cards.
    // After commit so a rolled-back claim does not leave an orphan row.
    // Existing claims already in decision_details are left unchanged.
    try {
      const payableBase =
        systemDetails?.base ??
        systemDetails?.totalAmtPayable ??
        systemSnake.BASE ??
        systemSnake.TOTAL_AMT_PAYABLE ??
        0;
      await ensureDecisionDetailsForClaim(claimNumber, payableBase, createdBy || "Registration");
    } catch (ddErr) {
      console.error("registerClaim >> decision_details ensure failed:", ddErr.message || ddErr);
    }

    // Notify customer — direct WhatsApp/email API (same as Postman); not dependent on RabbitMQ worker
    try {
      const pick = (...vals) =>
        vals.find((v) => v != null && String(v).trim() !== '' && String(v).trim() !== 'null');

      const mobileNo = pick(
        lifeAssuredDetailsSnake.MOBILE_NO1,
        lifeAssuredDetailsSnake.MOBILE_NO,
        lifeAssuredDetails?.mobileNo1,
        lifeAssuredDetails?.mobileNo,
        contactDetails?.mobileNoChange,
        contactDetailsSnake.MOBILE_NO_CHANGE
      );
      const customerName = pick(
        lifeAssuredDetailsSnake.NAME,
        lifeAssuredDetails?.name,
        lifeAssuredDetails?.Name
      );
      const lifeAssuredEmail = pick(
        lifeAssuredDetailsSnake.EMAIL_ID1,
        lifeAssuredDetailsSnake.EMAIL_ID,
        lifeAssuredDetailsSnake.EMAIL,
        lifeAssuredDetails?.emailId1,
        lifeAssuredDetails?.emailId,
        lifeAssuredDetails?.email,
        contactDetails?.emailIdChange,
        contactDetailsSnake.EMAIL_ID_CHANGE
      );
      const sendMail =
        verifierDetails?.sendMail === true ||
        verifierDetails?.sendMail === 'true' ||
        verifierDetails?.sendMail === 'Yes' ||
        verifierSnake?.SEND_MAIL === true ||
        verifierSnake?.SEND_MAIL === 'true' ||
        verifierSnake?.SEND_MAIL === 'Yes' ||
        req.body.sendMail === true ||
        req.body.sendMail === 'true' ||
        req.body.sendMail === 'Yes';

      console.log('registerClaim >> notify', {
        claimNumber,
        mobileNo: mobileNo ? '***' + String(mobileNo).slice(-4) : null,
        customerName,
        lifeAssuredEmail,
        sendMail,
      });

      await notifyClaimRegistered({
        mobileNo,
        name: customerName,
        claimNo: claimNumber,
        email: lifeAssuredEmail,
        sendEmail: sendMail,
      });
    } catch (err) {
      console.error('registerClaim >> Registration notify error:', err.message || err);
    }

    // VAPT: the frontend only reads claimId/claimNumber/acuity from this response —
    // don't echo PAN/ID-proof numbers back in the body just because they were saved.
    const redactPii = (rows) =>
      (rows || []).map((row) => {
        const plain = { ...(row?.dataValues || row) };
        delete plain.PAN_NO;
        delete plain.ID_NUMBER;
        return plain;
      });

    res.status(201).json({
      message: "Register claim created successfully",
      claimId: intimation.CLAIM_ID,
      claimNumber: claimNumber,
      acuity,
      data: {
        intimation,
        cause,
        payee: redactPii(payee),
        claimant: redactPii(claimant),
        lifeAssured,
        contact,
        eagle,
        require,
        requirementTableResults,
        questions,
        iibEnquiry,
        sysRemark,
        system,
        accessor,
        verifier,
        claim,

        AgentHistoryTableResults,
        HospitalDetailsTableResults,
        DoctorDetailsTableResults,
        ProofDetailsTableResults,
        InsuranceProofDetailsTableResults,
        WitnessDetailsTableResults,
        IncomeDetailsTableResults,

        ReqCommonDetailsResults,
        ReqRiderDetailsResults,
        ReqEmailTableResults,
        ReqLetterTableResults,

        smsDataResults,

        telecallingResult,
        caseTriggerResult,
        systemRemarkResult,
        priorityFlagResult,

        unregisteredPoliciesResult,

        RiderDetailsTableResults
      },
    });
  } catch (error) {
    // Rollback the transaction in case of error.
    // Wrap rollback in its own try/catch so a closed connection doesn't crash the process.
    try {
      if (transaction && transaction.finished !== "commit") {
        await transaction.rollback();
      }
    } catch (rollbackErr) {
      console.error(
        "registerClaim >> rollback failed:",
        rollbackErr?.message || rollbackErr
      );
    }

    console.error("registerClaim >> error object:", error);
    const exposeDetail = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Internal server error",
      error: exposeDetail
        ? error.message || String(error)
        : "An error occurred while saving the claim. Please try again or contact support.",
    });
  }
};

module.exports = { registerClaim };