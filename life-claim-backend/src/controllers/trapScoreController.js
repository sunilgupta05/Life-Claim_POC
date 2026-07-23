const trapScoreService = require('../services/trapScoreService');
const logger = require('../config/logConfig');


exports.getTrapScore = async (req, res, next) => {
  
  try {
    const { trapScoreData } = req.body;
    const result = await trapScoreService.getTrapScore(trapScoreData)
    // const result1 = await trapScoreService.getTrapScore1(trapScoreData)
    
    // const validationResult = await trapScoreService.checkForNull(trapScoreData);

    return res.status(201).json({ result});
    // if (validationResult.status === "Success") {
    // } else {
    //   return res.status(400).json({ message: validationResult.remarks });
    // }

  } catch (error) {
    logger.error(`Issue here 1: ${error}`);
    next(error);
  }
};

exports.getTrapScoreCity = async (req, res, next) => {

  try {
    // console.log("someone called me")
    const {pin,city} = req.body;
    const data = await trapScoreService.getTrapScoreCity({pin,city});
    // logger.info(`Row fetched: ${data}`);
    res.status(201).json({data:data});
  } catch (error) {
    
    logger.error(`User Not Created ERROR MSG : ${error}`);
    next(error);
  }
};

exports.checkForNull = async (req,res,next) => {
  try {
    //get obj from body
    const { trapScoreData } = req.body;

    if (!trapScoreData) {
      return res.status(400).json({ message: 'no data found' });
    }

    //check for null fun
    const validationResult = await trapScoreService.checkForNull(trapScoreData);

    if (validationResult.status === "Success") {
      return res.status(201).json({ message: validationResult.status });
    } else {
      return res.status(400).json({ message: validationResult.remarks });
    }

  } catch (error) {
    logger.error(`User Not Created ERROR MSG : ${error}`);
    next(error);
  }
}
