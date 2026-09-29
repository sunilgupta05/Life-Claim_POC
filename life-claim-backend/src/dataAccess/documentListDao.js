const logger = require('../util/logger');
const DocumentList = require('../models/documentList')


const getDocumentList = async() => {
     const doc = await DocumentList.findAll();
     logger.info('documentListDOA.js >> getDocumentList :>>', doc);
     return doc;
}



module.exports = {getDocumentList}