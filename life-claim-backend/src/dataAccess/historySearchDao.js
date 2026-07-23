const db = require('../config/dbConfig'); // Assuming you already have dbConfig set up

const historySearchInDB = async (policyNumber, claimNumber) => {
  let query = '';
  let searchParam = '';

  if (policyNumber) {
    query = 'SELECT * FROM claims_poc.claims WHERE POLICY_ID = ?';
    searchParam = policyNumber;
  } else if (claimNumber) {
    query = 'SELECT * FROM claims_poc.claims WHERE CLAIM_NUMBER = ?';
    searchParam = claimNumber;
  }

  if (!searchParam) {
    return  { message: "No records found for the provided policy or claim number." };
  }

  const [rows] = await db.execute(query, [searchParam]);
  // console.log(rows.length)
  if (rows.length === 0) {
    return { message: "No records found for the provided policy or claim number." };
}
  if (claimNumber) {
      return rows.length ? rows[0] : null;
  } else if (policyNumber) {

    return rows.length ? rows : null;
  }
};

module.exports = {
  historySearchInDB,
};
