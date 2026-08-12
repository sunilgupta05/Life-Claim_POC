const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/keycloak');
const requirePermission = require('../middleware/requirePermission');
const attachmentController = require('../controllers/attachmentsController');
const { validateNumericIdParam } = require('../middleware/requestValidation');

// Operational access (roadmap 1.2): authenticate via protect(), then require a
// permission the operational roles hold today. documents.view here.
const operational = [protect(), requirePermission('documents.view')];

router.get('/:mailId', operational, validateNumericIdParam('mailId'), attachmentController.getAllAttachments);
router.patch('/:mailId', operational, validateNumericIdParam('mailId'), attachmentController.patchAttachments);

module.exports = router;
