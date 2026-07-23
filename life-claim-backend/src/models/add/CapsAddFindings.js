const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const CapsAddFindings = sequelize.define('CapsAddFindings', {
    seq_no: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    case_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    findings: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    remarks: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    rule: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    decision: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    severity: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    ailment_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    ailment_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    medical_records: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'medical_records'
    },
    type_of_evidence: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    created_on: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    created_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    modified_on: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    },
    modified_by: {
        type: DataTypes.STRING(50),
        allowNull: true,
    }
}, {
    tableName: 'caps_add_findings',
    timestamps: false
});

module.exports = CapsAddFindings;
