const express = require('express');
const { calculateAmount } = require('../controllers/calculateAmountController');
const { protect } = require('../middleware/keycloak');

const router = express.Router();

// Security: Protect calculate amount endpoint
router.post('/', protect(), calculateAmount);

module.exports = router;