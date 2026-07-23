const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize'); 

const CapsAddDetails = sequelize.define('CapsAddDetails', {
    case_id : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    policy_number:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    krn : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    source : {
        type : DataTypes.STRING,
        allowNull: true,
    },
    referral_date : {
        type : DataTypes.DATE,
        allowNull: true,
    },
    initiation_date : {
        type : DataTypes.DATE,
        allowNull: true
    },
    case_status : {
        type : DataTypes.STRING,
        allowNull: true,
    },
    exclusion_type_rule : {
        type: DataTypes.STRING,
        allowNull: true,
    },
    initiation_remarks : {
        type: DataTypes.STRING(500),
        allowNull : true,
    },
    created_by :{
       type: DataTypes.STRING,
       allowNull: true, 
    },
    created_on: {
        type : DataTypes.DATE,
        allowNull : true,
    },
    modified_by: {
        type : DataTypes.STRING,
        allowNull : true,
    },
    modified_on: {
        type : DataTypes.DATE,
        allowNull : true,
    },
    to_be_refer : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    iris_status :{
        type : DataTypes.STRING,
        allowNull : true,
    },
    assigned_to : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    assigned_by : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    refresh_la_flag : {
        type : DataTypes.INTEGER,
        allowNull : true,
    }
}, {
    tableName: 'caps_add_details', // Match lowercase table name
    timestamps: false, 
});

module.exports = CapsAddDetails;
