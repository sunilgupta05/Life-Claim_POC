const logger = require('../util/logger');
const safeCityPincodeCheckDoa = require('../dataAccess/FraudPrevention/safeCityPincodeCheckDoa');
const appConfig = require('../config/configService');
const fraudPreventionDao = require('../dataAccess/FraudPrevention/fraudPreventionDao');
const exposeErrorDetails = appConfig.get('EXPOSE_ERROR_DETAIL') === 'true';

const internalError = (res, error) =>
  res.status(500).json({
    message: 'Internal server error',
    ...(exposeErrorDetails ? { detail: error?.message || String(error) } : {}),
  });

const getSafeCityPincodeCheck = async (req, res, next) => {
    logger.info('Controller >> FraudPrevention >> getSafeCityPincodeCheck request received');
    const pincode = req.body.pincode;
    const  city = req.body.city;
    try {
        const result = await safeCityPincodeCheckDoa.getSafeCityPincodeCheck(pincode, city);
        logger.info('Controller >> FraudPrevention >> getSafeCityPincodeCheck completed');
        res.status(200).json({
            cityExist : result.cityExist,
            pincodeExist : result.pincodeExist,
            city : result.city[0],
            pincode : result.pincode[0]
        });
        return result;
    } catch (error) {
        return internalError(res, error);
    }
};

const getClaimantBankdetailsCheck = async (req, res, next) => {
    logger.info('Controller >> FraudPrevention >> getClaimantBankdetailsCheck.js >> req :>');
    try {
        const claimNumber = String(req.body?.claimNumber || '').trim();
        const result = await fraudPreventionDao.claimantBankdetailsCheck(claimNumber);
        res.status(200).json(result);
    } catch (error) {
        return internalError(res, error);
    }
};

const agentTrendCheckController = async (req, res, next) => {
    logger.info('Controller >> FraudPrevention >> agentTrendCheckController.js >> req :>');
    const source = req.body.source;
    const agentType = req.body.agentType;
    const claimNumber = String(req.body?.claimNumber || '').trim();
    try {
        const result = await fraudPreventionDao.agentTrendCheck(source, agentType, claimNumber);
        res.status(200).json(result);
    } catch (error) {
        return internalError(res, error);
    }
}

const mobileNumberCheckController = async (req, res, next) => {
    const la_number = req.body.numbers;
    logger.info('Controller >> FraudPrevention >> mobileNumberCheckController request received');
    try{
        const result = await fraudPreventionDao.mobileNumberCheck(la_number);
        res.status(200).json(result);
    }catch(error){
        return internalError(res, error);
    }
}

const addRemarksController = async (req, res, next) => {
    //logger.info('Controller >> FraudPrevention >> addRemarksController.js >> req :>', req.body);
    const feedback = req.body.feedback;
    const claimNumber = req.body.claimNumber;
    const role = req.body.role;
    const username = req.body.username;
    try{
        logger.info('Controller >> FraudPrevention >> addRemarksController request received');
        const response = await fraudPreventionDao.addRuleRemarksDetails(feedback, claimNumber, role, username);
        logger.info('Controller >> FraudPrevention >> addRemarksController completed');
        return res.status(200).json(response);;
    }catch(error){
        return internalError(res, error);
    }
}

const getEagleRuleDetailsController = async (req, res, next) => {
    logger.info('Controller >> FraudPrevention >> getRuleRemarksDetails request received');
    const claimNumber = req.body.claimNumber;
    try{
        const result = await fraudPreventionDao.getEagleRuleRemarksDetails(claimNumber);
        res.status(200).json(result);
    }catch(error){
        return internalError(res, error);
    }   
}

const updateEagleRuleDetailsController = async (req, res, next) => {
    const updatedFeedback = req.body.feedback;

    logger.info('Controller >> FraudPreventionController.js >> updateEagleRuleDetailsController request received');
    try{
        const response = await   fraudPreventionDao.updateCapsEagleRuleDetails(updatedFeedback);
        logger.info('Controller >> FraudPreventionController.js >> updateEagleRuleDetailsController completed');
        return res.status(200).json(response);

    }catch(error){
        return internalError(res, error);
    }
}

module.exports = { getSafeCityPincodeCheck, getClaimantBankdetailsCheck, agentTrendCheckController, mobileNumberCheckController, addRemarksController, getEagleRuleDetailsController, updateEagleRuleDetailsController };   
