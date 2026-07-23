const db = require('../config/dbConfig');


const getAllRequirements = async () => {
    try {
        const [rows] = await db.query('SELECT * FROM claims_poc.requirement_master')
        return rows        
    } catch (error) {

        console.log(error.message)
        throw new Error("Requirement error: " ,error.message);
        
    }
}

module.exports = {getAllRequirements}