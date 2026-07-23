const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); 

const PayeeDetail = sequelize.define('PayeeDetail', {
  CLAIM_ID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  NAME: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  LAST_NAME: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CLIENT_ID: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  DOB: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  GENDER: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  ROLE: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  RISK_INDICATOR: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ID_NUMBER: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  RELATION_WITH_LIFE_ASR: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  STATUS: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  PAN_NO: {
    type: DataTypes.STRING(25),
    allowNull: true,
  },
  PAN_VALIDITY_FLAG: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  UPDATE_PAYEE: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  FLAT: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ROAD: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  AREA: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  STATE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  COUNTRY: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  NATIONALITY: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  PIN_CODE: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  CITY: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  TEL_NO: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  MOBILE_NO: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  EMAIL_ID: {
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
  tableName: 'payee_details',
  timestamps: false, 
});


module.exports = PayeeDetail;
