const { getAllStatesFromDB } = require('../dataAccess/statesDao');

// states will call Dao file to access DB
const getAllStates = async (req, res) => {
  try {
    const states = await getAllStatesFromDB();//will be executed first
    res.json(states); // Send the result back to the client
  } catch (error) {
    console.log("Error: ", error.message);
    res.status(500).json({ error: 'An error occurred while fetching countries' });
  }
};

module.exports = { getAllStates };
