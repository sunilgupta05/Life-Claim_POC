const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize'); 

const CapsAddContractDetails = sequelize.define('CapsAddContractDetails', {
    contract_id : {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true,
    },
    case_id : {
        type : DataTypes.INTEGER,
        allowNull : false,
    },
    app_no : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    policy_no : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    product_name : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    product_code : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    policy_duration : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    rcd : {
        type : DataTypes.DATE,
        allowNull : true,
    },
    pad : {
        type : DataTypes.STRING, // Changed to STRING to match varchar(30) in screenshot
        allowNull : true,
    },
    fid : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    adbr_sa : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    ci_sa : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    premium_frequency : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    premium_amount : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    premiums_paid : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    annual_premium : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    channel_9 : { // Fixed typo: channal -> channel
        type : DataTypes.STRING,
        allowNull : true,
    },
    channel_4 : { // Fixed typo: channal -> channel
        type : DataTypes.STRING,
        allowNull : true,
    },
    agent_category : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    agent_fsc_code : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    agent_fsc_name : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    um_sm_code : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    um_sm_name : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    agent_active_not_active : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    uw_decision : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    biu_output : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    nb_risk_done : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    medicals_done : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    pvv_done : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    experian_credit_score : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    policy_status :{
        type : DataTypes.STRING,
        allowNull : true,
    },
    agent_stat_code : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    base_sa : {
        type : DataTypes.INTEGER,
        allowNull : true,
    }
}, {
    tableName: 'caps_add_contract_details',
    timestamps: false
});

module.exports = CapsAddContractDetails;
