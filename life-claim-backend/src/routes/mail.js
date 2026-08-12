const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/keycloak');
const requirePermission = require('../middleware/requirePermission');
const mailsController = require('../controllers/mailsController');
const { validateNumericIdParam } = require('../middleware/requestValidation');

// Operational access (roadmap 1.2): authenticate via protect(), then require a
// permission the operational roles hold today (claims.view).
const operational = [protect(), requirePermission('claims.view')];

router.get('/', operational, mailsController.getAllMails);
router.get('/count', operational, mailsController.getMailsCount);
router.get('/:id', operational, validateNumericIdParam('id'), mailsController.getMailById);

module.exports = router;
