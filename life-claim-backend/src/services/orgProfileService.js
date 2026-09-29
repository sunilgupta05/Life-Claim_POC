// src/services/orgProfileService.js
//
// Active-organization profile service (roadmap 0.2).
//
// Loads the single org_profile row at startup, caches it, and serves it to the
// frontend (replacing the hardcoded companyBrand.js). Crucially, this is
// *non-breaking*: if the org_profile table has not been migrated yet, or the
// row is missing, or the DB read fails, the service returns built-in DEFAULTS
// that reproduce the current Dark Horse Digital branding exactly. The app never
// depends on this feature being provisioned.

const logger = require('../util/logger');
const { getActiveOrgProfile, updateActiveOrgProfile } = require('../dataAccess/orgProfileDao');

// Mirror of life-claim-frontend/src/config/companyBrand.js — the safety net.
const DEFAULTS = Object.freeze({
  name: 'Dark Horse Digital',
  code: 'DHDIGITAL',
  product: 'Life Claims Platform',
  tagline: 'Driving Digital Transformation',
  email: 'claimssupport@dhdigital.co.in',
  phone: '+91 98923 94104',
  website: 'www.dhdigital.co.in',
  logoPath: '/company-logo.png',
  locale: 'en-IN',
  enabledModules: [
    'dashboard', 'superuser-overview', 'superuser-claims', 'policy',
    'claims', 'pool', 'tasks', 'add', 'audit-log',
  ],
  colors: {
    primary: '#1D4ED8',
    accent: '#8B1A2B',
    text: '#0F172A',
    muted: '#64748B',
    border: '#E2E8F0',
    headerBg: '#F8FAFC',
  },
});

let cache = null; // last successfully-loaded profile ({...}, source:'db'|'default')

// JSON columns come back parsed by mysql2, but tolerate a raw string too.
function asJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapRow(row) {
  return {
    name: row.ORG_NAME || DEFAULTS.name,
    code: row.ORG_CODE || DEFAULTS.code,
    product: row.PRODUCT_NAME || DEFAULTS.product,
    tagline: row.TAGLINE || DEFAULTS.tagline,
    email: row.SUPPORT_EMAIL || DEFAULTS.email,
    phone: row.SUPPORT_PHONE || DEFAULTS.phone,
    website: row.WEBSITE || DEFAULTS.website,
    logoPath: row.LOGO_PATH || DEFAULTS.logoPath,
    locale: row.LOCALE || DEFAULTS.locale,
    enabledModules: asJson(row.ENABLED_MODULES, DEFAULTS.enabledModules),
    colors: { ...DEFAULTS.colors, ...asJson(row.BRAND_COLORS, {}) },
    source: 'db',
  };
}

/**
 * Load the profile from the DB into cache. Best-effort: on any problem it
 * caches (and returns) DEFAULTS so callers always get a usable profile.
 * Safe to call at startup and to re-call to refresh.
 */
async function load({ silent = false } = {}) {
  try {
    const row = await getActiveOrgProfile();
    if (row) {
      cache = mapRow(row);
      if (!silent) {
        logger.info(`[orgProfile] loaded active org "${cache.name}" (${cache.code}) from DB.`);
      }
      return cache;
    }
    cache = { ...DEFAULTS, source: 'default' };
    if (!silent) {
      logger.info('[orgProfile] org_profile table empty — using built-in defaults.');
    }
  } catch (err) {
    cache = { ...DEFAULTS, source: 'default' };
    if (!silent) {
      const why =
        err && err.code === 'ORG_PROFILE_TABLE_MISSING'
          ? 'org_profile table not migrated yet (run npm run migrate)'
          : (err && err.message) || 'unknown error';
      logger.warn(`[orgProfile] using built-in defaults — ${why}.`);
    }
  }
  return cache;
}

/** Synchronous accessor — returns the cached profile, or DEFAULTS if not loaded. */
function getOrgProfile() {
  return cache || { ...DEFAULTS, source: 'default' };
}

/** Drop the cache so the next load() re-reads the DB (used by tests / future admin save). */
function clearCache() {
  cache = null;
}

/**
 * Persist branding/profile edits (roadmap 2.1) then hot-reload the cache so the
 * change takes effect immediately (the public GET /api/org-profile reflects it,
 * and the frontend re-hydrates on next load). `fields` uses the same camelCase
 * shape returned by getOrgProfile().
 */
async function save(fields) {
  await updateActiveOrgProfile(fields);
  clearCache();
  return load({ silent: true });
}

module.exports = { load, getOrgProfile, clearCache, save, DEFAULTS };
