const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const CapsAddRawData = sequelize.define('CapsAddRawData', {
    seq_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    policy_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    source: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    referral_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    initiation_remarks: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    processed_flag: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0, // 0: Pending, 1: Success, 2: Failed
    },
    created_by: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    created_on: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    modified_by: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    modified_on: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'caps_add_raw_data',
    timestamps: false,
});

module.exports = CapsAddRawData;
