const logger = require('../util/logger');
const calculateAmountService = require('../services/calculateAmountService');

const calculateAmount = async (req, res) => {
  try {
    
    const { obj } = req.body;
    // logger.info('Received obj:', obj);

    const result=await calculateAmountService.getAmount(obj);
    if (!result) {
      return res.status(400).json({ message: 'obj not found' });
    }

    res.status(201).json({result});

  } catch (error) {
    // logger.error('Error searching for policy or claim:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  calculateAmount
};
