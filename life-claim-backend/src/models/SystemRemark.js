const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize'); // Adjust the path to your Sequelize configuration

const SystemRemark = sequelize.define('SystemRemark', {
    REM_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true, // Matches AUTO_INCREMENT in SQL
    },
    SL_NO: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    CLAIM_ID: {
        type: DataTypes.STRING(200),
        allowNull: false,
        primaryKey: true,
      },
    REM_DATE: {
        type: DataTypes.DATEONLY, // Matches DATE type in SQL
        allowNull: true,
    },
    REMARKS: {
        type: DataTypes.STRING(1000),
        allowNull: true,
    },
    SCORE: {
        type: DataTypes.STRING(200),
        allowNull: true,
    },
    CLAIM_ID: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    RESPONSE: {
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
}, {
    tableName: 'system_remark', // Table name in SQL
    timestamps: false, // Disable Sequelize's automatic timestamp fields
});

module.exports = SystemRemark;
