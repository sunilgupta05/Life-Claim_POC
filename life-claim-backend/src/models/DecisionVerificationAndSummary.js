const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const DecisionVerificationAndSummary = sequelize.define('DecisionVerificationAndSummary', {
    CLAIM_ID: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true, // Set CLAIM_ID as the primary key
    },
    STATUS: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    DATE: {
        type: DataTypes.DATE, // Store date values
        allowNull: true,
    },
    VERIFIER_ID: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    REMARKS: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    TOTAL_NON_RISK_AMOUNT: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    TOTAL_RISK_SA: {
        type: DataTypes.DECIMAL(15, 2),
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
    tableName: 'decision_verification_and_summary', // Match the table name in the database
    timestamps: false,
    freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = DecisionVerificationAndSummary;
