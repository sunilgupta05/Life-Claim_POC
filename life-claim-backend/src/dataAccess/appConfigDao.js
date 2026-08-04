// src/dataAccess/appConfigDao.js
//
// Data access for the centralized config store (roadmap 0.3), using the raw
// mysql2 pool (repo DAO convention). All methods tolerate the app_config table
// not existing yet (migration 0004 not run) by surfacing a distinct code so the
// config service can fall back to .env silently.

const db = require('../config/dbConfig');

const TABLE_MISSING = 'APP_CONFIG_TABLE_MISSING';

function wrapMissing(err) {
  if (err && (err.errno === 1146 || err.code === 'ER_NO_SUCH_TABLE')) {
    const e = new Error(TABLE_MISSING);
    e.code = TABLE_MISSING;
    return e;
  }
  return err;
}

/** All config rows. Throws APP_CONFIG_TABLE_MISSING if the table is absent. */
async function getAll() {
  try {
    const [rows] = await db.query(
      `SELECT CONFIG_KEY, CONFIG_VALUE, VALUE_TYPE, CATEGORY, DESCRIPTION,
              IS_SECRET, UPDATED_BY, UPDATED_AT
         FROM app_config
        ORDER BY CATEGORY, CONFIG_KEY`
    );
    return rows;
  } catch (err) {
    throw wrapMissing(err);
  }
}

/** Insert or update a single key (upsert). */
async function upsert({ key, value, type = 'string', category = null, description = null, isSecret = false, actor = null }) {
  try {
    await db.query(
      `INSERT INTO app_config
         (CONFIG_KEY, CONFIG_VALUE, VALUE_TYPE, CATEGORY, DESCRIPTION, IS_SECRET, UPDATED_BY)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         CONFIG_VALUE = VALUES(CONFIG_VALUE),
         VALUE_TYPE   = VALUES(VALUE_TYPE),
         CATEGORY     = VALUES(CATEGORY),
         DESCRIPTION  = VALUES(DESCRIPTION),
         IS_SECRET    = VALUES(IS_SECRET),
         UPDATED_BY   = VALUES(UPDATED_BY)`,
      [key, value, type, category, description, isSecret ? 1 : 0, actor]
    );
  } catch (err) {
    throw wrapMissing(err);
  }
}

/** Remove a key. */
async function remove(key) {
  try {
    await db.query('DELETE FROM app_config WHERE CONFIG_KEY = ?', [key]);
  } catch (err) {
    throw wrapMissing(err);
  }
}

module.exports = { getAll, upsert, remove, TABLE_MISSING };
