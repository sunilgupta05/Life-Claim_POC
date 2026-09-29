const logger = require('../util/logger');
const { getTransactionApiDBDetails, saveTransactionApiDetails } = require('../dataAccess/transactionApiDetails');

const getTransactionApiDBDetailsService = async (policyNumber, txnDate) => {
    try {
        const transactionApiDetails = await getTransactionApiDBDetails(policyNumber, txnDate);
        return transactionApiDetails;
    } catch (error) {
        logger.info(' services >> txnTransactionApiDetailsService.js >> getTxnTransactionApiDetailsService >> error :>', error);
        return error;
       // throw new Error('Service error: ' + error.message);
    
    }
}

const saveTransactionApiDetailsService = async (transactionApiDetails) => {
    try {
        const savedTransactionApiDetails = await saveTransactionApiDetails(transactionApiDetails);
        logger.info(' services >> txnTransactionApiDetailsService.js >> saveTxnTransactionApiDetailsService >> savedTransactionApiDetails :>', savedTransactionApiDetails);
        return savedTransactionApiDetails;
    } catch (error) {
        logger.info(' services >> txnTransactionApiDetailsService.js >> saveTxnTransactionApiDetailsService >> error :>', error);
        return error;
       // throw new Error('Service error: ' + error.message);
    
    }
}

module.exports = { getTransactionApiDBDetailsService, saveTransactionApiDetailsService };