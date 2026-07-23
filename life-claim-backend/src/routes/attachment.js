const express = require('express');
const router = express.Router();
const { protect, hasAnyRole } = require('../middleware/keycloak');
const attachmentController = require('../controllers/attachmentsController');
const { validateNumericIdParam } = require('../middleware/requestValidation');

const operationalRoles = ['Pre Assessor', 'Assessor', 'Verifier'];
const operational = protect(hasAnyRole(operationalRoles));

router.get('/:mailId', operational, validateNumericIdParam('mailId'), attachmentController.getAllAttachments);
router.patch('/:mailId', operational, validateNumericIdParam('mailId'), attachmentController.patchAttachments);

module.exports = router;
