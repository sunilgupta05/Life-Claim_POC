const UploadedDocument = require('../models/UploadedDocuments')

const UploadedDocMatchList = async(claimId, documentType) => {
     const docvalue = await UploadedDocument.findAll({
        where:{
            claimId: claimId,
            //documentType: documentType
        }
    })
    console.log('UploadedDocumentsDao.js  docvalue >>:<<',claimId,  docvalue)
    return docvalue;
}

const UploadedDocumentCount = async(claimId, documentType, fileName) => {
    return UploadedDocument.count({
        where:{
            claimId: claimId,
            documentType: documentType,
            //fileName:fileName
        }
    })
}

const UploadedDocumentDetails = async(claimId) => {
    return UploadedDocument.count({
        where:{
            claimId: claimId,
            //documentType: documentType,
            //fileName:fileName
        }
    })
}

const AddUploadedDocument = async(claimNumber, fileName, documentType, alfrescoRepoId, nodeId) =>{
    const addNewRow = await UploadedDocument.create({
        claimId : claimNumber,
        fileName: fileName,
        documentType: documentType,
        alfrescoRepoId: alfrescoRepoId,
        AlfrescoFileId: nodeId,
        uploadedOn: new Date
    })
    console.log('UploadedDocumentDao.js >> AddUploadedDocument  > added: ', addNewRow.toJSON());
}


module.exports = {UploadedDocMatchList, UploadedDocumentCount, AddUploadedDocument, UploadedDocumentDetails}