const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const CapsAddDecisionMaster = sequelize.define('CapsAddDecisionMaster', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    findings: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    remarks: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    rule: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    decision: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    severity: {
        type: DataTypes.STRING(50),
        allowNull: true,
    }
}, {
    tableName: 'caps_add_decision_master',
    timestamps: false
});

module.exports = CapsAddDecisionMaster;
