const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Adjust the path as per your project structure

const StatusHistory = sequelize.define('StatusHistory', {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    CLAIM_NUMBER: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    POLICY_NUMBER: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    MODIFIED_BY: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    MODIFIED_ON: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    CREATED_ON: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Default to the current timestamp
      },
    CREATED_BY: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    STATUS: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    DECISION:{
        type: DataTypes.STRING(255),
        allowNull:true
    },
    REMARKS:{
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'STATUS_HISTORY',
    timestamps: false, 
});

module.exports = StatusHistory;