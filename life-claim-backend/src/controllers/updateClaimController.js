const logger = require('../util/logger');
const IntimationDetail = require("../models/IntimationDetail");
const appConfig = require('../config/configService');
const TrapScore = require("../models/TrapScore");
const CauseEvent = require("../models/CauseEvent");
const PayeeDetail = require("../models/PayeeDetail");
const ClaimantDetail = require("../models/ClaimantDetail");
const LifeAssuredDetail = require("../models/LifeAssuredDetail");
const ContactDetail = require("../models/ContactDetail");
const EagleScreen = require("../models/EagleScreen");
const Requirement = require("../models/Requirement");
const DecisionAccessor = require("../models/DecisionAccessor");
const DecisionSystem = require("../models/DecisionSystem");
const DecisionVerificationAndSummary = require("../models/DecisionVerificationAndSummary");
const sequelize = require("../config/sequelize");
const StatusHistory = require("../models/StatusHistory");
const Claim = require("../models/Claim");
const {
  camelToSnakeCase,
  snakeToCamelCase,
  sanitizeDbDate,
  sanitizeDateFields,
} = require("../util/convertCase");
const { buildRequirementRowSnake } = require("../util/buildRequirementRow");
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
  "ACCIDENT_DATE",
];

function pickClaimQuestionsOnly(claimQuestions = {}) {
  const out = {};
  for (let i = 0; i <= 26; i++) {
    const key = `question${i}`;
    if (claimQuestions[key] != null && claimQuestions[key] !== "") {
      out[key] = claimQuestions[key];
    }
  }
  return out;
}

function hasMeaningfulData(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Object.entries(obj).some(
    ([k, v]) =>
      !["claimId", "createdBy", "modifiedBy", "createdAt", "modifiedAt"].includes(k) &&
      v != null &&
      String(v).trim() !== ""
  );
}
const ClaimQuestions = require("../models/ClaimsQuestions");
const IibEnquiry = require("../models/IibEnquiry");
const EstablishedCause = require("../models/EstablishedCause");
const RiderDetailsTable = require("../models/RiderDetailsTable");
const SystemAssessorRemark = require("../models/SystemAssessorRemark");
const HospitalDetailsTable = require("../models/HospitalDetails");
const DoctorDetailsTable = require("../models/DoctorDetails");
const ProofDetailsTable = require("../models/ProofDetails");
const InsuranceProofDetailsTable = require("../models/InsuranceProofDetails");
const WitnessDetailsTable = require("../models/WitnessDetails");
const IncomeDetailsTable = require("../models/IncomeDetails");
const TelecallingTable = require("../models/Telecalling");
const CaseTriggerTable = require("../models/CaseTrigger");

const updateClaim = async (req, res) => {
  logger.info("updateClaim controller request received");
  const transaction = await sequelize.transaction();
  const body = req.body || {};
  try {
    const {
      claimNo,
      intimationDetails = {},
      establishedCauseDetails = {},
      payeeDetails = [],
      claimantDetails = [],
      lifeAssuredDetails = {},
      contactDetails = {},
      riderDetailsTable = [],
      eagleScreenDetails = {},
      requirements = {},
      requirementTable = [],
      systemDetails = {},
      iibEnquiryTable = [],
      verifierDetails = {},
      accessorDetails = {},
      claimQuestions = {},
      systemAssessorRemarks = {},
      modifiedBy,

      // added by simran
      hospitalDetailsTable = [],
      doctorDetailsTable = [],
      proofDetailsTable = [],
      insuranceProofDetailsTable = [],
      witnessDetailsTable = [],
      incomeDetailsTable = [],

      telecallingTable = [],
      caseTriggerTable = [],
    } = body;

    logger.info(claimNo);

    const claim = await Claim.findOne({
      where: { CLAIM_NUMBER: claimNo },
    });

    if (!claim) {
      await transaction.rollback();
      return res.status(404).json({ message: "Claim not found" });
    }

    const { CLAIM_ID: claimId } = claim;
    const safeQuestions = pickClaimQuestionsOnly(claimQuestions);

    if (body.intimationDetails != null && hasMeaningfulData(intimationDetails)) {
      const intimationDetailsSnake = sanitizeDateFields(
        camelToSnakeCase({
          ...intimationDetails,
          intimationDate: intimationDetails.intimationDate,
          whatsappFlag: intimationDetails.whatsappFlag,
          accidentDate: intimationDetails.accidentDate,
          modifiedBy: modifiedBy,
        }),
        INTIMATION_DATE_KEYS
      );
      await IntimationDetail.update(intimationDetailsSnake, {
        where: { CLAIM_ID: claimId },
        transaction,
      });
      logger.info("Intimation");
    }

    if (hasMeaningfulData(systemAssessorRemarks)) {
      const systemAssessorRemarksSnake = camelToSnakeCase({
        ...systemAssessorRemarks,
        modifiedBy: modifiedBy,
      });
      const existingRemark = await SystemAssessorRemark.findOne({
        where: { CLAIM_ID: claimId },
        transaction,
      });
      if (existingRemark) {
        await SystemAssessorRemark.update(systemAssessorRemarksSnake, {
          where: { CLAIM_ID: claimId },
          transaction,
        });
      } else {
        systemAssessorRemarksSnake.CLAIM_ID = claimId;
        await SystemAssessorRemark.create(systemAssessorRemarksSnake, {
          transaction,
        });
      }
    }

    if (Object.keys(safeQuestions).length > 0) {
      const claimQuestionsSnake = camelToSnakeCase({
        ...safeQuestions,
        modifiedBy: modifiedBy,
      });
      const existingQuestions = await ClaimQuestions.findOne({
        where: { CLAIM_ID: claimId },
        transaction,
      });
      if (existingQuestions) {
        await ClaimQuestions.update(claimQuestionsSnake, {
          where: { CLAIM_ID: claimId },
          transaction,
        });
      } else {
        claimQuestionsSnake.CLAIM_ID = claimId;
        await ClaimQuestions.create(claimQuestionsSnake, { transaction });
      }
    }

    if (hasMeaningfulData(establishedCauseDetails)) {
      const establishedCauseSnake = sanitizeDateFields(
        camelToSnakeCase({
          ...establishedCauseDetails,
          modifiedBy: modifiedBy,
        }),
        ["DATE_OF_EVENT"]
      );
      await EstablishedCause.destroy({
        where: { CLAIM_ID: claimId },
        transaction,
      });
      establishedCauseSnake.CLAIM_ID = claimId;
      await EstablishedCause.create(establishedCauseSnake, { transaction });
    }

    if (body.lifeAssuredDetails != null && hasMeaningfulData(lifeAssuredDetails)) {
      const lifeAssuredDetailsSnake = camelToSnakeCase({
        ...lifeAssuredDetails,
        emailId1: lifeAssuredDetails.emailId1 || lifeAssuredDetails.emailId,
        mobileNo1: lifeAssuredDetails.mobileNo1 || lifeAssuredDetails.mobileNo,
        flat1: lifeAssuredDetails.flat1 || lifeAssuredDetails.flat,
        road1: lifeAssuredDetails.road1 || lifeAssuredDetails.road,
        area1: lifeAssuredDetails.area1 || lifeAssuredDetails.area,
        city1: lifeAssuredDetails.city1 || lifeAssuredDetails.city,
        state1: lifeAssuredDetails.state1 || lifeAssuredDetails.state,
        pincode1: lifeAssuredDetails.pincode1 || lifeAssuredDetails.pincode,
        modifiedBy: modifiedBy,
      });
      await LifeAssuredDetail.update(lifeAssuredDetailsSnake, {
        where: { CLAIM_ID: claimId },
        transaction,
      });
      logger.info("Life assured");
    }

    if (body.contactDetails != null && hasMeaningfulData(contactDetails)) {
      const contactDetailsSnake = camelToSnakeCase({
        ...contactDetails,
        modifiedBy: modifiedBy,
      });
      await ContactDetail.update(contactDetailsSnake, {
        where: { CLAIM_ID: claimId },
        transaction,
      });
      logger.info("Contacts done");
    }

    if (body.eagleScreenDetails != null && hasMeaningfulData(eagleScreenDetails)) {
      const eagleScreenSnake = camelToSnakeCase({
        ...eagleScreenDetails,
        modifiedBy: modifiedBy,
      });
      await EagleScreen.update(eagleScreenSnake, {
        where: { CLAIM_ID: claimId },
        transaction,
      });
      logger.info("eagleScreenSnake done");
    }

    if (body.iibEnquiryTable != null) {
      await IibEnquiry.destroy({ where: { CLAIM_ID: claimId }, transaction });
      if (iibEnquiryTable.length > 0) {
        await Promise.all(
          iibEnquiryTable.map(async (row) => {
            // Explicit field map (not camelToSnakeCase) — the generic converter
            // splits "iibTotalSA" into IIB_TOTAL_S_A, which doesn't match the
            // real IIB_TOTAL_SA column. Mirrors registerClaimController's mapping.
            return await IibEnquiry.create(
              {
                CLAIM_ID: claimId,
                IIB_REF_NO: row.iibRefNo || null,
                IIB_ENQUIRY_DATE: sanitizeDbDate(row.iibEnquiryDate),
                IIB_STATUS: row.iibStatus || null,
                IIB_POLICIES_FOUND:
                  row.iibPoliciesFound != null && row.iibPoliciesFound !== ""
                    ? parseInt(row.iibPoliciesFound, 10)
                    : null,
                IIB_TOTAL_SA:
                  row.iibTotalSA != null && row.iibTotalSA !== ""
                    ? parseFloat(row.iibTotalSA)
                    : null,
                IIB_FRAUD_FLAG: row.iibFraudFlag || null,
                IIB_MULTIPLE_POLICY: row.iibMultiplePolicy || null,
                IIB_NON_DISCLOSURE: row.iibNonDisclosure || null,
                IIB_REMARKS: row.iibRemarks || null,
                CREATED_BY: modifiedBy,
                MODIFIED_BY: modifiedBy,
              },
              { transaction }
            );
          })
        );
      }
      logger.info("IIB done");
    }

    if (payeeDetails.length > 0) {
      const payeeDetail = payeeDetails.map((payee) =>
        camelToSnakeCase({ ...payee, modifiedBy: modifiedBy })
      );
      await PayeeDetail.destroy({ where: { CLAIM_ID: claimId }, transaction });
      for (const payee of payeeDetail) {
        payee.CLAIM_ID = claimId;
        await PayeeDetail.create(payee, { transaction });
      }
    } else {
      logger.info("No changes in payee");
    }

    if (Array.isArray(claimantDetails) && claimantDetails.length > 0) {
      const first = claimantDetails[0] || {};
      const claimantDetail = claimantDetails.map((claimant) =>
        camelToSnakeCase({
          ...claimant,
          modifiedBy: modifiedBy,
          flat: claimant.flat ?? first.flat,
          road: claimant.road ?? first.road,
          area: claimant.area ?? first.area,
          city: claimant.city ?? first.city,
          country: claimant.country ?? first.country,
          pinCode: claimant.pinCode ?? first.pinCode,
          nationality: claimant.nationality ?? first.nationality,
          panNo: claimant.panNo ?? first.panNo,
        })
      );
      await ClaimantDetail.destroy({ where: { CLAIM_ID: claimId }, transaction });
      for (const claimant of claimantDetail) {
        claimant.CLAIM_ID = claimId;
        await ClaimantDetail.create(claimant, { transaction });
      }
    }

    if (body.requirements != null && hasMeaningfulData(requirements)) {
      const requirementsSnake = camelToSnakeCase({
        ...requirements,
        modifiedBy: modifiedBy,
      });
      await Requirement.update(requirementsSnake, {
        where: { CLAIM_ID: claimId },
        transaction,
      });
    }

    if (body.requirementTable != null && Array.isArray(requirementTable) && requirementTable.length > 0) {
      // Registration stores checklist rows on Requirements; assessor fetch reads the same table.
      await Requirement.destroy({ where: { CLAIM_ID: claimId }, transaction });
      for (const reqItem of requirementTable) {
        const requirementRowSnake = buildRequirementRowSnake(
          reqItem,
          modifiedBy,
          modifiedBy
        );
        requirementRowSnake.CLAIM_ID = claimId;
        await Requirement.create(requirementRowSnake, { transaction });
      }
    }

    if (body.hospitalDetailsTable != null) {
      await HospitalDetailsTable.destroy({
        where: { CLAIM_ID: claimId },
        transaction,
      });
      for (const item of hospitalDetailsTable) {
        const itemSnake = {
          ...mapHospitalRowToDb({ ...item, modifiedBy }),
          CLAIM_ID: claimId,
          MODIFIED_BY: modifiedBy,
        };
        await HospitalDetailsTable.create(itemSnake, { transaction });
      }
    }

    if (body.doctorDetailsTable != null) {
      await DoctorDetailsTable.destroy({
        where: { CLAIM_ID: claimId },
        transaction,
      });
      for (const item of doctorDetailsTable) {
        const itemSnake = {
          ...mapDoctorRowToDb({ ...item, modifiedBy }),
          CLAIM_ID: claimId,
          MODIFIED_BY: modifiedBy,
        };
        await DoctorDetailsTable.create(itemSnake, { transaction });
      }
    }

    if (body.proofDetailsTable != null) {
      await ProofDetailsTable.destroy({
        where: { CLAIM_ID: claimId },
        transaction,
      });
      for (const item of proofDetailsTable) {
        const itemSnake = {
          ...mapProofRowToDb({ ...item, modifiedBy }),
          CLAIM_ID: claimId,
          MODIFIED_BY: modifiedBy,
        };
        await ProofDetailsTable.create(itemSnake, { transaction });
      }
    }

    if (body.insuranceProofDetailsTable != null) {
      await InsuranceProofDetailsTable.destroy({
        where: { CLAIM_ID: claimId },
        transaction,
      });
      for (const item of insuranceProofDetailsTable) {
        const itemSnake = {
          ...mapInsuranceProofRowToDb({ ...item, modifiedBy }),
          CLAIM_ID: claimId,
          MODIFIED_BY: modifiedBy,
        };
        await InsuranceProofDetailsTable.create(itemSnake, { transaction });
      }
    }

    if (body.witnessDetailsTable != null) {
      await WitnessDetailsTable.destroy({
        where: { CLAIM_ID: String(claimId) },
        transaction,
      });
      for (const item of witnessDetailsTable) {
        const itemSnake = {
          ...mapWitnessRowToDb({ ...item, modifiedBy }),
          CLAIM_ID: String(claimId),
          MODIFIED_BY: modifiedBy,
        };
        await WitnessDetailsTable.create(itemSnake, { transaction });
      }
    }

    if (body.incomeDetailsTable != null) {
      await IncomeDetailsTable.destroy({
        where: { CLAIM_ID: claimId },
        transaction,
      });
      for (const item of incomeDetailsTable) {
        const itemSnake = {
          ...mapIncomeRowToDb({ ...item, modifiedBy }),
          CLAIM_ID: claimId,
          MODIFIED_BY: modifiedBy,
        };
        await IncomeDetailsTable.create(itemSnake, { transaction });
      }
    }

    if (body.telecallingTable != null) {
      await TelecallingTable.destroy({
        where: { CLAIM_ID: claimId },
        transaction,
      });
      for (const item of telecallingTable) {
        const itemSnake = camelToSnakeCase({
          ...item,
          modifiedBy: modifiedBy,
        });
        itemSnake.CLAIM_ID = claimId;
        await TelecallingTable.create(itemSnake, { transaction });
      }
    }

    if (body.caseTriggerTable != null) {
      await CaseTriggerTable.destroy({
        where: { CLAIM_ID: claimId },
        transaction,
      });
      for (const item of caseTriggerTable) {
        const itemSnake = camelToSnakeCase({
          ...item,
          modifiedBy: modifiedBy,
        });
        itemSnake.CLAIM_ID = claimId;
        await CaseTriggerTable.create(itemSnake, { transaction });
      }
    }

    if (body.accessorDetails != null && hasMeaningfulData(accessorDetails)) {
      const decisionVal = accessorDetails.decision || accessorDetails.accessorDecision;
      const remarksVal = String(
        accessorDetails.remarks || accessorDetails.decisionReason || ""
      ).slice(0, 255);
      const accessorSnake = camelToSnakeCase({
        decision: decisionVal,
        remarks: remarksVal,
        reqDamt: accessorDetails.reqDamt,
        modifiedBy,
      });
      const existingAccessor = await DecisionAccessor.findOne({
        where: { CLAIM_ID: claimId },
        transaction,
      });
      if (existingAccessor) {
        await DecisionAccessor.update(accessorSnake, {
          where: { CLAIM_ID: claimId },
          transaction,
        });
      } else {
        accessorSnake.CLAIM_ID = claimId;
        await DecisionAccessor.create(accessorSnake, { transaction });
      }
    }

    if (body.verifierDetails != null && hasMeaningfulData(verifierDetails)) {
      const verifierSnake = camelToSnakeCase({
        ...verifierDetails,
        modifiedBy,
      });
      const existingVerifier = await DecisionVerificationAndSummary.findOne({
        where: { CLAIM_ID: claimId },
        transaction,
      });
      if (existingVerifier) {
        await DecisionVerificationAndSummary.update(verifierSnake, {
          where: { CLAIM_ID: claimId },
          transaction,
        });
      } else {
        verifierSnake.CLAIM_ID = claimId;
        await DecisionVerificationAndSummary.create(verifierSnake, { transaction });
      }
    }

    // Update and insert for riderDetailsTable
    //  await RiderDetailsTable.destroy({
    //   where: { CLAIM_ID: claimId },
    //   transaction,
    // });
    // for (const item of riderDetailsTable) {
    //   const itemSnake = camelToSnakeCase({
    //     ...item,
    //     modifiedBy: modifiedBy,
    //   });
    //   itemSnake.CLAIM_ID = claimId;
    //   await RiderDetailsTable.create(itemSnake, { transaction });
    // }

    await transaction.commit();
    res.status(200).json({ message: "Claim updated successfully" });
  } catch (error) {
    if (transaction.finished !== "commit") {
      await transaction.rollback();
    }
    logger.info(error);
    res.status(500).json({
      message: "Internal server error",
      ...(appConfig.get('NODE_ENV') !== "production" ? { detail: error?.message || String(error) } : {}),
    });
  }
};

module.exports = { updateClaim };
