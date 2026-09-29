const logger = require('../util/logger');
const db = require("../config/dbConfig")


const getAllPlacesOfDeath = async (req,res)=>{
    try {
        const [rows] = await db.query('SELECT * FROM claims_poc.place_of_death');
        res.json(rows)
    } catch (error) {
        logger.info("Error: ", error.message);
        res.status(500).json({ error: 'An error occurred while fetching places' });
  }
}

module.exports= {getAllPlacesOfDeath};