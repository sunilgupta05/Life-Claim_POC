const db = require('../config/dbConfig');

// Function to fetch all countries from the database
const getAllCaseReasonsFromDB = async () => {
  try {
    const [rows] = await db.query('SELECT * FROM claims_poc.case_reasons');
    return rows;
  } catch (error) {
    throw new Error('Database error: ' + error.message);
  }
};

const getSystemAssessorRemarksFromDB = async (claimId) => {
  try {
    const [rows] = await db.query('SELECT * FROM claims_poc.system_assessor_remark WHERE CLAIM_ID = ?', claimId);
    return rows;
  } catch (error) {
    throw new Error('Database error: ' + error.message);
  }
};
// export this function
module.exports = { getAllCaseReasonsFromDB, getSystemAssessorRemarksFromDB };
