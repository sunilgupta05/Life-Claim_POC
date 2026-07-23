const { getAllRequirements } = require("../dataAccess/requirementDao")

const getAllRequirement = async (req, res) => {
    try {
        const requirements = await getAllRequirements()
        res.json(requirements)
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching requirements' })
    }
}

module.exports = {getAllRequirement}