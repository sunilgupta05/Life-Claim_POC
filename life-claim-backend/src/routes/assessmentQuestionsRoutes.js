const express = require('express');
const assessmentQuestionsController = require('../controllers/assessmentQuestionsController');
const { protect } = require('../middleware/keycloak');

const router = express.Router();

// Security: Protect assessment questions endpoint
router.post('/', protect(), assessmentQuestionsController.getassessmentQuestions);

module.exports = router;