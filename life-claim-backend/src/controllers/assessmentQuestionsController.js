const assessmentQuestionsService = require('../services/assessmentQuestionsService');
const logger = require('../config/logConfig');


exports.getassessmentQuestions = async (req, res) => {
  
  try {
    const { data } = req.body;
    const result = await assessmentQuestionsService.getassessmentQuestions(data)
    return res.status(201).json({ result});
  } catch (error)  { 
     logger.error(`Issue here: ${error}`);
    
  }
};

