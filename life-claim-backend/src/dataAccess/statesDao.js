const db = require('../config/dbConfig');

// Function to fetch all countries from the database
const getAllStatesFromDB = async () => {
  try {
    // destructuring assignment
    const [rows] = await db.query('SELECT * FROM claims_poc.states');//execute query first
      //if (rows.length > 0) {
      //     res.status(200).send(rows);
      // } else {
      //     res.status(404).send({ msg: 'No results found!' });
      // }
    //console.log(rows)
    return rows;
  } catch (error) {
    throw new Error('Database error: ' + error.message);
  }
};

// export this function
module.exports = { getAllStatesFromDB };
