const db = require('../config/dbConfig');

// Function to fetch all countries from the database
const getAllCountriesFromDB = async () => {
  try {
    const [rows] = await db.query('SELECT * FROM claims_poc.countries');
    return rows;
  } catch (error) {
    throw new Error('Database error: ' + error.message);
  }
};

// export this function
module.exports = { getAllCountriesFromDB };
