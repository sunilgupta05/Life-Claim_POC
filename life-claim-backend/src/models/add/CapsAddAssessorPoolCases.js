const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const CapsAddAssessorPoolCases = sequelize.define('CapsAddAssessorPoolCases', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    case_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    application_no: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    policy_no: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    ksn: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    source: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    referral_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    trigger_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    case_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    is_excluded: {
        type: DataTypes.CHAR(1),
        allowNull: true,
        validate: {
            isIn: [['Y', 'N']]
        }
    },
    exclusion_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    irss_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    sch_aging: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    product_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    policy_status: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    base_sa: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    city: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    state: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    pincode: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
    batch_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'caps_add_assessor_pool_cases',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['case_id', 'batch_id']
        }
    ]
});

module.exports = CapsAddAssessorPoolCases;
