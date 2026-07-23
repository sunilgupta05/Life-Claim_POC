const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Requirement = sequelize.define('Requirement', {
  REQ_MAPPING_ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  CLAIM_ID: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  REQUIREMENT_TYPE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  REQUIREMENT_NAME: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  SOURCE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  TRIGGERED_BY: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  TRIGGERED_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  STATUS: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  RECEIPT_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  REMARKS: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  DOC_UPLOADED: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  DOCUMENT_PATH: {
    type: DataTypes.STRING(255),
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
  RIDER_LDR: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  UPLOAD: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  CREATED_ON: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  CREATED_BY: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  MODIFIED_ON: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  MODIFIED_BY: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  TYPE: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  REQ_FLAG: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  MANDATORY_DOC_LDR: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  RECEIVED_BY: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  REQUIREMENT_CATEGORY: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  MILESTONE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  INTERNALORCUSTOMER: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  REQUIREMENT_DOC_TYPE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  LEDRD: {
    type: DataTypes.STRING(50),
    allowNull: true,
  }
}, {
  tableName: 'Requirements',
  timestamps: false,
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = Requirement;
