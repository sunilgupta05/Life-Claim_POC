const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const SafePincode = sequelize.define('safe_pincode', {
    pincode_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        primaryKey: true,
        autoIncrement: true,
    },
    pincode: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
},{
    timestamps:false
});

module.exports = SafePincode;