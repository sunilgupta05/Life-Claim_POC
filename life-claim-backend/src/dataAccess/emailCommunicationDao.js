const CapsEmailCommMaster = require('../models/CapsEmailCommMaster'); // Adjust the path to your model

/**
 * Get data based on CLAIMSTATUS and LEVEL.
 * @param {string} claimStatus - The claim status to filter by.
 * @param {string} level - The level to filter by.
 * @returns {Promise<Array>} - A promise that resolves to an array of records.
 */
async function getByClaimStatusAndLevel(claimStatus, level) {
    try {
        const records = await CapsEmailCommMaster.findAll({
            where: {
                CLAIMSTATUS: claimStatus,
                LEVEL: level
            }
        });
        return records;
    } catch (error) {
        console.error('Error fetching records:', error);
        throw error;
    }
}

module.exports = {
    getByClaimStatusAndLevel
};
