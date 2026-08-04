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

module.exports = { getActiveOrgProfile };
