const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Adjust the path as necessary

const IntimationDetails = sequelize.define('intimation_details', {
  CLAIM_ID: {
    type: DataTypes.STRING(255),
    allowNull: false,
    primaryKey: true
  },
  CLAIM_TYPE: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  POLICY_STATUS: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  INTIMATION_TYPE: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  INITIATION_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  INTIMATION_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  SOURCE: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  FIR_PM_RECEIVED: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  BOND_TYPE: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  WHATSAPP_FLAG: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  DECLARED_BY_DOCTOR: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  PORTFOLIO: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  LIFE_ASR_STATUS: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  DATE_OF_DEATH_EVENT: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  DATE_OF_DEATH_REG: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  DATE_OF_CREMATION: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  TRANSACTION_STATUS: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  INITIAL_POLICY_STATUS: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  DATE_OF_ACCIDENT: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  PLACE_OF_DEATH_TI: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  POLICY_STATUS_ON_DODDOE: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  POLICY_STATUS_EDIT_REMARK: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  DEATH_CERTIFICATE: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  DEATH_CERTIFICATE_REG_NUMBER: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  DEATH_CERTIFICATE_REG_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  DEATH_CERTIFICATE_ISSUE_DISTRICT: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  DEATH_CERTIFICATE_ISSUING_AUTHORITY: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  DEATH_CERTIFICATE_ISSUE_TEHSIL: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  DEATH_CERTIFICATE_ISSUE_STATE: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  PLACE_OF_DEATH_ON_DC: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  DEATH_CERTIFICATE_ISSUE_VILLAGE_BLOCK: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  DEATH_CERTIFICATE_ISSUING_OFFICER_POSITION: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  CREATED_BY: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  CREATED_AT: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  MODIFIED_BY: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  MODIFIED_AT: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'intimation_details', // Set the table name explicitly
  timestamps: false // Disable automatic timestamps
});

module.exports = IntimationDetails;
