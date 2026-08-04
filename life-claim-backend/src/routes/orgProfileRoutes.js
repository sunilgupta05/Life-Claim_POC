// src/routes/orgProfileRoutes.js
//
// Public route for the active-organization profile (roadmap 0.2).
// Mounted BEFORE the Keycloak/requireApiAuth gate in app.js because the login
// page needs branding before a user is authenticated. Read-only GET only.

const express = require('express');
const { getOrgProfile } = require('../controllers/orgProfileController');

const router = express.Router();

router.get('/', getOrgProfile);

module.exports = router;
