const documentListDOA = require('../dataAccess/documentListDao')


const getDocumentLists = async() => {
    return documentListDOA.getDocumentList();
}

module.exports = {getDocumentLists};