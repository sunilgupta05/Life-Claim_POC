const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ContactDetail = sequelize.define('ContactDetail', {
  CLAIM_ID: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true, // Set CLAIM_ID as the primary key
  },
  SUSPICIOUS_DETAILS: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  APP_NO: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  POLICY_NO: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  PRODUCT_NAME: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  PRODUCT_CODE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CDF_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  TEL_NO: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  POLICY_AGE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  MOBILE_NO_CHANGE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  EMAIL_ID_CHANGE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  POLICY_AGE1: {
    type: DataTypes.DECIMAL(20,2),
    allowNull: true,
  },
  EKIT_PRINTED: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  EKIT_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  NAME_CHANGE_DECL: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  KNOWN_TO_LIFE_ASR: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  PROP_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  RELN: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  OUTSTANDING_LOAN_SCHED: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ISSUE_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  CLAIMS_RUPIDIATE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  OUTSTANDING_LOAN_NO_C: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  PAID_TO_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  RCD: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  RISK_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  PREM_FREQ: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  TERM: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  PREM_STATUS: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  PREM_PAID_YRS: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  FIRST_PREM_DEP: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  TOTAL_PREM_PAID: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  ORIGINAL_SA: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  CURRENT_SA: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  AVAILABLE_SA: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  ACTUAL_VALUE: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  ESTIMATED_VALUE: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  MATURITY_VALUE: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  GUAR_FUND: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CLAIM_STATUS: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CASH_VALUE: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  CUST_INDICATOR: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  EXCESS_PREM: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  FIN_POST: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  OUTSTANDING_LOAN: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  ADVISOR_CODE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  MEDICAL_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  MED_TRIG: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  MALPRACTICE_CODE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ADVOCATE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ADVISOR_STATUS: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ASSIGNMENT: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  SALES_CHANNEL: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  UM_CODE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  UW_DEC: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  UW_DEC_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  RES_XRT: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  MED_CODE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  IND_CODE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  IND_DESC: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  AGENT_TYPE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  AGENT_TYPE_DESC: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  STAT_CODE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  BASE_COMPONENT: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CREATED_BY:{
    type: DataTypes.STRING,
    allowNull: true,
  },
  CREATED_AT:{
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  MODIFIED_BY:{
    type: DataTypes.STRING,
    allowNull: true
  },
  MODIFIED_AT:{
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate : DataTypes.NOW
  },

  
}, {
  tableName: 'contact_details', // Match the table name in the database
  timestamps: false,
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = ContactDetail;
