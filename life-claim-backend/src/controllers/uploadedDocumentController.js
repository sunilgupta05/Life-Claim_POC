const logger = require('../util/logger');
const UploadedDocumentsService = require('../services/uploadedDocumentsService')

const UploadedDocumentDetails = async(req, res) => {
    const claimId = req.body.claimId;
    try{
        const documentValue = await UploadedDocumentsService.UploadedDocumentServiceList(claimId);
        logger.info('UploadedDocumentController.js documentValue >>:<<', documentValue);
        return res.json(documentValue);
    }catch(error){
        logger.error('UploadedDocumentController >> UploadedDocumentDetails error:', error);
        if (!res.headersSent) {
          return res.status(500).json({ message: 'Failed to load uploaded documents.' });
        }
    }
}

const UploadedDocumentCountDetails = async(req, res) => {
    // logger.info('Req ::>> ',req);
    const claimId = req.body.claimId;
    const documentType = req.body.documentType;
    const fileName = req.body.fileName; //"demo";
    try{
        const documentValue = await UploadedDocumentsService.UploadedDocumentServiceMatchCount(claimId, documentType, fileName);
        const checkDoc = res.json(documentValue);
        logger.info('UploadedDocumentContoller.js UploadedDocumentServiceMatchCount documentValue >>:<<',documentValue);
    }catch(error){
        logger.info('Error Triggered in UploadedDocumentContoller.js file while getting UploadedDocumentlist : ', error);
    }
}

const AddDocumentDetails = async(req, res) => {
    const claimNumber  = req.body.claimNumber;
    const fileName = req.body.fileName;
    const documentType = req.body.documentType;
    const alfrescoRepoId = req.body.alfrescoRepoId;
    try{
        const addNewRow = await UploadedDocumentsService.AddUploadedDocumentService(claimNumber, fileName, documentType, alfrescoRepoId);
        const newRecordResult =res.json(addNewRow);
        logger.info('uploadedDocumentController.js >> AddDocumentDetails > newRecordResult', newRecordResult);
        return newRecordResult;
    }catch(error){
        logger.info('Error While Adding Document Details in the UploadedDocuments Table', error);
    }
}


module.exports = {
    UploadedDocumentDetails,
    UploadedDocumentCountDetails,
    AddDocumentDetails
}