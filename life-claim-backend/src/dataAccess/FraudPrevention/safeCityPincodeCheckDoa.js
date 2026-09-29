const logger = require('../../util/logger');
const db = require('../../config/dbConfig'); 

const getSafeCityPincodeCheck = async (pincode, city) => {
    try {
        const cityResult = await checkSafeCity();
        const pincodeResult = await checkSafePincode();
        const result = {};
        // logger.info('DataAccess >> FraudPrevention >> safeCityPincodeCheckDoa.js >> pincode :>', pincode, 'city :>', city);
         logger.info('DataAccess >> FraudPrevention >> safeCityPincodeCheckDoa.js >> cityResult :>', cityResult);
         logger.info('DataAccess >> FraudPrevention >> safeCityPincodeCheckDoa.js >> pincodeResult :>', pincodeResult);
        if(cityResult.length > 0){
            result.city = cityResult;
            // logger.info('DataAccess >> FraudPrevention >> safeCityPincodeCheckDoa.js >> result.city :>', result.city[0]); 
            const cityName = result.city[0];
            const cityExist = cityName.some(item => item.city_name === city) ? "Yes" : "No";
            result.cityExist = cityExist;
        }  
        if(pincodeResult.length > 0){
            result.pincode = pincodeResult;
            // logger.info('DataAccess >> FraudPrevention >> safeCityPincodeCheck.js >> result.pincode :>', result.pincode);
            const pincodes = result.pincode[0];
            const pincodeExist = pincodes.some(item => item.pincode == pincode) ? "Yes" : "No";
            result.pincodeExist = pincodeExist;
        }
        //logger.info(`DataAccess >> FraudPrevention >> safeCityPincodeCheck.js >> result :> ${result} \n Stringify :> ${JSON.stringify(result)}`);
        logger.info('DataAccess >> FraudPrevention >> safeCityPincodeCheckDoa.js >> result :>', JSON.stringify(result));
        return result;
    } catch (error) {
       // throw new Error('Database error >> getSafeCityPincodeCheck : ' + error.message);
        return error;
    }
};

const checkSafeCity = async (pincode) => {
    try {
        const cityResult = await db.query(`SELECT city_name FROM  safe_city`);
        return cityResult;
    } catch (error) {
        throw new Error('Database error >> checkSafeCity : ' + error.message);
    }
};

const checkSafePincode = async () => {
    try {
        const pincodeResult = await db.query(`SELECT pincode FROM  safe_pincode`);
        return pincodeResult;
    } catch (error) {
        throw new Error('Database error >> checkSafePincode : ' + error.message);
    }
};

module.exports = { getSafeCityPincodeCheck, checkSafeCity, checkSafePincode };