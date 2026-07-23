const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Adjust the path to your Sequelize configuration

const Telecalling = sequelize.define('Telecalling', {
    TELECALLING_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    CLAIM_ID: {
        type: DataTypes.STRING(200),
        allowNull: false,
        primaryKey: true,
    },
    REASON: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    CALL_TO: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    THE_DATE: {
        type: DataTypes.DATEONLY, // Matches the DATE type in SQL
        allowNull: true,
    },
    OUTCOME: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    CALL_BY: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    DETAILS: {
        type: DataTypes.STRING(4000),
        allowNull: true,
    },
    CREATED_ON: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    CREATED_BY: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    MODIFIED_ON: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW, // Set default to the current timestamp
        onUpdate: DataTypes.NOW, // Ensures it updates automatically on changes
    },
    MODIFIED_BY: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
}, {
    tableName: 'telecalling', // Table name in SQL
    timestamps: false, // Disable Sequelize's automatic timestamp fields
});

module.exports = Telecalling;