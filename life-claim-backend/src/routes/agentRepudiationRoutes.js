const express = require('express');
const policyController = require('../controllers/policyController');
const { protect } = require('../middleware/keycloak');

const router = express.Router();

// Security: Protect agent repudiation details endpoint
router.post('/', protect(), policyController.getAgentRepudiationDetails);

module.exports = router;