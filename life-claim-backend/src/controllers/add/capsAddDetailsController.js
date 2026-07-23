const CapsAddDetailsDoa = require('../../dataAccess/add/capsAddDetailsDao');
const { resetAddDemoData } = require('../../dataAccess/add/addDemoResetDao');
const { validateAddExcelPayload } = require('../../util/addDataEntryValidation');
const { getUserContext } = require('../../middleware/claimAccessMiddleware');
const exposeErrorDetails = process.env.NODE_ENV !== 'production';
const internalError = (res, error) =>
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(exposeErrorDetails ? { detail: error?.message || String(error) } : {}),
  });

const addExcelDataToTable = async (req, res, next) => {
    console.log('capAddDetailsController.js >> addExcelDataToTable request received');
    const { username, data } = req.body;
    const { username: sessionUser } = getUserContext(req);
    const effectiveUser = sessionUser || username;

    const validation = validateAddExcelPayload(data);
    if (!validation.ok) {
        return res.status(400).json({ success: false, error: validation.error });
    }

    console.log('capAddDetailsController.js >> addExcelDataToTable payload accepted');
    try {
        const addValue = await CapsAddDetailsDoa.insertCapsAddDetails({
            username: effectiveUser,
            data: validation.data,
        });
        res.status(201).json({
            success: true,
            message: `Successfully inserted ${addValue.length} records`,
            data: addValue
        });
    } catch (e) {
        console.error('Error in addExcelDataToTable:', e);
        internalError(res, e);
    }
}

const getCapsAddDetails = async (req, res, next) => {
    //console.log('getCapsAddDetails', req.body);
    const attribute = req.body.attribute;
    const value = req.body.value;
    //console.log('capsAddDetailsController.js >> getCapsAddDetails: ', attribute, value);
    try {
        const addValue = await CapsAddDetailsDoa.getCapsAddDetails(attribute, value);
        res.status(200).json({
            success: true,
            data: addValue
        });
    } catch (e) {
        console.error('Error in getAddCapsDetails:', e);
        res.status(500).json({
            success: false,
            error: e.message
        });
    }
}

const getCapsAddDetailsByDecision = async (req, res, next) => {
    const caseType = req.body.caseType;
    const attribute = req.body.attribute;
    const value = req.body.value;
    const limit = parseInt(req.body.limit, 10) || 10;
    const page = parseInt(req.body.page, 10) || 0;
    const offset = req.body.offset != null ? parseInt(req.body.offset, 10) : page * limit;
    console.log('capsAddDetailsController.js >> getCapsAddDetailsByDecision request received');
    try {
        const result = await CapsAddDetailsDoa.getCapsAddDetailsByDecision(caseType, attribute, value, limit, offset);
        res.status(200).json({
            success: true,
            data: result.data,
            totalCount: result.totalCount,
            totalRecords: result.totalCount,
        });
    } catch (e) {
        if (e.message?.includes('Invalid search attribute') || e.message?.includes('required')) {
            return res.status(400).json({ success: false, error: e.message });
        }
        console.error('Error in getCapsAddDetailsByDecision:', e);
        internalError(res, e);
    }
}

const updateCapsAddDetailsCaseStatusController = async (req, res, next) => {
    const caseId = req.body.caseId;
    const caseStatus = req.body.caseStatus;
    const username = req.body.username;
    console.log('capsAddDetailsController.js >> updateCapsAddDetailsCaseStatusController request received');
    try {
        const updateCaseStatus = await CapsAddDetailsDoa.updateCapsAddDetailsCaseStatus(caseId, caseStatus, username);
        res.status(200).json({
            success: true,
            data: updateCaseStatus
        });
    } catch (e) {
        if (e.statusCode === 409 || e.statusCode === 404) {
            return res.status(e.statusCode).json({ success: false, error: e.message });
        }
        console.error('Error in updateCapsAddDetailsCaseStatusController:', e);
        internalError(res, e);
    }
}

//get policy number and username to check if the policyNumber  is already present in the CapsAddDetails table and username is present in the Users table
const getCapsAddDetailsPolicyNumberUsername = async (req, res, next) => {
    console.log('capsAddDetailsController.js >> getCapsAddDetailsPolicyNumberUsername request received');
    try{
        console.log('Calling DAO function...');
        const response = await CapsAddDetailsDoa.getCapsAddDetailsPolicyNumberUsername();
        console.log('DAO response received:', response);
        
        res.status(200).json({
            success: true,
            message: 'Policy numbers and usernames retrieved successfully',
            data: response
        });
    }catch(e){
        console.error('Error in getCapsAddDetailsPolicyNumberUsername:', e);
        internalError(res, e);
    }
}

const addCaseAssignmentBulk = async (req, res, next) => {
    const { data, uploadedBy } = req.body;
    const username = uploadedBy || req.user?.username || '';
    console.log('capsAddDetailsController.js >> addCaseAssignmentBulk request received');

    try {
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ success: false, message: 'Assignment data array is required.' });
        }
        const result = await CapsAddDetailsDoa.bulkAssignCasesByPolicy(data, username);
        return res.status(200).json({
            success: true,
            message: `Assigned ${result.updated.length} policy row(s); ${result.failed.length} failed.`,
            data: result,
        });
    } catch (e) {
        console.error('Error in addCaseAssignmentBulk:', e);
        internalError(res, e);
    }
};

const assignCasesByCaseIdsController = async (req, res, next) => {
    const { caseIds, assignedTo, assignedBy } = req.body;
    const username = assignedBy || req.user?.username || '';

    try {
        if (!Array.isArray(caseIds) || caseIds.length === 0) {
            return res.status(400).json({ success: false, message: 'caseIds array is required.' });
        }
        if (!assignedTo || !String(assignedTo).trim()) {
            return res.status(400).json({ success: false, message: 'assignedTo is required.' });
        }

        const result = await CapsAddDetailsDoa.assignCasesByCaseIds(caseIds, String(assignedTo).trim(), username);
        return res.status(200).json({
            success: true,
            message: `Assigned ${result.updated.length} case(s); ${result.failed.length} failed.`,
            data: result,
        });
    } catch (e) {
        console.error('Error in assignCasesByCaseIdsController:', e);
        internalError(res, e);
    }
};

const resetAddDemoDataController = async (req, res) => {
    if (process.env.ADD_DEMO_RESET_ENABLED === 'false') {
        return res.status(403).json({
            success: false,
            error: 'ADD demo reset is disabled on this environment.',
        });
    }

    try {
        const deleted = await resetAddDemoData();
        const totalDeleted = Object.values(deleted).reduce((sum, n) => sum + n, 0);
        res.status(200).json({
            success: true,
            message: `ADD demo data cleared (${totalDeleted} row(s) removed). You can upload fresh data now.`,
            data: { deleted, totalDeleted },
        });
    } catch (e) {
        console.error('Error in resetAddDemoDataController:', e);
        internalError(res, e);
    }
};

module.exports = {
    addExcelDataToTable,
    getCapsAddDetails,
    getCapsAddDetailsByDecision,
    updateCapsAddDetailsCaseStatusController,
    getCapsAddDetailsPolicyNumberUsername,
    addCaseAssignmentBulk,
    assignCasesByCaseIdsController,
    resetAddDemoDataController,
};

