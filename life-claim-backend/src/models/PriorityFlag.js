const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Adjust the path to your Sequelize configuration

const PriorityFlag = sequelize.define('PriorityFlag', {
    PRIORITY_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true, // Matches AUTO_INCREMENT in SQL
    },
    SOURCE: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    CLAIM_ID: {
        type: DataTypes.STRING(20),
        allowNull: false,
        primaryKey: true,
      },
    REASON: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    REMARKS: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    USER_ID: {
        type: DataTypes.STRING(50),
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
}, {
    tableName: 'caps_priority_master', // Table name in SQL
    timestamps: false, // Disable Sequelize's automatic timestamp fields
});

module.exports = PriorityFlag;
