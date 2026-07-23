const documentListServices = require('../services/documentListService');
const logger = require('../config/logConfig');

const getDocumentList  = async(req, res) =>{
    try{
        const documentList = await documentListServices.getDocumentLists();
        return res.json(documentList);
    }catch(error){
        logger.error(`Error in fetching document list | ERROR MSG : ${error}`);
        if (!res.headersSent) {
          return res.status(500).json({ message: 'Failed to load document types.' });
        }
    }
}

module.exports = {getDocumentList};