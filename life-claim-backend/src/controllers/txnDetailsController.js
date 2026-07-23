const { error } = require('winston');

const { getTransactionApiDBDetailsService, saveTransactionApiDetailsService } = require('../services/transactionApiDetailsService');
const {
  getTransactionApiBase,
  formatPolicyNumber,
} = require('../services/transactionApiClient');

console.log('txnDetailsController >> transaction service:', getTransactionApiBase());
const exposeErrorDetails = process.env.NODE_ENV !== 'production';

// Transaction API calling 
const getTxnDetailsController = async (req, res) => {
    try {
        const { policyId, txnDate } = req.body;
        const formattedPolicyId = formatPolicyNumber(policyId);
        const txnDetails = await fetch(
          `${getTransactionApiBase()}/api/transactionDetails/${formattedPolicyId}/${txnDate}`
        );
        //console.log('txnDetailsControllerjs >> getTxnDetailsController >> txnDetails :>', txnDetails);
        const data = await txnDetails.json();
       // console.log('txnDetailsControllerjs >> getTxnDetailsController >> txnDetails data :>', data );
         
        if (txnDetails.status === 200) {
            return res.status(200).json(data);
        }
        return res.status(502).json({
            message: 'Transaction service error',
            ...(exposeErrorDetails ? { detail: data, status: txnDetails.status } : {}),
        });
    } catch (error) {
        console.error('txnDetailsControllerjs >> getTxnDetailsController >> error :>', error);
        res.status(503).json({ 
            message: 'Service unavailable',
            ...(exposeErrorDetails ? {
                detail: error.message || 'Failed to connect to transaction service',
                code: error.code || undefined,
            } : {})
        });
    }
}

const getTransactionApiDetailsController = async (req, res) => {
    try {
        const rawPolicy = req.body.policyNumber || req.body.policyId;
        const policyNumber = formatPolicyNumber(rawPolicy);
        if (!policyNumber) {
            return res.status(400).json({ message: 'Policy number is required' });
        }
        const txnDate = req.body.txnDate || null;
        let queryResult = await getTransactionApiDBDetailsService(policyNumber, txnDate);
        let rows = Array.isArray(queryResult?.[0]) ? queryResult[0] : [];
        let dateMismatch = false;
        if (txnDate && rows.length === 0) {
            queryResult = await getTransactionApiDBDetailsService(policyNumber, null);
            rows = Array.isArray(queryResult?.[0]) ? queryResult[0] : [];
            dateMismatch = rows.length > 0;
        }
        return res.status(200).json({ policyNumber, txnDate, rows, count: rows.length, dateMismatch });
    } catch (error) {
        console.error('getTransactionApiDetailsController error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            ...(exposeErrorDetails ? { detail: error.message || 'Transaction details lookup failed' } : {}),
        });
    }
};

const saveTransactionApiDetailsController = async (req, res) => {
    try {
        console.log('txnDetailsController >> saveTransactionApiDetailsController request received');
        const savedTransactionApiDetails = await saveTransactionApiDetailsService(req.body);
        console.log('txnDetailsController >> saveTransactionApiDetailsController completed');
        if (!savedTransactionApiDetails || savedTransactionApiDetails instanceof Error) {
            return res.status(500).json({
                message: 'Failed to persist transaction details',
                ...(exposeErrorDetails ? {
                    detail: savedTransactionApiDetails?.message || 'Save returned no result',
                } : {}),
            });
        }
        return res.status(200).json(savedTransactionApiDetails);
    } catch (error) {
        console.error('saveTransactionApiDetailsController error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            ...(exposeErrorDetails ? { detail: error.message || 'Transaction save failed' } : {}),
        });
    }
}

module.exports = {
    getTxnDetailsController, getTransactionApiDetailsController, saveTransactionApiDetailsController
}