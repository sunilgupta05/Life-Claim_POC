const express = require('express');
const { getAllStates } = require('../controllers/statesController');
const { getAllPlacesOfDeath } = require('../controllers/placeOfDeathController');
const { getAllRequirement } = require('../controllers/requirementController');
const { getPortfolio } = require('../controllers/portfolioController');
const { getSystemRequirement } = require('../controllers/systemRequirementController');
const { protect } = require('../middleware/keycloak');

const router = express.Router();

// Security: Protect master data and requirements access
router.get('/', protect(), getAllStates);
router.get('/place', protect(), getAllPlacesOfDeath);
router.get('/requirements', protect(), getAllRequirement);
router.post('/portfolio', protect(), getPortfolio);
router.post('/system-requirement', protect(), getSystemRequirement);

module.exports = router;
