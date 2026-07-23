const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Adjust the path based on your setup

const SystemAssessorRemark = sequelize.define('system_assessor_remark', {
  CLAIM_ID: {
    type: DataTypes.STRING(255),
    allowNull: true,
    primaryKey: true
  },
  CASE: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  UPDATE: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  CASE_REASON: {
    type: DataTypes.TEXT,
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
  tableName: 'system_assessor_remark', // Explicitly set the table name
  timestamps: false // Disable automatic timestamp fields
});

module.exports = SystemAssessorRemark;