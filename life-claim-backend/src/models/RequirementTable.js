const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const RequirementTable = sequelize.define('RequirementTable', {
  CLAIM_ID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  REQUIREMENT_NAME1: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  REQUIREMENT_TYPE1: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  SOURCE1: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  STATUS1: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  TRIGGERED_BY1: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  TRIGGER_DATE1: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  RECEIPT_DATE1: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  CREATED_AT: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  CREATED_BY: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  MODIFIED_AT: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  MODIFIED_BY: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  tableName: 'requirement_table', // Ensure this matches your SQL table name
  timestamps: false, // Disable automatic timestamps
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = RequirementTable;
