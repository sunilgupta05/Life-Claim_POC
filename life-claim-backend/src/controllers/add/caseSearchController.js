
const CapsAddCaseSearchDoa = require('../../dataAccess/add/capsAddCaseSearchDoa');

const getCaseSearchController = async (req, res, next) => {
    const { attribute, value, limit, offset } = req.body;
    console.log('caseSearchController.js >> getCaseSearchController request received');

    try {
        const result = await CapsAddCaseSearchDoa.caseSearchData(attribute, value, limit, offset);
        res.status(200).json({
            success: true,
            data: result.rows,
            totalCount: result.count
        });

    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ success: false, error: error.message });
        }
        next(error);
    }
}

module.exports = {getCaseSearchController}