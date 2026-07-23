const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ReqCommonDetails = sequelize.define('ReqCommonDetails', {
  REQ_MAPPING_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
   
  },
  CLAIM_ID: {
    type: DataTypes.STRING(200),
    allowNull: false,
    primaryKey: true,
  },
  REQUIREMENT_TYPE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  REQUIREMENT_NAME: {
    type: DataTypes.STRING(400),
    allowNull: true,
  },
  SOURCE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  TRIGGERED_BY: {
    type: DataTypes.STRING(400),
    allowNull: true,
  },
  TRIGGER_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  STATUS: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  RECEIPT_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  REMARKS: {
    type: DataTypes.STRING(400),
    allowNull: true,
  },
  DOC_UPLOADED: {
    type: DataTypes.STRING(400),
    allowNull: true,
  },
  DOCUMENT_PATH: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  BASE_LDR: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  KYC_LDR: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  RIDER_LDR: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  UPLOAD: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  CREATED_ON: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Default to the current timestamp
  },
  CREATED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  MODIFIED_ON: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Default to the current timestamp
    onUpdate: DataTypes.NOW, // Update timestamp on modification
  },
  MODIFIED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  TYPE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  REQ_FLAG: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  DOC_LDR: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  RECEIVED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  REQUIREMENT_CATEGORY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  MILESTONE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  INTERNALORCUSTOMER: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  REQUIREMENT_DOC_TYPE: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  LEDRD: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
}, {
  tableName: 'common_and_rider_details', // Specify the table name explicitly
  timestamps: false, // Disable Sequelize's automatic timestamps
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = ReqCommonDetails;
