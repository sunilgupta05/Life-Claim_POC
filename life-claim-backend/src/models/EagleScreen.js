const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const EagleScreen = sequelize.define('EagleScreen', {
  CLAIM_ID: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true, // Set CLAIM_ID as the primary key
  },
  WITNESS_NAME_CDF: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  LA_MOBILE_NO: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CENTER_NAME: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CENTER_ADDRESS: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CENTER_CONTRACT_NO: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  DOCTOR_NAME: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  BANK_NAME: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CLAIMANT_MOBILE_NO: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ACC_NO: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ACCOUNT_OPENING_DATE: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  AGENT_NAME: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  AGENT_MOBILE_NO: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  AGENT_CODE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  OCC: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ORG_TYPE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  INCOME: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },

  // agent repudiation has only one fields so store here itself
  ADVISOR_HISTORY_COUNT: {
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
  }
}, {
  tableName: 'eagle_screen', // Match the table name in the database
  timestamps: false,
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = EagleScreen;
