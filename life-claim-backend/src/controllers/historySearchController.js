const logger = require('../util/logger');
const historySearchService = require('../services/historySearchService');

const getHistorySearch = async (req, res) => {
  try {
    const { policyNumber, claimNumber } = req.body;
    logger.info('Received policy number:', policyNumber, 'Received claim number:', claimNumber);

    if (!policyNumber && !claimNumber) {
      return res.status(400).json({ message: 'Either policy number or claim number is required' });
    }

    const policy = await historySearchService.getHistorySearchService(policyNumber, claimNumber);
   
    if (!policy) {
      return res.status(404).json({ message: 'Policy or claim not found' });
    }
    // logger.info(policy)
    res.status(200).json(policy);
  } catch (error) {
    // logger.error('Error searching for policy or claim:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getHistorySearch,
};
