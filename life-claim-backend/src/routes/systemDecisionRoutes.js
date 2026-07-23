const express = require('express');
const { generateSystemDecision } = require('../controllers/systemDecisionController');
const { protect } = require('../middleware/keycloak');

const router = express.Router();

// Security: Protect system decision generation endpoint
router.post('/generateSystemDecision', protect(), generateSystemDecision);

module.exports = router;