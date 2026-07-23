const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize'); 

const CapsAddLifeAssuredDetails = sequelize.define('CapsAddLifeAssuredDetails', {
    seq_no : {
        type : DataTypes.INTEGER,
        autoIncrement : true,
        primaryKey : true,
    },
    case_id : {
        type : DataTypes.INTEGER,
        allowNull : false,
    },
    name : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    client_id : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    dob : {
        type : DataTypes.DATE,
        allowNull : true,
    },
    age : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    gender : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    res_status : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    income : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    occupation : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    education : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    city : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    state : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    pan_no : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    mobile_no : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    created_by : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    created_on : {
        type : DataTypes.DATE,
        allowNull : true,
    },
    modified_by : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    modified_on : {
        type : DataTypes.DATE,
        allowNull : true,
    },
    pincode : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    flat : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    road : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    area : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    occupation_desc : {
        type : DataTypes.STRING,
        allowNull : true,
    }
}, {
    tableName: 'caps_add_life_assured_details',
    timestamps: false
});

module.exports = CapsAddLifeAssuredDetails;
