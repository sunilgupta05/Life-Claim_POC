const Joi = require('joi');

/**
 * VAPT: input validation for /register-claim and /register-claim/update.
 *
 * These endpoints accept a large, evolving wizard payload (dozens of optional
 * business fields spread flat alongside ~30 known nested objects/arrays — see
 * buildRegistrationPayload.js on the frontend). Modeling every business field
 * here would be brittle and would risk rejecting legitimate submissions as the
 * wizard changes. Instead this schema is deliberately structural: known nested
 * keys must have the right shape, and every other field is passed through
 * unchanged via `.unknown(true)`. This blocks the classes of attack input
 * validation is meant to stop (type confusion, oversized/malformed nested
 * structures) without locking down the business schema itself.
 */

const looseObject = Joi.object().unknown(true).max(200);

// Matches asArray() in registerClaimController.js / updateClaimController.js,
// which tolerates a bare array, an object wrapping the array (e.g. {data:[...]}),
// or an empty/absent value — never reject a shape the controller already handles.
const tableField = Joi.alternatives().try(
  Joi.array().items(Joi.any()).max(1000),
  Joi.object().unknown(true).max(1000),
  Joi.string().valid(''),
  Joi.valid(null)
);

const nonEmptyString = (max) => Joi.string().trim().min(1).max(max);

const registerClaimBodySchema = Joi.object({
  policyID: nonEmptyString(50).required(),
  policyId: Joi.string().trim().max(50),
  createdBy: nonEmptyString(100).required(),

  intimationDetails: looseObject,
  causeEvent: looseObject,
  lifeAssuredDetails: looseObject,
  contactDetails: looseObject,
  eagleScreen: looseObject,
  requirements: looseObject,
  systemDetails: looseObject,
  accessorDetails: looseObject,
  verifierDetails: looseObject,
  claimQuestions: looseObject,
  systemAssessorRemarks: looseObject,
  trapScoreData: looseObject,

  payeeDetails: tableField,
  claimantDetails: tableField,
  requirementTable: tableField,
  agentHistoryTable: tableField,
  hospitalDetailsTable: tableField,
  doctorDetailsTable: tableField,
  proofDetailsTable: tableField,
  insuranceProofDetailsTable: tableField,
  witnessDetailsTable: tableField,
  incomeDetailsTable: tableField,
  reqCommonDetailsTable: tableField,
  reqRiderDetailsTable: tableField,
  reqEmailTable: tableField,
  reqLetterTable: tableField,
  smsData: tableField,
  telecalling: tableField,
  caseTrigger: tableField,
  systemRemarks: tableField,
  priorityFlag: tableField,
  unregisteredPolicies: tableField,
  stpPolicies: tableField,
  nonStpPolicies: tableField,
  riderDetailsTable1: tableField,

  iibRefNo: Joi.string().trim().allow('').max(100),
  iibEnquiryDate: Joi.string().trim().allow('', null).max(40),
  iibStatus: Joi.string().trim().allow('').max(20),
  iibPoliciesFound: Joi.alternatives().try(Joi.number(), Joi.string().trim().allow('')),
  iibTotalSA: Joi.alternatives().try(Joi.number(), Joi.string().trim().allow('')),
  iibFraudFlag: Joi.string().trim().allow('').max(10),
  iibMultiplePolicy: Joi.string().trim().allow('').max(10),
  iibNonDisclosure: Joi.string().trim().allow('').max(10),
  iibRemarks: Joi.string().trim().allow('').max(2000),
}).unknown(true);

const updateClaimBodySchema = Joi.object({
  claimNo: nonEmptyString(100).required(),
  modifiedBy: nonEmptyString(100).required(),

  intimationDetails: looseObject,
  establishedCauseDetails: looseObject,
  lifeAssuredDetails: looseObject,
  contactDetails: looseObject,
  eagleScreenDetails: looseObject,
  requirements: looseObject,
  systemDetails: looseObject,
  verifierDetails: looseObject,
  accessorDetails: looseObject,
  claimQuestions: looseObject,
  systemAssessorRemarks: looseObject,

  payeeDetails: tableField,
  claimantDetails: tableField,
  riderDetailsTable: tableField,
  requirementTable: tableField,
  iibEnquiryTable: tableField,
  hospitalDetailsTable: tableField,
  doctorDetailsTable: tableField,
  proofDetailsTable: tableField,
  insuranceProofDetailsTable: tableField,
  witnessDetailsTable: tableField,
  incomeDetailsTable: tableField,
  telecallingTable: tableField,
  caseTriggerTable: tableField,
}).unknown(true);

module.exports = { registerClaimBodySchema, updateClaimBodySchema };
