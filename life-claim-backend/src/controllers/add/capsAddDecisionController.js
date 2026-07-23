const CapsAddDecisionDao = require('../../dataAccess/add/capsAddDecisionDao');

const getDecisionMasterData = async (req, res) => {
    try {
        const data = await CapsAddDecisionDao.getDecisionMasterData();
        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error in getDecisionMasterData Controller:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching decision master data'
        });
    }
};

const saveDecisionController = async (req, res) => {
    try {
        const { decisionData, username } = req.body;
        
        if (!decisionData || !decisionData.case_id) {
            return res.status(400).json({
                success: false,
                message: 'Invalid decision data provided'
            });
        }

        const result = await CapsAddDecisionDao.saveDecision(decisionData, username);
        
        res.status(200).json({
            success: true,
            message: result.created ? 'Decision saved successfully' : 'Decision updated successfully',
            data: result.decision
        });
    } catch (error) {
        if (error.statusCode === 409 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error in saveDecisionController:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while saving decision'
        });
    }
};

module.exports = {
    getDecisionMasterData,
    saveDecisionController
};
