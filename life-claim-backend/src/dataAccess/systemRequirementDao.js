const db = require("../config/dbConfig");

// Function to fetch requirement details based on portfolioType, typeOfClaim, policyStatus, and sumAssured
const getSystemRequirementFromDB = async (portfolioType, typeOfClaim, policyStatus, sumAssured) => {
  try {
    const query = `
      SELECT DISTINCT
          rm.REQUIREMENT_CODE,
          rm.REQUIREMENT_DESC,
          rm.REQUIREMENT_STATUS,
          rm.REQUIREMENT_SOURCE,
          rm.REQUIREMENT_TYPE,
          rm.REQUIREMENT_CATEGORY,
          rm.REQUIREMENT_DOC_TYPE,
          rm.INTERNALORCUSTOMER
      FROM requirement_master rm
      JOIN caps_bre_requirement_master cbm 
          ON rm.REQUIREMENT_CODE = cbm.DOCUMENT_NAME
      WHERE 
          cbm.PORTFOLIO_TYPE = ? 
          AND cbm.TYPE_OF_CLAIM = ? 
          AND cbm.POLICY_STATUS = ? 
          AND ?>cbm.SUM_ASSURED ;
    `;

    const [rows] = await db.query(query, [portfolioType, typeOfClaim, policyStatus, sumAssured]);

    console.log(rows);
    return rows.length > 0 ? rows : null;
  } catch (error) {
    throw new Error("Database error: " + error.message);
  }
};

// Export function
module.exports = { getSystemRequirementFromDB };
