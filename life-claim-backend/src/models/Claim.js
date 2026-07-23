const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Claim = sequelize.define('Claim', {
  CLAIM_ID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  CASE_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  POLICY_ID: {
    type: DataTypes.STRING,// because if stored as integer leading zeroes is removed
    allowNull: true,
  },
  INITIATION_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  CLAIM_TYPE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  PORTFOLIO: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  POLICY_STATUS: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  INITIMATION_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  SOURCE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  PLACE_OF_CLAIM: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  LIFE_ASR_STATUS: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  DATE_OF_DEATH: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  DATE_OF_DEATH_REG: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  CALL_ID: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  USER_ID: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  CLAIM_STATUS: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  CLAIM_ACTIVITY_STATUS: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ADDITIONAL_ATTR_1: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ADDITIONAL_ATTR_2: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  DECISION_PRI: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  DECISION_SEC: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  DECISION_REASON_PRI: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  DECISION_REASON_SEC: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  DECISION_REMARKS_PRI: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  DECISION_REMARKS_SEC: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  DECISION_CLAUSE: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  VERBAL_INTMTN_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  CLAIM_NUMBER: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  IS_SAMPLED: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  IS_VERIFIED: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  CREATED_AT: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  CREATED_BY: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  MODIFIED_AT: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  MODIFIED_BY: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  VERBAL_SOURCE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  VERBAL_DATEOFDEATH: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  VERBAL_EVENT: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  VERBAL_REMARKS: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  POLICY_STATUS_DOD: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  PORTFOLIO_SUBTYPE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  DATE_OF_CREMATION: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  DEATHFLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  JOINTFLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  FCR_DAY: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  FCR_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  BRANCH_CODE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  PAYOUT_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  BASE_LDR: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  KYC_LDR: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  HOLDING_LETTER_SENT: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  HOLDING_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  ASSESSMENT_USERID: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  ASSESSMENT_USERNAME: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  APPROVER_USERID: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  APPROVER_USERNAME: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  DECISION_PUSHFLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  INTIMATION_PUSHFLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  DEATHAPPROVALFLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  POLICY_STATUS_TEMP: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  DMS_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  REUPD_REASON: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  ASSESSOR_MAPPING_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  REQ_USERID: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  REQ_USERNAME: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  HOLD_LETTER_USERID: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  HOLD_LETTER_USERNAME: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  RISK_USERID: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  RISK_USERNAME: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  EARLY_CLAIM: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  REPD_CODE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  DATE_OF_DISABILITY: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  ADBR_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  ADBR_RCD_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  DATE_OF_ACCIDENT: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  DECLARED_BY_DOCTOR: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  FIR_PM_RECEIVED: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  CLAIM_BENEFIT_OPTION: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  OTHER_PLACE_OF_DEATH: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  BOND_TYPE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  EAGLE_DOC_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  EAGLE_MAKERCHECKER_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  EAGLE_RULE_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  POLICY_STATUS_REMARK: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  RECOVERY_PREMIUM_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  OLD_PTD: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  NEW_PTD: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  REINSURANCE_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  REINSURANCE_REMARK: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  RECOVERY_PREMIUM_REMARK: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  GRACE_PERIOD_REMARK_PRE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  GRACE_PERIOD_REMARK_SEC: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  SOURCE_HIT: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  CFS_HIT_COUNT: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  IIB_ENQUIRY_CHECK: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  REQ_LETTER_SENT: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  PARTIALPAYOUT_DECISION: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  PARTIALPAYOUT_REMARK: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  PARTIALPAYOUT_STATUS: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  PARTIALPAYOUT_CTM_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  PARTIALPAYOUT_CTM_STATUS: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  PARTIALPAYOUT_CTM_REMARK: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  PARTIALPAYOUT_CTM_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  PARTIALPAYOUT_ASS_ELIGIBLE: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  PARTIALPAYOUT_ASSESSMENT_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  PARTIALPAYOUT_APPROVER_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  PARTIALPAYOUT_CONFIRM_REMARK: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  LA_DATE_OF_INTIMATION: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  LA_DATE_OF_DEATH: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  LA_CAUSE_OF_DEATH: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  LA_REG_PARAM_CHECK: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  LA_RISK_CESSATION_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  REG_DETAILS_MISMATCH_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  REG_DETAILS_MISMATCH_PARAMETER: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  NEW_DATE_OF_DEATH: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  REVERSE_CLAIM_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  RE_REGISTER_CLAIM_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  ABNP_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  HALF_DEATH_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  COVID_DIAGNOSIS_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  COVID_HOSPITALIZATION_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  CTM_PICKED_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  APPROVER_NAME_CHIEF_OPERATION: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  APPROVAL_DATE_CHIEF_OPERATION: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  APPROVER_NAME_FINANCE_HEAD: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  APPROVAL_DATE_FINANCE_HEAD: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  DFP_UPLOAD_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  DFP_DOWNLOAD_FLAG: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  WHATSAPP_FLAG: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  SR_CALLOG: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  REMARK: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  PRODUCT_SUBTYPE: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ROLE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  STATUS: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  ASSIGNED_TO: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  CLAIMANT_ACUITY_DECISION: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'NOT FLAGGED',
  },
  PAYEE_ACUITY_DECISION: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'NOT FLAGGED',
  },
  FINAL_ACUITY_DECISION: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'NOT FLAGGED',
  },
}, {
  tableName: 'claims',
  timestamps: false
});

module.exports = Claim;