const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ClaimantDetail = sequelize.define('ClaimantDetail', {
  CLAIM_ID: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true, 
  },
  NAME: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CLIENT_ID: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  DOB: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  AGE: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  GENDER: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Male',
  },
  RISK_INDICATOR: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ROLE: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Proposer',
  },
  RELATION_WITH_LIFE_ASR: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ID_NUMBER: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  COUNTRY: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'ALGERIA (E Da)',
  },
  STATE: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Andaman and Nico',
  },
  PINCODE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  NATIONALITY: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Indian',
  },
  OCCUPATION: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  PAN_NO: {
    type: DataTypes.STRING(25),
    allowNull: true,
  },
  EMAIL_UNAVAILABILITY_REASON: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Email ID is not available',
  },
  IS_POLITICALLY_EXPOSED: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Yes',
  },
  ROAD: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  EMAIL_ID: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  MOBILE_NO: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  OTHER_MOBILE_NO: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  AREA: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CITY: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  TEL_NO: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  PAN_VALID_FLAG: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  FLAT: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ACCUITY_RISK_INDICATOR: {
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
  tableName: 'claimant_details', // Match the table name in the database
  timestamps: false,
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = ClaimantDetail;
