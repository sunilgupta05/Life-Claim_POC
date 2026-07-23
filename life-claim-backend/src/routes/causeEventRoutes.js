
const express = require('express');
const { getAllCauseEvents } = require('../controllers/causeEventController');
const { protect } = require('../middleware/keycloak');

const router = express.Router();

// Security: Protect cause event endpoint
router.get('/', protect(), getAllCauseEvents);

module.exports = router;
