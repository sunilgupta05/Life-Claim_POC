const express = require('express');
const { getAllCountries } = require('../controllers/countriesController');
const { protect } = require('../middleware/keycloak');

const router = express.Router();

// Security: Protect master data access
router.get('/', protect(), getAllCountries);

module.exports = router;
