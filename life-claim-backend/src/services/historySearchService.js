const historySearchDao = require('../dataAccess/historySearchDao');

const getHistorySearchService = async (policyNumber, claimNumber) => {
  try {
    const policy = await historySearchDao.historySearchInDB(policyNumber, claimNumber);
    // console.log(policy)
    return policy;
  } catch (error) {
    // console.error('DAO Error:', error.message); // Log specific DAO error
    throw new Error('Error in service while fetching policy');
  }
};

module.exports = {
    getHistorySearchService,
};
