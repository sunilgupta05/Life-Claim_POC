const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Adjust the path to your Sequelize configuration

const CaseTrigger = sequelize.define('CaseTrigger', {
    CASE_TRIGGER_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true, 
    },
    CLAIM_ID: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    REASON: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    REMARKS: {
        type: DataTypes.STRING(4000),
        allowNull: true,
    },
    THE_DATE: {
        type: DataTypes.DATEONLY, // Matches DATE type in SQL
        allowNull: true,
    },
    TRIGGERED_TO: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    STATUS: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    CREATEDON: {
        type: DataTypes.DATE, // TIMESTAMP in SQL
        allowNull: true,
        defaultValue: DataTypes.NOW, // Default to current timestamp
    },
    CREATEDBY: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    MODIFIEDON: {
        type: DataTypes.DATE, // TIMESTAMP in SQL
        allowNull: true,
        defaultValue: DataTypes.NOW, // Default to current timestamp
        onUpdate: DataTypes.NOW, // Automatically updates to the current timestamp on each update
    },
    MODIFIEDBY: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    DDU_SR_CALL_LOG: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
}, {
    tableName: 'case_trigger', // Table name in SQL
    timestamps: false, // Disable Sequelize's automatic timestamp fields
});

module.exports = CaseTrigger;