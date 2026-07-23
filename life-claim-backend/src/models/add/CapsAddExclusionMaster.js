const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const CapsAddExclusionMaster = sequelize.define('CapsAddExclusionMaster', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    exclusion_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    exclusion_value: {
        type: DataTypes.STRING(255),
        allowNull: false,
    }
}, {
    tableName: 'caps_add_exclusion_master',
    timestamps: false
});

module.exports = CapsAddExclusionMaster;
