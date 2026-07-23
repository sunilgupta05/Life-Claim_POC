const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const DecisionAccessor = sequelize.define('DecisionAccessor', {
    CLAIM_ID: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    DECISION: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    DECISION_REASON: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    REQ_LETTER_SENT: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    REMARKS: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    BASE: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    FUND: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    INTERIM: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    GA: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    OT_BONUS: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    EXCESS_PREMIUM: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    TERMINAL_BONUS: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    REV_BONUS: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    INTEREST: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    PENAL_INTEREST1: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    ADBRSA: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    REQ_DAMT: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    LTARSA: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    PARTIAL_WDWT: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    PPYRSA: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    IBRSA: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    MSARSA: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    CIBRSA: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    ABRSA: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    OTS_LOAN: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    LOAN_NOC: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    PREMIUM_OTS: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    ANNUITY_PAYOUT_REMARK: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    PAYOUT_REMARKS: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    DECISION_AGEING: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    DECISION_AGING_REMARK: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    TOTAL_AMT_PAYABLE: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    PP_AMT1: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    PP_AMT2: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    REFUND: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    INTEREST2: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    CUSTOMER: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    BANK_MPHASIGNEE: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    TOTAL_PREMIUM: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    EXGRATIA: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    PENAL_INTEREST2: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    CREATED_BY: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    CREATED_AT: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    MODIFIED_BY: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    MODIFIED_AT: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        onUpdate: DataTypes.NOW,
    },
}, {
    tableName: 'decision_accessor', // Match the table name in the database
    timestamps: false,
    freezeTableName: true, // Prevent Sequelize from pluralizing the table name
});

module.exports = DecisionAccessor;
