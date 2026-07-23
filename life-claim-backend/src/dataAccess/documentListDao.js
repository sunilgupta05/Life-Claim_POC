const DocumentList = require('../models/documentList')


const getDocumentList = async() => {
     const doc = await DocumentList.findAll();
     console.log('documentListDOA.js >> getDocumentList :>>', doc);
     return doc;
}



module.exports = {getDocumentList}