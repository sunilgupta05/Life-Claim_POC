const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Adjust the path to your Sequelize configuration

const ParallelPolicy = sequelize.define('ParallelPolicy', {
    PARALLEL_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,
        // primaryKey: true,
        // autoIncrement: true, // Matches AUTO_INCREMENT in SQL
    },
    POLICY_NUMBER: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RCD: {
        type: DataTypes.DATEONLY, // DATE type in SQL
        allowNull: true,
    },
    PRODUCT_CODE: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    CURRENT_SA: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    FUND_VALUE: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    POLICY_STATUS: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RIDER_CODE: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RIDER_SA: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    LINKED: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    CLIENT_ID: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    CASE_ID: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    CLAIM_ID: {
        type: DataTypes.STRING(20),
        allowNull: true,
        primaryKey: true
    },
    CLAIM_STATUS: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    DELINKED_REASON: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    POLICY_LIFE_HEALTH: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    CLAIM_TYPE: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    LANAME: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    LAID: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    BASE_LDR: {
        type: DataTypes.DATEONLY, // DATE type in SQL
        allowNull: true,
    },
    KYC_LDR: {
        type: DataTypes.DATEONLY, // DATE type in SQL
        allowNull: true,
    },
    DOB: {
        type: DataTypes.DATEONLY, // DATE type in SQL
        allowNull: true,
    },
    CASE_ID_NEW: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    CURR_CASE_ID: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    CLAIM_APPLICABILITY_PRE: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    CLAIM_APPLICABILITY_SEC: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    REMARKS_PRE: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    REMARKS_SEC: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    CALL_LOG: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
}, {
    tableName: 'parallel_policies', // Table name in SQL
    timestamps: false, // Disable Sequelize's automatic timestamp fields
});

module.exports = ParallelPolicy;