// src/routes/orgProfileRoutes.js
//
// Public read of the active-organization profile (roadmap 0.2). Mounted BEFORE
// the Keycloak/requireApiAuth gate in app.js because the login page needs
// branding before authentication. Read-only GET only — the superuser branding
// WRITES (roadmap 2.1) live in orgProfileAdminRoutes.js, mounted AFTER the auth
// gate so req.user (and the superuser bypass) is fully populated.

const express = require('express');
const { getOrgProfile } = require('../controllers/orgProfileController');

const router = express.Router();

router.get('/', getOrgProfile);

module.exports = router;
