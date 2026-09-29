// src/dataAccess/orgProfileDao.js
//
// Data access for the active-organization profile (roadmap 0.2).
// Reads the single active row from org_profile via the raw mysql2 pool
// (matching the repo's DAO convention).

const db = require('../config/dbConfig');

/**
 * Fetch the active organization profile row, or null if the table is empty.
 * Throws ORG_PROFILE_TABLE_MISSING if the table has not been migrated yet, so
 * the service layer can fall back to defaults without treating it as an error.
 */
async function getActiveOrgProfile() {
  try {
    const [rows] = await db.query(
      `SELECT ID, ORG_NAME, ORG_CODE, PRODUCT_NAME, TAGLINE, SUPPORT_EMAIL,
              SUPPORT_PHONE, WEBSITE, LOGO_PATH, LOCALE, ENABLED_MODULES,
              BRAND_COLORS, IS_ACTIVE, UPDATED_AT
         FROM org_profile
        WHERE IS_ACTIVE = 1
        ORDER BY ID ASC
        LIMIT 1`
    );
    return rows && rows.length ? rows[0] : null;
  } catch (err) {
    // 1146 = ER_NO_SUCH_TABLE — migration 0003 not applied yet.
    if (err && (err.errno === 1146 || err.code === 'ER_NO_SUCH_TABLE')) {
      const e = new Error('ORG_PROFILE_TABLE_MISSING');
      e.code = 'ORG_PROFILE_TABLE_MISSING';
      throw e;
    }
    throw err;
  }
}

/**
 * Update the single active org_profile row (roadmap 2.1 branding admin). If no
 * active row exists yet (fresh/empty table), inserts one. `fields` uses the
 * service's camelCase shape; only provided keys are written. Colours are stored
 * in the BRAND_COLORS JSON column.
 */
async function updateActiveOrgProfile(fields = {}) {
  const f = fields || {};
  const colorsJson = f.colors && typeof f.colors === 'object' ? JSON.stringify(f.colors) : null;

  try {
    const [res] = await db.query(
      `UPDATE org_profile
          SET ORG_NAME      = COALESCE(?, ORG_NAME),
              PRODUCT_NAME   = COALESCE(?, PRODUCT_NAME),
              TAGLINE        = COALESCE(?, TAGLINE),
              SUPPORT_EMAIL  = COALESCE(?, SUPPORT_EMAIL),
              SUPPORT_PHONE  = COALESCE(?, SUPPORT_PHONE),
              WEBSITE        = COALESCE(?, WEBSITE),
              LOGO_PATH      = COALESCE(?, LOGO_PATH),
              LOCALE         = COALESCE(?, LOCALE),
              BRAND_COLORS   = COALESCE(CAST(? AS JSON), BRAND_COLORS)
        WHERE IS_ACTIVE = 1
        ORDER BY ID ASC
        LIMIT 1`,
      [
        f.name ?? null, f.product ?? null, f.tagline ?? null, f.email ?? null,
        f.phone ?? null, f.website ?? null, f.logoPath ?? null, f.locale ?? null,
        colorsJson,
      ]
    );
    if (res.affectedRows > 0) return true;
  } catch (err) {
    if (!(err && (err.errno === 1146 || err.code === 'ER_NO_SUCH_TABLE'))) throw err;
    const e = new Error('ORG_PROFILE_TABLE_MISSING');
    e.code = 'ORG_PROFILE_TABLE_MISSING';
    throw e;
  }

  // No active row yet — insert one (ORG_CODE is NOT NULL/UNIQUE).
  await db.query(
    `INSERT INTO org_profile
       (ORG_NAME, ORG_CODE, PRODUCT_NAME, TAGLINE, SUPPORT_EMAIL, SUPPORT_PHONE,
        WEBSITE, LOGO_PATH, LOCALE, BRAND_COLORS, IS_ACTIVE)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), 1)`,
    [
      f.name || 'Organization', f.code || 'ORG', f.product || null, f.tagline || null,
      f.email || null, f.phone || null, f.website || null, f.logoPath || null,
      f.locale || 'en-IN', colorsJson || '{}',
    ]
  );
  return true;
}

module.exports = { getActiveOrgProfile, updateActiveOrgProfile };
