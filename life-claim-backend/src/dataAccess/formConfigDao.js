// src/dataAccess/formConfigDao.js
//
// Data access for per-form field overrides (roadmap 2.3): the form_field_config
// table (migration 0010). Raw mysql2 pool, table-missing tolerant (mirrors
// rbacModuleDao) so the frontend keeps using its base schemas if unmigrated.

const db = require('../config/dbConfig');

const TABLE_MISSING = 'FORM_CONFIG_TABLE_MISSING';

function wrapMissing(err) {
  if (err && (err.errno === 1146 || err.code === 'ER_NO_SUCH_TABLE')) {
    const e = new Error(TABLE_MISSING);
    e.code = TABLE_MISSING;
    return e;
  }
  return err;
}

/** All overrides across every form. */
async function getAll() {
  try {
    const [rows] = await db.query(
      `SELECT FORM_KEY, FIELD_NAME, IS_VISIBLE, IS_REQUIRED, SORT_ORDER
         FROM form_field_config
        ORDER BY FORM_KEY, SORT_ORDER, FIELD_NAME`
    );
    return rows;
  } catch (err) {
    throw wrapMissing(err);
  }
}

/** Insert/update one field override. isRequired null = inherit schema default. */
async function upsertField({ formKey, fieldName, isVisible = true, isRequired = null, sortOrder = 0 }) {
  try {
    await db.query(
      `INSERT INTO form_field_config (FORM_KEY, FIELD_NAME, IS_VISIBLE, IS_REQUIRED, SORT_ORDER)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         IS_VISIBLE  = VALUES(IS_VISIBLE),
         IS_REQUIRED = VALUES(IS_REQUIRED),
         SORT_ORDER  = VALUES(SORT_ORDER)`,
      [formKey, fieldName, isVisible ? 1 : 0, isRequired === null || isRequired === undefined ? null : (isRequired ? 1 : 0), sortOrder]
    );
  } catch (err) {
    throw wrapMissing(err);
  }
}

/** Remove all overrides for a form (revert to base schema). */
async function deleteForm(formKey) {
  try {
    const [res] = await db.query(`DELETE FROM form_field_config WHERE FORM_KEY = ?`, [formKey]);
    return res.affectedRows;
  } catch (err) {
    throw wrapMissing(err);
  }
}

module.exports = { TABLE_MISSING, getAll, upsertField, deleteForm };
