const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const LifeAssuredDetail = sequelize.define('LifeAssuredDetail', {
  CLAIM_ID: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true, // Set CLAIM_ID as the primary key
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
  GENDER: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Male',
  },
  MARITAL_STATUS: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  RES_STATUS: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  HNI_FLAG: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  STATUS: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  TYPE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  EDUCATION: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  RISK_INDICATOR: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  QUALIFICATION: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  AGE_PROOF: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Indian',
  },
  AGE_DESC: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ID_PROOF: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ID_NUMBER: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  AGE_AT_DEATH: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  FLAT1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ROAD1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  AREA1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CITY1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  STATE1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  PINCODE1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  TEL_NO1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  MOBILE_NO1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  EMAIL_ID1: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  EST_NAME: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  SL: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  EMAIL: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  OCC_CATEGORY: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  OCC_DESC: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  INCOME: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  NATURE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  REMARKS: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  DESIGNATION: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  FLAT2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ROAD2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  AREA2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CITY2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  STATE2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  PINCODE2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  TEL_NO2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  MOBILE_NO2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  EMAIL_ID2: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CREATED_AT:{
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  CREATED_BY:{
    type: DataTypes.STRING,
    allowNull: true
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
  tableName: 'life_assured_details', // Match the table name in the database
  timestamps: false,
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = LifeAssuredDetail;
