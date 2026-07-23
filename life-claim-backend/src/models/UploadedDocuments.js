const DataTypes = require('sequelize')
const sequelize = require('../config/sequelize')

const UploadedDocuments = sequelize.define('UploadedDocument', {
    documentId:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    claimId:{
        type:DataTypes.STRING,
        allowNull:true
    },
    fileName:{
        type:DataTypes.STRING,
        allowNull:true
    },
    documentType:{
        type:DataTypes.STRING,
        allowNull:true
    },
    alfrescoRepoId:{
        type:DataTypes.STRING,
        allowNull:true
    },
    uploadedOn:{
        type:DataTypes.DATE,
        allowNull:true
    },
    createdby:{
        type:DataTypes.STRING,
        allowNull:true
    },
    AlfrescoFileId:{
        type:DataTypes.STRING,
        allowNull:true
    }
}, {
    tableName:'UploadedDocuments',
    timestamps:false
})

module.exports = UploadedDocuments;