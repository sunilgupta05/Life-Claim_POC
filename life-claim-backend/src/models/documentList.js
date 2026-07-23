const DataTypes = require('sequelize')
const sequelize = require('../config/sequelize');

const DocumentList = sequelize.define('DocumentList', {
    documentListId : {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    documentType : {
        type:DataTypes.STRING,
        allowNull: false,
    },
    createdBy : {
        type:DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'DocumentList',
    timestamps: false
})

module.exports = DocumentList