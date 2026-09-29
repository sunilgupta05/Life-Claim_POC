const logger = require('../util/logger');
const historySearchDao = require('../dataAccess/historySearchDao');

const getHistorySearchService = async (policyNumber, claimNumber) => {
  try {
    const policy = await historySearchDao.historySearchInDB(policyNumber, claimNumber);
    // logger.info(policy)
    return policy;
  } catch (error) {
    // logger.error('DAO Error:', error.message); // Log specific DAO error
    throw new Error('Error in service while fetching policy');
  }
};

module.exports = {
    getHistorySearchService,
};
