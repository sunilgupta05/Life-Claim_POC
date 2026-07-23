const CapsAddFindingsDao = require('../../dataAccess/add/capsAddFindingsDao');

const saveFindingsController = async (req, res) => {
    try {
        const { findings, username } = req.body;
        
        if (!findings || !Array.isArray(findings) || findings.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No findings provided to save'
            });
        }

        const savedData = await CapsAddFindingsDao.saveFindings(findings, username);
        
        res.status(201).json({
            success: true,
            message: `Successfully saved ${savedData.length} findings`,
            data: savedData
        });
    } catch (error) {
        if (error.statusCode === 409 || error.statusCode === 404) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('Error in saveFindingsController:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while saving findings'
        });
    }
};

module.exports = {
    saveFindingsController
};
