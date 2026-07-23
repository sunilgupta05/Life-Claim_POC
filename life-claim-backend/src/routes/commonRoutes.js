const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const authorize = require('../middleware/authorize');
const { protect, hasAnyRole } = require('../middleware/keycloak');
const userController = require('../controllers/userController');
const Email_fax_mobile_SearchController = require('../controllers/email_fax_mobile_SearchController');
const email_fax_contactController = require('../controllers/email_fax_contactController');
const generalInfoController = require('../controllers/generalInfoController');
const {
  validateCreateUserBody,
  validateUpdateUserBody,
  validateHospitalIdParam,
  validateHospitalEmailParam,
  validateFaxNoParam,
  validateHospitalPhoneParam,
  validateCampaignTypeParam,
  validateAddEmailBody,
  validateAddFaxBody,
  validateAddContactBody,
  validateUpdateEmailBody,
  validateUpdateFaxBody,
  validateUpdateContactBody,
  validateGeneralInfoUpdateBody,
} = require('../middleware/requestValidation');

const operationalRoles = ['Pre Assessor', 'Assessor', 'Verifier'];
const superuserOnly = [authMiddleware.authenticate, authorize('superuser', 'super user')];
const operationalOnly = [protect(hasAnyRole(operationalRoles))];

router.get('/users', ...superuserOnly, userController.getUsers);
router.post('/user', ...superuserOnly, validateCreateUserBody, userController.createUser);
router.put('/user/:id', ...superuserOnly, validateUpdateUserBody, userController.updateUser);
router.delete('/user/:id', ...superuserOnly, userController.deleteUser);

// Hospital contacts — operational roles only
router.get('/searchEmail_fax_contact/:hospitalId', ...operationalOnly, validateHospitalIdParam, Email_fax_mobile_SearchController.getRecordsforEmail_fax_contact);
router.post('/add-email', ...operationalOnly, validateAddEmailBody, email_fax_contactController.addEmailToEntity);
router.post('/add-fax', ...operationalOnly, validateAddFaxBody, email_fax_contactController.addFaxToEntity);
router.post('/add-contact', ...operationalOnly, validateAddContactBody, email_fax_contactController.addContactToEntity);
router.put('/updateEmail/:hospitalId', ...operationalOnly, validateHospitalIdParam, validateUpdateEmailBody, email_fax_contactController.updateEmail);
router.put('/updateFax/:hospitalId', ...operationalOnly, validateHospitalIdParam, validateUpdateFaxBody, email_fax_contactController.updateFax);
router.put('/updateContact/:hospitalId', ...operationalOnly, validateHospitalIdParam, validateUpdateContactBody, email_fax_contactController.updateContact);
router.delete('/delete-email/:hospital_email', ...operationalOnly, validateHospitalEmailParam, email_fax_contactController.deleteEmailFromEntity);
router.delete('/delete-fax/:fax_no', ...operationalOnly, validateFaxNoParam, email_fax_contactController.deleteFaxFromEntity);
router.delete('/delete-contact/:hospital_phone', ...operationalOnly, validateHospitalPhoneParam, email_fax_contactController.deleteContactFromEntity);

router.get('/general-info/:hospitalId', ...operationalOnly, validateHospitalIdParam, generalInfoController.getRecordsForGeneralInfo);
router.get('/general-info/:hospitalId/process-automated', ...operationalOnly, validateHospitalIdParam, generalInfoController.getRecordsForProcessAutomated);
router.get('/general-info/:hospitalId/marketing', ...operationalOnly, validateHospitalIdParam, generalInfoController.getRecordsForMarketingIniti);
router.put('/general-info/:hospitalId', ...operationalOnly, validateHospitalIdParam, validateGeneralInfoUpdateBody, generalInfoController.updateGeneralInfo);
router.put('/general-info/:hospitalId/marketing', ...operationalOnly, validateHospitalIdParam, generalInfoController.updateMarketingIniti);
router.post('/general-info/marketing', ...operationalOnly, generalInfoController.addMarketingData);
router.delete('/general-info/marketing/:campaignType', ...operationalOnly, validateCampaignTypeParam, generalInfoController.deleteMarketingData);

module.exports = router;
