const express = require('express');
const router = express.Router();
const { protect, hasAnyRole } = require('../middleware/keycloak');
const attachmentController = require('../controllers/attachmentsController');

const operationalRoles = ['Pre Assessor', 'Assessor', 'Verifier'];
const operational = protect(hasAnyRole(operationalRoles));

router.get('/:mailId', operational, attachmentController.getAllAttachments);
router.patch('/:mailId', operational, attachmentController.patchAttachments);

module.exports = router;
