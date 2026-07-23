const { getAllCaseReasonsFromDB, getSystemAssessorRemarksFromDB } = require('../dataAccess/caseReasonsDao');

// states will call Dao file to access DB
const getAllCaseReasons = async (req, res) => {
  try {
    const caseReasons = await getAllCaseReasonsFromDB();//will be executed first
    res.json(caseReasons); // Send the result back to the client
  } catch (error) {
    // console.log("Error: ", error.message);
    res.status(500).json({ error: 'An error occurred while fetching countries' });
  }
};

const getSystemAssessorRemarks = async (req, res) => {
  try {
    const  claimId  = req.body.claimId;
    console.log("getSystemAssessorRemarks >> claimId : ", claimId);
    const systemAssessorRemarks = await getSystemAssessorRemarksFromDB(claimId);
    res.json(systemAssessorRemarks);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching system assessor remarks' });
  }
};

module.exports = { getAllCaseReasons, getSystemAssessorRemarks };
