// src/controllers/orgProfileController.js
//
// Serves the active-organization profile (roadmap 0.2) to the frontend.
// Public, read-only — needed by the login page before authentication.

const orgProfileService = require('../services/orgProfileService');

/**
 * GET /api/org-profile
 * Always returns a usable profile (DB-backed when provisioned, built-in
 * defaults otherwise) so branding never fails.
 */
const getOrgProfile = async (req, res) => {
  try {
    // Serve from cache; if the process has not loaded it yet, load once.
    let profile = orgProfileService.getOrgProfile();
    if (!profile || profile.source === undefined) {
      profile = await orgProfileService.load({ silent: true });
    }
    res.json(profile);
  } catch (err) {
    // Last-resort safety net: never let branding break the client.
    console.warn('[orgProfile] controller fell back to defaults:', err?.message);
    res.json({ ...orgProfileService.DEFAULTS, source: 'default' });
  }
};

module.exports = { getOrgProfile };
