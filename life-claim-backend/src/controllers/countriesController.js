const { getAllCountriesFromDB } = require('../dataAccess/countriesDao');

// Controller will call Dao file to access DB
const getAllCountries = async (req, res) => {
  try {
    const countries = await getAllCountriesFromDB();
    res.json(countries); // Send the result back to the client
  } catch (error) {
    console.log("Error: ", error.message);
    res.status(500).json({ error: 'An error occurred while fetching countries' });
  }
};

module.exports = { getAllCountries };
