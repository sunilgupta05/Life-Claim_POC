// src/dataAccess/rbacModuleDao.js
//
// Data access for per-module access config (roadmap 1.5): the rbac_module table
// (migration 0007). Raw mysql2 pool, mirroring rbacDao.js — tolerant of the
// table not existing yet so the frontend registry keeps using its defaults.

const db = require('../config/dbConfig');

const TABLE_MISSING = 'RBAC_TABLE_MISSING';

function wrapMissing(err) {
  if (err && (err.errno === 1146 || err.code === 'ER_NO_SUCH_TABLE')) {
    const e = new Error(TABLE_MISSING);
    e.code = TABLE_MISSING;
    return e;
  }
  return err;
}

async function getModules() {
  try {
    const [rows] = await db.query(
      `SELECT ID, MODULE_KEY, LABEL, PATH, IS_ENABLED, ALLOWED_ROLES, IS_SYSTEM,
              SORT_ORDER, CREATED_AT, UPDATED_AT
         FROM rbac_module
        ORDER BY SORT_ORDER, LABEL`
    );
    return rows;
  } catch (err) {
    throw wrapMissing(err);
  }
}

/** Insert or update a module, keyed by MODULE_KEY. allowedRoles: array|null. */
async function upsertModule({ moduleKey, label, path = null, isEnabled = true, allowedRoles = null, isSystem = false, sortOrder = 0 }) {
  const rolesJson = allowedRoles === null || allowedRoles === undefined ? null : JSON.stringify(allowedRoles);
  try {
    await db.query(
      `INSERT INTO rbac_module
         (MODULE_KEY, LABEL, PATH, IS_ENABLED, ALLOWED_ROLES, IS_SYSTEM, SORT_ORDER)
       VALUES (?, ?, ?, ?, CAST(? AS JSON), ?, ?)
       ON DUPLICATE KEY UPDATE
         LABEL         = VALUES(LABEL),
         PATH          = VALUES(PATH),
         IS_ENABLED    = VALUES(IS_ENABLED),
         ALLOWED_ROLES = VALUES(ALLOWED_ROLES),
         SORT_ORDER    = VALUES(SORT_ORDER)`,
      [moduleKey, label, path, isEnabled ? 1 : 0, rolesJson, isSystem ? 1 : 0, sortOrder]
    );
  } catch (err) {
    throw wrapMissing(err);
  }
}

async function setModuleEnabled(moduleKey, isEnabled) {
  try {
    const [res] = await db.query(
      `UPDATE rbac_module SET IS_ENABLED = ? WHERE MODULE_KEY = ?`,
      [isEnabled ? 1 : 0, moduleKey]
    );
    return res.affectedRows > 0;
  } catch (err) {
    throw wrapMissing(err);
  }
}

async function setModuleRoles(moduleKey, allowedRoles) {
  const rolesJson = allowedRoles === null || allowedRoles === undefined ? null : JSON.stringify(allowedRoles);
  try {
    const [res] = await db.query(
      `UPDATE rbac_module SET ALLOWED_ROLES = CAST(? AS JSON) WHERE MODULE_KEY = ?`,
      [rolesJson, moduleKey]
    );
    return res.affectedRows > 0;
  } catch (err) {
    throw wrapMissing(err);
  }
}

async function deleteModule(moduleKey) {
  try {
    const [res] = await db.query(`DELETE FROM rbac_module WHERE MODULE_KEY = ?`, [moduleKey]);
    return res.affectedRows > 0;
  } catch (err) {
    throw wrapMissing(err);
  }
}

module.exports = {
  TABLE_MISSING,
  getModules,
  upsertModule,
  setModuleEnabled,
  setModuleRoles,
  deleteModule,
};
