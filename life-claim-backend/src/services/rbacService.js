// src/services/rbacService.js
//
// Dynamic RBAC service (roadmap 1.1).
//
// One place to read the role / permission / role-permission model that now
// lives in the DB (migration 0005), replacing the hardcoded role-name strings
// scattered across the routes. Roles, permissions and their mappings become
// data an admin edits at runtime.
//
// Like the config service (src/config/configService.js) this keeps an in-memory
// snapshot that is warmed at startup, refreshed on a TTL backstop, and updated
// immediately after a write — so changes apply WITHOUT a server restart. It is
// best-effort: until init() runs, or if the rbac_* tables have not been
// migrated, the snapshot is empty and every permission check simply denies
// (except the built-in superuser bypass), so an un-migrated environment never
// crashes.
//
// FOUNDATION ONLY (roadmap 1.1): nothing here is wired into the existing
// authorize()/protect() route guards yet. It powers the opt-in
// requirePermission() middleware and the /api/rbac admin API.

const logger = require('../util/logger');
const dao = require('../dataAccess/rbacDao');
const moduleDao = require('../dataAccess/rbacModuleDao');
const { hasSuperUserRole } = require('../util/superuserRoles');

const DEFAULT_TTL_MS = 60 * 1000;

// snapshot: mirrors the three tables as plain arrays plus a few derived lookups.
let snapshot = emptySnapshot();
let ready = false;
let lastLoadedAt = 0;
let refreshTimer = null;
let warnedMissing = false;

function emptySnapshot() {
  return { roles: [], permissions: [], rolePermissions: [], modules: [] };
}

function ttlMs() {
  const raw = Number(process.env.RBAC_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_MS;
}

// ---- normalization ---------------------------------------------------------

// Canonical form for matching a JWT realm role (e.g. "Pre Assessor") to a
// stored ROLE_KEY ("pre-assessor") or ROLE_NAME ("Pre Assessor"): lowercase and
// collapse -, _ and whitespace to single spaces. Same idiom as superuserRoles.
function norm(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Turn a free-text role name into a stable slug key ("Claims Manager" -> "claims-manager"). */
function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---- pure resolution (unit-testable, no DB) --------------------------------

/**
 * Map a snapshot's rows into the effective permission-key Set for the given
 * user roles. A permission is effective only when its role, itself, and the
 * mapping row are ALL enabled. Superuser roles get every enabled permission.
 *
 * Exported so it can be tested against a hand-built snapshot with no DB.
 *
 * @param {{roles:Array,permissions:Array,rolePermissions:Array}} snap
 * @param {string[]} userRoles
 * @returns {Set<string>}
 */
function computeEffectivePermissions(snap, userRoles = []) {
  const roles = Array.isArray(snap?.roles) ? snap.roles : [];
  const permissions = Array.isArray(snap?.permissions) ? snap.permissions : [];
  const rolePermissions = Array.isArray(snap?.rolePermissions) ? snap.rolePermissions : [];
  const userRoleList = Array.isArray(userRoles) ? userRoles : [];

  const permById = new Map(permissions.map((p) => [p.ID, p]));

  // Superuser shortcut: all enabled permissions.
  if (hasSuperUserRole(userRoleList)) {
    return new Set(permissions.filter((p) => !!p.IS_ENABLED).map((p) => p.PERMISSION_KEY));
  }

  const wanted = new Set(userRoleList.map(norm).filter(Boolean));
  const matchedRoleIds = new Set(
    roles
      .filter((r) => !!r.IS_ENABLED && (wanted.has(norm(r.ROLE_KEY)) || wanted.has(norm(r.ROLE_NAME))))
      .map((r) => r.ID)
  );
  if (matchedRoleIds.size === 0) return new Set();

  const out = new Set();
  for (const rp of rolePermissions) {
    if (!rp.IS_ENABLED) continue;
    if (!matchedRoleIds.has(rp.ROLE_ID)) continue;
    const perm = permById.get(rp.PERMISSION_ID);
    if (perm && perm.IS_ENABLED) out.add(perm.PERMISSION_KEY);
  }
  return out;
}

// ---- loading ---------------------------------------------------------------

/** Reload the whole snapshot from the DB. Best-effort: never throws. */
async function reload() {
  try {
    const [roles, permissions, rolePermissions] = await Promise.all([
      dao.getRoles(),
      dao.getPermissions(),
      dao.getRolePermissions(),
    ]);
    // Modules (0007) are loaded independently so a DB that has 0005 but not yet
    // 0007 still serves roles/permissions (module list falls back to empty ⇒
    // the frontend registry keeps using its built-in defaults).
    let modules = [];
    try {
      modules = await moduleDao.getModules();
    } catch (mErr) {
      if (!(mErr && mErr.code === moduleDao.TABLE_MISSING)) {
        logger.warn('[rbac] module load failed, using registry defaults:', mErr?.message);
      }
    }
    snapshot = { roles, permissions, rolePermissions, modules };
    ready = true;
    lastLoadedAt = Date.now();
    return true;
  } catch (err) {
    // Tables missing (pre-migration) or transient DB error: keep whatever we
    // have and deny by default. Mark ready so accessors work immediately.
    ready = true;
    if (err && err.code === dao.TABLE_MISSING) {
      if (!warnedMissing) {
        logger.warn('[rbac] rbac_* tables not migrated yet — RBAC checks deny by default (run npm run migrate).');
        warnedMissing = true;
      }
    } else {
      logger.warn('[rbac] reload failed, keeping cached values:', err?.message);
    }
    return false;
  }
}

/** Load once at startup and start the TTL refresh backstop. */
async function init() {
  await reload();
  if (!refreshTimer) {
    refreshTimer = setInterval(() => { reload().catch(() => {}); }, ttlMs());
    if (typeof refreshTimer.unref === 'function') refreshTimer.unref();
  }
  return snapshot.roles.length;
}

// ---- reads (synchronous, off the cached snapshot) --------------------------

function getRoles() {
  return snapshot.roles.map((r) => ({
    id: r.ID,
    key: r.ROLE_KEY,
    name: r.ROLE_NAME,
    description: r.DESCRIPTION,
    isSystem: !!r.IS_SYSTEM,
    isEnabled: !!r.IS_ENABLED,
    sortOrder: r.SORT_ORDER,
  }));
}

function getPermissions() {
  return snapshot.permissions.map((p) => ({
    id: p.ID,
    key: p.PERMISSION_KEY,
    name: p.PERMISSION_NAME,
    module: p.MODULE,
    description: p.DESCRIPTION,
    isEnabled: !!p.IS_ENABLED,
  }));
}

/** Roles × their granted permission keys — the shape the admin matrix UI wants. */
function getMatrix() {
  const permById = new Map(snapshot.permissions.map((p) => [p.ID, p]));
  const byRole = new Map();
  for (const rp of snapshot.rolePermissions) {
    if (!byRole.has(rp.ROLE_ID)) byRole.set(rp.ROLE_ID, []);
    const perm = permById.get(rp.PERMISSION_ID);
    if (perm) {
      byRole.get(rp.ROLE_ID).push({ key: perm.PERMISSION_KEY, enabled: !!rp.IS_ENABLED });
    }
  }
  return snapshot.roles.map((r) => ({
    key: r.ROLE_KEY,
    name: r.ROLE_NAME,
    isEnabled: !!r.IS_ENABLED,
    isSystem: !!r.IS_SYSTEM,
    permissions: (byRole.get(r.ID) || []).sort((a, b) => (a.key < b.key ? -1 : 1)),
  }));
}

/** Per-module access config (roadmap 1.5) for the frontend registry + admin UI. */
function getModules() {
  return snapshot.modules.map((m) => ({
    key: m.MODULE_KEY,
    label: m.LABEL,
    path: m.PATH,
    isEnabled: !!m.IS_ENABLED,
    // ALLOWED_ROLES is JSON: null ⇒ any operational user; array ⇒ named roles.
    allowedRoles: Array.isArray(m.ALLOWED_ROLES)
      ? m.ALLOWED_ROLES
      : (m.ALLOWED_ROLES == null ? null : safeJsonArray(m.ALLOWED_ROLES)),
    isSystem: !!m.IS_SYSTEM,
    sortOrder: m.SORT_ORDER,
  }));
}

function safeJsonArray(v) {
  try { const p = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(p) ? p : null; }
  catch { return null; }
}

/** Effective permission-key Set for a user's roles (uses the live snapshot). */
function permissionsForRoles(userRoles = []) {
  return computeEffectivePermissions(snapshot, userRoles);
}

/**
 * Does the user (by their role names) hold `permissionKey`? Superuser always
 * passes. Denies when unmigrated/empty — safe default for the opt-in middleware.
 */
function hasPermission(userRoles = [], permissionKey) {
  if (!permissionKey) return false;
  if (hasSuperUserRole(Array.isArray(userRoles) ? userRoles : [])) return true;
  return permissionsForRoles(userRoles).has(permissionKey);
}

// ---- writes (persist, then hot-reload the snapshot) ------------------------

async function createRole({ key, name, description = null, isEnabled = true, sortOrder = 0 }) {
  const roleKey = slugify(key || name);
  await dao.upsertRole({ roleKey, roleName: name, description, isSystem: false, isEnabled, sortOrder });
  await reload();
  return roleKey;
}

async function updateRole(roleKey, { name, description, isEnabled, sortOrder }) {
  const existing = snapshot.roles.find((r) => r.ROLE_KEY === roleKey);
  if (!existing) return false;
  await dao.upsertRole({
    roleKey,
    roleName: name !== undefined ? name : existing.ROLE_NAME,
    description: description !== undefined ? description : existing.DESCRIPTION,
    isSystem: !!existing.IS_SYSTEM,
    isEnabled: isEnabled !== undefined ? isEnabled : !!existing.IS_ENABLED,
    sortOrder: sortOrder !== undefined ? sortOrder : existing.SORT_ORDER,
  });
  await reload();
  return true;
}

async function setRoleEnabled(roleKey, isEnabled) {
  const changed = await dao.setRoleEnabled(roleKey, isEnabled);
  await reload();
  return changed;
}

async function deleteRole(roleKey) {
  const changed = await dao.deleteRole(roleKey);
  await reload();
  return changed;
}

async function createPermission({ key, name, module = null, description = null, isEnabled = true }) {
  await dao.upsertPermission({ permissionKey: key, permissionName: name, module, description, isEnabled });
  await reload();
  return key;
}

async function updatePermission(permissionKey, { name, module, description, isEnabled }) {
  const existing = snapshot.permissions.find((p) => p.PERMISSION_KEY === permissionKey);
  if (!existing) return false;
  await dao.upsertPermission({
    permissionKey,
    permissionName: name !== undefined ? name : existing.PERMISSION_NAME,
    module: module !== undefined ? module : existing.MODULE,
    description: description !== undefined ? description : existing.DESCRIPTION,
    isEnabled: isEnabled !== undefined ? isEnabled : !!existing.IS_ENABLED,
  });
  await reload();
  return true;
}

async function setPermissionEnabled(permissionKey, isEnabled) {
  const changed = await dao.setPermissionEnabled(permissionKey, isEnabled);
  await reload();
  return changed;
}

async function deletePermission(permissionKey) {
  const changed = await dao.deletePermission(permissionKey);
  await reload();
  return changed;
}

async function setRolePermission(roleKey, permissionKey, isEnabled = true) {
  const changed = await dao.setRolePermission(roleKey, permissionKey, isEnabled);
  await reload();
  return changed;
}

async function removeRolePermission(roleKey, permissionKey) {
  const changed = await dao.removeRolePermission(roleKey, permissionKey);
  await reload();
  return changed;
}

async function replaceRolePermissions(roleKey, permissionKeys) {
  const result = await dao.replaceRolePermissions(roleKey, permissionKeys);
  await reload();
  return result; // null when the role does not exist, else count granted
}

// ---- module writes (roadmap 1.5) -------------------------------------------

async function upsertModule({ key, label, path = null, isEnabled = true, allowedRoles = null, sortOrder = 0 }) {
  await moduleDao.upsertModule({ moduleKey: key, label, path, isEnabled, allowedRoles, isSystem: false, sortOrder });
  await reload();
  return key;
}

async function setModuleEnabled(moduleKey, isEnabled) {
  const changed = await moduleDao.setModuleEnabled(moduleKey, isEnabled);
  await reload();
  return changed;
}

async function setModuleRoles(moduleKey, allowedRoles) {
  const changed = await moduleDao.setModuleRoles(moduleKey, allowedRoles);
  await reload();
  return changed;
}

async function deleteModule(moduleKey) {
  const changed = await moduleDao.deleteModule(moduleKey);
  await reload();
  return changed;
}

// ---- introspection ---------------------------------------------------------

function status() {
  return {
    ready,
    roles: snapshot.roles.length,
    permissions: snapshot.permissions.length,
    mappings: snapshot.rolePermissions.length,
    modules: snapshot.modules.length,
    lastLoadedAt: lastLoadedAt ? new Date(lastLoadedAt).toISOString() : null,
    ttlMs: ttlMs(),
  };
}

/** Test seam: swap the in-memory snapshot without a DB (used by unit tests). */
function __setSnapshotForTests(next) {
  snapshot = { ...emptySnapshot(), ...(next || {}) };
  ready = true;
}

module.exports = {
  init,
  reload,
  // reads
  getRoles,
  getPermissions,
  getMatrix,
  getModules,
  permissionsForRoles,
  hasPermission,
  // writes
  createRole,
  updateRole,
  setRoleEnabled,
  deleteRole,
  createPermission,
  updatePermission,
  setPermissionEnabled,
  deletePermission,
  setRolePermission,
  removeRolePermission,
  replaceRolePermissions,
  upsertModule,
  setModuleEnabled,
  setModuleRoles,
  deleteModule,
  // introspection / helpers
  status,
  slugify,
  computeEffectivePermissions,
  __setSnapshotForTests,
};
