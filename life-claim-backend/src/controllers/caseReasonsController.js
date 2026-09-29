const logger = require('../util/logger');
const { getAllCaseReasonsFromDB, getSystemAssessorRemarksFromDB } = require('../dataAccess/caseReasonsDao');

// states will call Dao file to access DB
const getAllCaseReasons = async (req, res) => {
  try {
    const caseReasons = await getAllCaseReasonsFromDB();//will be executed first
    res.json(caseReasons); // Send the result back to the client
  } catch (error) {
    // logger.info("Error: ", error.message);
    res.status(500).json({ error: 'An error occurred while fetching countries' });
  }
};

const getSystemAssessorRemarks = async (req, res) => {
  try {
    const  claimId  = req.body.claimId;
    logger.info("getSystemAssessorRemarks >> claimId : ", claimId);
    const systemAssessorRemarks = await getSystemAssessorRemarksFromDB(claimId);
    res.json(systemAssessorRemarks);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching system assessor remarks' });
  }
};

module.exports = { getAllCaseReasons, getSystemAssessorRemarks };
