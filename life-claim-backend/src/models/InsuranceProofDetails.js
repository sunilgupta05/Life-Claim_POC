const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');


const InsuranceProofDetails = sequelize.define('InsuranceProofDetails', {
  CLAIM_ID: {
    type: DataTypes.STRING(200),
    allowNull: false,
    primaryKey:true
  },
  PROOF_TYPE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  DOCUMENT_TYPE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  ISSUE_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  DOCUMENT_ID: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  IS_LETTER_SUBMITTED: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  LETTER_NAME: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  DESIGNATION: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  SIGNATURE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  AGE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  RATION_CARD_TYPE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  MEMBERS: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  SEQ_NO: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  CREATED_ON: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  CREATED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  MODIFIED_ON: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  MODIFIED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  DOB: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  MOBILE_NO: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  MILESTONE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  RATION_CARD_NO: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  OTHER_PHOTOID: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  CATEGORY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  AADHAAR_MATCH: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  CLIENT_ID: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  PAN_VALIDITY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  PAN_VALIDITY_CODE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  PAN_HOLDER_NAME: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  FATHER_NAME: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  USER_FLAG: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  PAN_STATUS: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  PAN_NAME_MATCH: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  DOB_MATCH: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
}, {
  tableName: 'proof_details', // Match the table name in the database
  timestamps: false,
  freezeTableName: true,
});

module.exports = InsuranceProofDetails;
