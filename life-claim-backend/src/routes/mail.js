const express = require('express');
const router = express.Router();
const { protect, hasAnyRole } = require('../middleware/keycloak');
const mailsController = require('../controllers/mailsController');
const { validateNumericIdParam } = require('../middleware/requestValidation');

const operationalRoles = ['Pre Assessor', 'Assessor', 'Verifier'];
const operational = protect(hasAnyRole(operationalRoles));

router.get('/', operational, mailsController.getAllMails);
router.get('/count', operational, mailsController.getMailsCount);
router.get('/:id', operational, validateNumericIdParam('id'), mailsController.getMailById);

module.exports = router;
