const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');


const IncomeDetails = sequelize.define('IncomeDetails', {
  CLAIM_ID: {
    type: DataTypes.STRING(200),
    allowNull: false,
    primaryKey: true, // Set CLAIM_ID as the primary key
  },
  INCOME_ID: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  PROOF_ID: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  ISSUE_DATE: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  EMAIL_ID: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  MOBILE_NO: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  SEQ_NO: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  CREATED_ON: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  MODIFIED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  MODIFIED_ON: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW,
  },
  CREATED_BY: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  FINANCIAL_YEAR: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  INSTANCE_NO: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  PROOF_SEQ_NO: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
}, {
  tableName: 'income_details', // Specify the table name explicitly
  timestamps: false, // Disable Sequelize's automatic timestamps
  freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = IncomeDetails;
