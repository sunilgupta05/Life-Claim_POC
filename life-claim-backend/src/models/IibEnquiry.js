const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');


const IibEnquiry = sequelize.define('IibEnquiry', {
  SEQ_NO: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  CLAIM_ID: {
    // Must stay primaryKey: without a declared PK, Sequelize injects an implicit
    // `id` column that does not exist in iib_enquiry, so create() fails with
    // "Unknown column 'id'" and rolls back the whole register-claim transaction.
    type: DataTypes.STRING(20),
    allowNull: false,
    primaryKey: true,
  },
  TRANSACTION_ID: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  INPUT_PROPOSAL_POLICY_NO: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  QUESTDBNO: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  INPUT_MATCHING_PARAMETER: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  QUEST_DOP_DOC: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  QUEST_SUM_ASSURED: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  QUEST_POLICY_STATUS: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  QUEST_DATE_OF_EXIT: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  QUEST_DATE_OF_DEATH: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  QUEST_CAUSE_OF_DEATH: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  QUEST_RECORD_LAST_UPDATED: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  QUEST_ENTITY_CAUTION_STATUS: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  QUEST_INTERM_CAUTION_STATUS: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  QUEST_COMPANY_NUMBER: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  IS_NEGATIVE_MATCH: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  CREATED_ON: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  MODIFIED_BY: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  MODIFIED_ON: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  CREATED_BY: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  PRODUCT_TYPE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  LINKED_NONLINKED: {
    type: DataTypes.STRING(2000),
    allowNull: true,
  },
  MEDICAL_NONMEDICAL: {
    type: DataTypes.STRING(2000),
    allowNull: true,
  },
  WHETHER_STANDARD_LIFE: {
    type: DataTypes.STRING(2000),
    allowNull: true,
  },
  REASON_FOR_DECLINE: {
    type: DataTypes.STRING(2000),
    allowNull: true,
  },
  REASON_FOR_POSTPONE: {
    type: DataTypes.STRING(2000),
    allowNull: true,
  },
  REASON_FOR_REPUDIATION: {
    type: DataTypes.STRING(2000),
    allowNull: true,
  },
  // Manual "IIB Enquiry" sub-tab (Registration → Assessment tab) — separate from the
  // QUEST_* automated-bureau-lookup fields above.
  IIB_REF_NO: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  IIB_ENQUIRY_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  IIB_STATUS: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  IIB_POLICIES_FOUND: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  IIB_TOTAL_SA: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: true,
  },
  IIB_FRAUD_FLAG: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  IIB_MULTIPLE_POLICY: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  IIB_NON_DISCLOSURE: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  IIB_REMARKS: {
    // TEXT (not VARCHAR(2000)) — the table already carries six VARCHAR(2000)
    // columns, so an inline VARCHAR(2000) here overflows InnoDB's 65535-byte
    // row limit. TEXT stores off-page and holds the free-text enquiry findings.
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'iib_enquiry', // Specify the table name explicitly
  timestamps: false, // Disable Sequelize's automatic timestamps
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = IibEnquiry;
