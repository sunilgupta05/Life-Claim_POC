const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const DecisionSystem = sequelize.define('DecisionSystem', {
    CLAIM_ID: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true, // Set CLAIM_ID as the primary key
    },
    DECISION1: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    REASON1: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    REMARKS1: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    DECISION2: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    REASON2: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    REMARKS2: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    BASE: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    ADBRSA: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    TOTAL_PREM_PAID: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    REFUND: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    FUND: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    ABRSA: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    OT_BONUS: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    PARTIAL_WDWT: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    INTERIM: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    LTARSA: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    LOAN_NOC: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    REV_BONUS: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    GA: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    IBRSA: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    PREMIUM_OTS: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    INTEREST: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    PPYRSA: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    MSARSA: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    EXCESS_PREMIUM: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    PENAL_INTEREST: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    CIBRSA: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    OTS_LOAN: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    TERMINAL_BONUS: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    CUSTOMER: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    BANK: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    DECISION_AGEING: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    TOTAL_AMT_PAYABLE: {
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
  },

}, {
    tableName: 'decision_system', // Match the table name in the database
    timestamps: false,
    freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = DecisionSystem;
