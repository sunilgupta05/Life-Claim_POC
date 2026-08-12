// src/dataAccess/rbacDao.js
//
// Data access for the dynamic RBAC model (roadmap 1.1): the rbac_role,
// rbac_permission and rbac_role_permission tables added in migration 0005.
// Uses the raw mysql2 pool (repo DAO convention, mirrors appConfigDao.js).
//
// Every method tolerates the rbac_* tables not existing yet (migration 0005 not
// run) by surfacing a distinct coded error, so rbacService can fall back to an
// empty snapshot silently instead of crashing an un-migrated environment.

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

// ---- reads -----------------------------------------------------------------

/** All roles. Throws RBAC_TABLE_MISSING if the table is absent. */
async function getRoles() {
  try {
    const [rows] = await db.query(
      `SELECT ID, ROLE_KEY, ROLE_NAME, DESCRIPTION, IS_SYSTEM, IS_ENABLED,
              SORT_ORDER, CREATED_AT, UPDATED_AT
         FROM rbac_role
        ORDER BY SORT_ORDER, ROLE_NAME`
    );
    return rows;
  } catch (err) {
    throw wrapMissing(err);
  }
}

/** All permissions. */
async function getPermissions() {
  try {
    const [rows] = await db.query(
      `SELECT ID, PERMISSION_KEY, PERMISSION_NAME, MODULE, DESCRIPTION,
              IS_ENABLED, CREATED_AT, UPDATED_AT
         FROM rbac_permission
        ORDER BY MODULE, PERMISSION_KEY`
    );
    return rows;
  } catch (err) {
    throw wrapMissing(err);
  }
}

/** All role->permission mappings (raw ID pairs + the mapping enable flag). */
async function getRolePermissions() {
  try {
    const [rows] = await db.query(
      `SELECT ROLE_ID, PERMISSION_ID, IS_ENABLED
         FROM rbac_role_permission`
    );
    return rows;
  } catch (err) {
    throw wrapMissing(err);
  }
}

// ---- role writes -----------------------------------------------------------

/** Insert or update a role, keyed by ROLE_KEY. */
async function upsertRole({ roleKey, roleName, description = null, isSystem = false, isEnabled = true, sortOrder = 0 }) {
  try {
    await db.query(
      `INSERT INTO rbac_role
         (ROLE_KEY, ROLE_NAME, DESCRIPTION, IS_SYSTEM, IS_ENABLED, SORT_ORDER)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         ROLE_NAME   = VALUES(ROLE_NAME),
         DESCRIPTION = VALUES(DESCRIPTION),
         IS_ENABLED  = VALUES(IS_ENABLED),
         SORT_ORDER  = VALUES(SORT_ORDER)`,
      [roleKey, roleName, description, isSystem ? 1 : 0, isEnabled ? 1 : 0, sortOrder]
    );
  } catch (err) {
    throw wrapMissing(err);
  }
}

/** Toggle only a role's enabled flag. */
async function setRoleEnabled(roleKey, isEnabled) {
  try {
    const [res] = await db.query(
      `UPDATE rbac_role SET IS_ENABLED = ? WHERE ROLE_KEY = ?`,
      [isEnabled ? 1 : 0, roleKey]
    );
    return res.affectedRows > 0;
  } catch (err) {
    throw wrapMissing(err);
  }
}

/** Delete a role by key (mappings cascade via FK). */
async function deleteRole(roleKey) {
  try {
    const [res] = await db.query(`DELETE FROM rbac_role WHERE ROLE_KEY = ?`, [roleKey]);
    return res.affectedRows > 0;
  } catch (err) {
    throw wrapMissing(err);
  }
}

// ---- permission writes -----------------------------------------------------

/** Insert or update a permission, keyed by PERMISSION_KEY. */
async function upsertPermission({ permissionKey, permissionName, module = null, description = null, isEnabled = true }) {
  try {
    await db.query(
      `INSERT INTO rbac_permission
         (PERMISSION_KEY, PERMISSION_NAME, MODULE, DESCRIPTION, IS_ENABLED)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         PERMISSION_NAME = VALUES(PERMISSION_NAME),
         MODULE          = VALUES(MODULE),
         DESCRIPTION     = VALUES(DESCRIPTION),
         IS_ENABLED      = VALUES(IS_ENABLED)`,
      [permissionKey, permissionName, module, description, isEnabled ? 1 : 0]
    );
  } catch (err) {
    throw wrapMissing(err);
  }
}

/** Toggle only a permission's enabled flag. */
async function setPermissionEnabled(permissionKey, isEnabled) {
  try {
    const [res] = await db.query(
      `UPDATE rbac_permission SET IS_ENABLED = ? WHERE PERMISSION_KEY = ?`,
      [isEnabled ? 1 : 0, permissionKey]
    );
    return res.affectedRows > 0;
  } catch (err) {
    throw wrapMissing(err);
  }
}

/** Delete a permission by key (mappings cascade via FK). */
async function deletePermission(permissionKey) {
  try {
    const [res] = await db.query(
      `DELETE FROM rbac_permission WHERE PERMISSION_KEY = ?`,
      [permissionKey]
    );
    return res.affectedRows > 0;
  } catch (err) {
    throw wrapMissing(err);
  }
}

// ---- mapping writes --------------------------------------------------------

/**
 * Grant (or update the enabled flag of) a single role->permission mapping,
 * resolving the role/permission by their business keys. Returns false when
 * either key does not exist (nothing inserted).
 */
async function setRolePermission(roleKey, permissionKey, isEnabled = true) {
  try {
    const [res] = await db.query(
      `INSERT INTO rbac_role_permission (ROLE_ID, PERMISSION_ID, IS_ENABLED)
       SELECT r.ID, p.ID, ?
         FROM rbac_role r
         JOIN rbac_permission p ON p.PERMISSION_KEY = ?
        WHERE r.ROLE_KEY = ?
       ON DUPLICATE KEY UPDATE IS_ENABLED = VALUES(IS_ENABLED)`,
      [isEnabled ? 1 : 0, permissionKey, roleKey]
    );
    return res.affectedRows > 0;
  } catch (err) {
    throw wrapMissing(err);
  }
}

/** Remove a single role->permission mapping (revoke). */
async function removeRolePermission(roleKey, permissionKey) {
  try {
    const [res] = await db.query(
      `DELETE rrp FROM rbac_role_permission rrp
         JOIN rbac_role r       ON r.ID = rrp.ROLE_ID
         JOIN rbac_permission p ON p.ID = rrp.PERMISSION_ID
        WHERE r.ROLE_KEY = ? AND p.PERMISSION_KEY = ?`,
      [roleKey, permissionKey]
    );
    return res.affectedRows > 0;
  } catch (err) {
    throw wrapMissing(err);
  }
}

/**
 * Replace the full permission set for one role in a single transaction: any
 * permission key in `permissionKeys` is granted, everything else for that role
 * is revoked. Returns the number of permissions now granted.
 */
async function replaceRolePermissions(roleKey, permissionKeys = []) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [roleRows] = await conn.query(
      `SELECT ID FROM rbac_role WHERE ROLE_KEY = ?`,
      [roleKey]
    );
    if (!roleRows.length) {
      await conn.rollback();
      return null; // role not found
    }
    const roleId = roleRows[0].ID;

    await conn.query(`DELETE FROM rbac_role_permission WHERE ROLE_ID = ?`, [roleId]);

    let granted = 0;
    if (permissionKeys.length) {
      const [insRes] = await conn.query(
        `INSERT INTO rbac_role_permission (ROLE_ID, PERMISSION_ID, IS_ENABLED)
         SELECT ?, p.ID, 1
           FROM rbac_permission p
          WHERE p.PERMISSION_KEY IN (?)`,
        [roleId, permissionKeys]
      );
      granted = insRes.affectedRows;
    }

    await conn.commit();
    return granted;
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    throw wrapMissing(err);
  } finally {
    conn.release();
  }
}

module.exports = {
  TABLE_MISSING,
  getRoles,
  getPermissions,
  getRolePermissions,
  upsertRole,
  setRoleEnabled,
  deleteRole,
  upsertPermission,
  setPermissionEnabled,
  deletePermission,
  setRolePermission,
  removeRolePermission,
  replaceRolePermissions,
};
