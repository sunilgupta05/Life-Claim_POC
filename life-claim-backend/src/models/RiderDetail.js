const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Adjust the path to your Sequelize configuration

const RiderDetail = sequelize.define('RiderDetail', {
    RIDER_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true, // Matches AUTO_INCREMENT in SQL
    },
    CLAIM_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    POLICY_ID: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    RIDER_CODE: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RIDER_SA: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RIDER_RCD: {
        type: DataTypes.DATEONLY, // DATE type in SQL
        allowNull: true,
    },
    RIDER_TERM: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RIDER_STATUS: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    DECISION_PRI: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    DECISION_SEC: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    DECISION_REASON_PRI: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    DECISION_REASON_SEC: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    DECISION_REMARKS_PRI: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    DECISION_REMARKS_SEC: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    DECISION_CLAUSE: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    CREATEDON: {
        type: DataTypes.DATE, // TIMESTAMP in SQL
        allowNull: true,
        defaultValue: DataTypes.NOW, // Default to current timestamp
    },
    CREATEDBY: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    MODIFIEDON: {
        type: DataTypes.DATE, // TIMESTAMP in SQL
        allowNull: true,
        defaultValue: DataTypes.NOW, // Default to current timestamp
        onUpdate: DataTypes.NOW, // Automatically updates to the current timestamp on each update
    },
    MODIFIEDBY: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RIDER_COMPONENT_CODE: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RIDER_AVAILABLE_SA: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    RIDER_NAME: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RIDER_PREMIUM: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    CASE_ID: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RIDER_INTERIM_BONUS: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    RIDER_REVISIONARY_BONUS: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RIDER_FIRSTIBR_INSTALLMENT: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RIDER_ELIGIBILITY: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    RIDER_AMOUNT_PAID: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    BRE_RIDER_CODE: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    RIDER_ACTIVE: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    RIDER_CESSATION_DATE: {
        type: DataTypes.DATEONLY, // DATE type in SQL
        allowNull: true,
    },
    RIDER_CODE_SA: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
}, {
    tableName: 'rider_details', // Table name in SQL
    timestamps: false, // Disable Sequelize's automatic timestamp fields
});

module.exports = RiderDetail;
