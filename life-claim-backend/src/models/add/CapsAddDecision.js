const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize'); 

const CapsAddDecision = sequelize.define('CapsAddDecision', {
    decision_id : {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true,
    },
    case_id : {
        type : DataTypes.INTEGER,
        allowNull : true,
    },
    policy_number : {
        type : DataTypes.STRING(20),
        allowNull : true,
    },
    rule : {
        type : DataTypes.STRING(50),
        allowNull : true,
    },
    final_decision : {
        type : DataTypes.STRING(50),
        allowNull : true,
    },
    scn_sent : {
        type : DataTypes.STRING(20),
        allowNull : true,
    },
    add_case_remarks : {
        type : DataTypes.TEXT,
        allowNull : true,
    },
    scn_date : {
        type : DataTypes.DATEONLY,
        allowNull : true,
    },
    scn_aging : {
        type : DataTypes.INTEGER,
        allowNull : true,
    },
    scn_received : {
        type : DataTypes.STRING(20),
        allowNull : true,
    },
    scn_decision : {
        type : DataTypes.STRING(20),
        allowNull : true,
    },
    sddr_date : {
        type : DataTypes.DATEONLY,
        allowNull : true,
    },
    sddr_received : {
        type : DataTypes.STRING(20),
        allowNull : true,
    },
    sddr_decision : {
        type : DataTypes.STRING(20),
        allowNull : true,
    },
    created_by : {
        type : DataTypes.STRING(20),
        allowNull : true,
    },
    created_on : {
        type : DataTypes.DATE,
        allowNull : true,
        defaultValue: DataTypes.NOW,
    },
    modified_by : {
        type : DataTypes.STRING(20),
        allowNull : true,
    },
    modified_on : {
        type : DataTypes.DATE,
        allowNull : true,
    }
}, {
    tableName: 'caps_add_decision',
    timestamps: false
});

module.exports = CapsAddDecision;
