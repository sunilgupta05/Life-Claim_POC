// src/controllers/orgProfileController.js
//
// Active-organization profile (roadmap 0.2 read + 2.1 branding admin).
//   GET  /api/org-profile        — public, read-only (login page needs branding)
//   PUT  /api/org-profile        — superuser: edit name/colours/logo path
//   POST /api/org-profile/logo   — superuser: upload a logo image (multer)

const logger = require('../util/logger');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const orgProfileService = require('../services/orgProfileService');

// ---- read ------------------------------------------------------------------

const getOrgProfile = async (req, res) => {
  try {
    let profile = orgProfileService.getOrgProfile();
    if (!profile || profile.source === undefined) {
      profile = await orgProfileService.load({ silent: true });
    }
    res.json(profile);
  } catch (err) {
    logger.warn('[orgProfile] controller fell back to defaults:', err?.message);
    res.json({ ...orgProfileService.DEFAULTS, source: 'default' });
  }
};

// ---- branding edit (2.1) ---------------------------------------------------

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const str = (v) => (v === undefined || v === null ? undefined : String(v).trim());

/** PUT /api/org-profile — update the active org's branding/profile. */
const updateOrgProfile = async (req, res) => {
  const b = req.body || {};

  // Validate any colours provided are hex; ignore unknown keys.
  let colors;
  if (b.colors && typeof b.colors === 'object') {
    colors = {};
    for (const [k, v] of Object.entries(b.colors)) {
      const val = str(v);
      if (val === undefined || val === '') continue;
      if (!HEX.test(val)) {
        return res.status(400).json({ message: `Colour "${k}" must be a hex value like #1D4ED8.` });
      }
      colors[k] = val;
    }
  }

  const fields = {
    name: str(b.name),
    product: str(b.product),
    tagline: str(b.tagline),
    email: str(b.email),
    phone: str(b.phone),
    website: str(b.website),
    logoPath: str(b.logoPath),
    locale: str(b.locale),
    code: str(b.code),
    ...(colors ? { colors } : {}),
  };

  try {
    const profile = await orgProfileService.save(fields);
    res.json({ message: 'Saved', profile });
  } catch (err) {
    const missing = err?.code === 'ORG_PROFILE_TABLE_MISSING';
    logger.error('[orgProfile] save error:', err?.message);
    res.status(missing ? 409 : 500).json({
      message: missing
        ? 'org_profile table not found — run database migrations first (npm run migrate).'
        : 'Failed to save branding.',
    });
  }
};

// ---- logo upload (2.1) — reuses the multer pattern from documentUploadRoutes -

const LOGO_DIR = path.join(__dirname, '..', '..', 'uploads', 'branding');
const ALLOWED_LOGO_EXT = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'];
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB

const logoStorage = multer.diskStorage({
  destination(req, file, cb) {
    fs.mkdirSync(LOGO_DIR, { recursive: true });
    cb(null, LOGO_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: MAX_LOGO_SIZE },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_LOGO_EXT.includes(ext)) cb(null, true);
    else cb(new Error(`Security: image type ${ext} is not allowed.`), false);
  },
}).single('logo');

/**
 * POST /api/org-profile/logo — accept one image, save it, and return an absolute
 * URL the frontend can load via <img> (cross-origin in dev, same-origin in prod).
 * Does NOT persist LOGO_PATH itself — the client sends it back in a subsequent PUT.
 */
const uploadLogo = (req, res) => {
  logoUpload(req, res, (err) => {
    if (err) {
      const isSize = err.code === 'LIMIT_FILE_SIZE';
      return res.status(400).json({
        message: isSize ? 'Logo must be 2MB or smaller.' : (String(err.message || '').includes('Security:') ? 'Only image files are allowed.' : 'Logo upload failed.'),
      });
    }
    if (!req.file) return res.status(400).json({ message: 'No logo file received (field name must be "logo").' });
    const logoPath = `${req.protocol}://${req.get('host')}/branding/${req.file.filename}`;
    res.json({ message: 'Uploaded', logoPath });
  });
};

module.exports = { getOrgProfile, updateOrgProfile, uploadLogo, LOGO_DIR };
