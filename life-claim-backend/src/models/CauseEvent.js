const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const CauseEvent = sequelize.define('CauseEvent', {
  CLAIM_ID: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true, 
  },
  TYPE_OF_CLAIM: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CAUSE_CODE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CAUSE_DESCRIPTION: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CAUSE_CATEGORY: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CAUSE_OF_CLAIM: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  IF_OTHERS_SPECIFY: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  DATE_OF_EVENT: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  POL_STATUS_ON_EVENT: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CLAIM_SUB_TYPE: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  CLAIM_REGISTRATION_TYPE: {
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
  tableName: 'cause_event',
  timestamps: false,
  // Ensure no 'id' column is automatically added
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = CauseEvent;
