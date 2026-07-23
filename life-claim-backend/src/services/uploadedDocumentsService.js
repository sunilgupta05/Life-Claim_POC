const UploadedDocumentDoa = require('../dataAccess/uploadedDocumentsDao')

const UploadedDocumentServiceList = async(claimId) =>{
    console.log('UploadedDocumentsService.js >>:<<', claimId);
    return UploadedDocumentDoa.UploadedDocMatchList(claimId);
};

const UploadedDocumentDetailsService = async(claimId, documentType, fileName) =>{
    return UploadedDocumentDoa.UploadedDocumentCount(claimId);
};

const UploadedDocumentServiceMatchCount = async(claimId, documentType, fileName) =>{
    return UploadedDocumentDoa.UploadedDocumentCount(claimId, documentType,fileName);
};

const AddUploadedDocumentService = async(claimNumber, fileName, documentType, alfrescoRepoId, nodeId) =>{
    return UploadedDocumentDoa.AddUploadedDocument(claimNumber, fileName, documentType, alfrescoRepoId, nodeId);
}

module.exports = {UploadedDocumentServiceList, UploadedDocumentDetailsService, UploadedDocumentServiceMatchCount, AddUploadedDocumentService}