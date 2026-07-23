const express = require('express');
const trapScoreController = require('../controllers/trapScoreController');
const { protect } = require('../middleware/keycloak');

const router = express.Router();

// Security: Protect trap score related endpoints
router.post('/', protect(), trapScoreController.getTrapScore);
router.get('/city', protect(), trapScoreController.getTrapScoreCity);
router.get('/null', protect(), trapScoreController.checkForNull);

module.exports = router;