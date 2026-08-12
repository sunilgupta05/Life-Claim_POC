// src/controllers/rbacController.js
//
// Admin API over the dynamic RBAC service (roadmap 1.1). Lets a superuser view
// and edit roles, permissions and their mappings at runtime; saves hot-reload
// immediately (no restart). A dedicated admin UI is a later roadmap item — this
// is the backend it will use. Mirrors the shape of configController.js.

const rbacService = require('../services/rbacService');
const { hasSuperUserAccess } = require('../util/superuserRoles');

// Map the coded "tables not migrated" error to HTTP 409 with actionable text,
// exactly as configController does for app_config.
function sendError(res, err, fallback) {
  const missing = err?.code === 'RBAC_TABLE_MISSING';
  if (missing) {
    return res.status(409).json({
      message: 'rbac_* tables not found — run database migrations first (npm run migrate).',
    });
  }
  console.error('[rbac] error:', err?.message);
  return res.status(500).json({ message: fallback });
}

const str = (v) => (v === undefined || v === null ? '' : String(v).trim());

// ---- status ----------------------------------------------------------------

const getStatus = async (req, res) => {
  res.json({ status: rbacService.status() });
};

// ---- roles -----------------------------------------------------------------

const listRoles = async (req, res) => {
  res.json({ items: rbacService.getRoles() });
};

const createRole = async (req, res) => {
  const name = str(req.body?.name || req.body?.roleName);
  if (!name) return res.status(400).json({ message: 'name is required' });
  const key = str(req.body?.key);
  try {
    const roleKey = await rbacService.createRole({
      key: key || name,
      name,
      description: req.body?.description ?? null,
      isEnabled: req.body?.isEnabled !== undefined ? !!req.body.isEnabled : true,
      sortOrder: Number.isFinite(Number(req.body?.sortOrder)) ? Number(req.body.sortOrder) : 0,
    });
    res.status(201).json({ message: 'Created', key: roleKey });
  } catch (err) {
    sendError(res, err, 'Failed to create role');
  }
};

const updateRole = async (req, res) => {
  const key = str(req.params.key);
  try {
    const ok = await rbacService.updateRole(key, {
      name: req.body?.name,
      description: req.body?.description,
      isEnabled: req.body?.isEnabled,
      sortOrder: req.body?.sortOrder,
    });
    if (!ok) return res.status(404).json({ message: `Role '${key}' not found` });
    res.json({ message: 'Saved', key });
  } catch (err) {
    sendError(res, err, 'Failed to update role');
  }
};

const setRoleEnabled = async (req, res) => {
  const key = str(req.params.key);
  if (req.body?.enabled === undefined) {
    return res.status(400).json({ message: 'enabled (boolean) is required' });
  }
  try {
    const ok = await rbacService.setRoleEnabled(key, !!req.body.enabled);
    if (!ok) return res.status(404).json({ message: `Role '${key}' not found` });
    res.json({ message: 'Saved', key, enabled: !!req.body.enabled });
  } catch (err) {
    sendError(res, err, 'Failed to update role');
  }
};

const deleteRole = async (req, res) => {
  const key = str(req.params.key);
  const role = rbacService.getRoles().find((r) => r.key === key);
  if (role && role.isSystem) {
    return res.status(400).json({ message: `Role '${key}' is a system role and cannot be deleted (disable it instead).` });
  }
  try {
    const ok = await rbacService.deleteRole(key);
    if (!ok) return res.status(404).json({ message: `Role '${key}' not found` });
    res.json({ message: 'Deleted', key });
  } catch (err) {
    sendError(res, err, 'Failed to delete role');
  }
};

// ---- permissions -----------------------------------------------------------

const listPermissions = async (req, res) => {
  res.json({ items: rbacService.getPermissions() });
};

const createPermission = async (req, res) => {
  const key = str(req.body?.key);
  const name = str(req.body?.name || req.body?.permissionName);
  if (!key) return res.status(400).json({ message: 'key is required (e.g. "claims.view")' });
  if (!name) return res.status(400).json({ message: 'name is required' });
  try {
    await rbacService.createPermission({
      key,
      name,
      module: req.body?.module ?? null,
      description: req.body?.description ?? null,
      isEnabled: req.body?.isEnabled !== undefined ? !!req.body.isEnabled : true,
    });
    res.status(201).json({ message: 'Created', key });
  } catch (err) {
    sendError(res, err, 'Failed to create permission');
  }
};

const updatePermission = async (req, res) => {
  const key = str(req.params.key);
  try {
    const ok = await rbacService.updatePermission(key, {
      name: req.body?.name,
      module: req.body?.module,
      description: req.body?.description,
      isEnabled: req.body?.isEnabled,
    });
    if (!ok) return res.status(404).json({ message: `Permission '${key}' not found` });
    res.json({ message: 'Saved', key });
  } catch (err) {
    sendError(res, err, 'Failed to update permission');
  }
};

const setPermissionEnabled = async (req, res) => {
  const key = str(req.params.key);
  if (req.body?.enabled === undefined) {
    return res.status(400).json({ message: 'enabled (boolean) is required' });
  }
  try {
    const ok = await rbacService.setPermissionEnabled(key, !!req.body.enabled);
    if (!ok) return res.status(404).json({ message: `Permission '${key}' not found` });
    res.json({ message: 'Saved', key, enabled: !!req.body.enabled });
  } catch (err) {
    sendError(res, err, 'Failed to update permission');
  }
};

const deletePermission = async (req, res) => {
  const key = str(req.params.key);
  try {
    const ok = await rbacService.deletePermission(key);
    if (!ok) return res.status(404).json({ message: `Permission '${key}' not found` });
    res.json({ message: 'Deleted', key });
  } catch (err) {
    sendError(res, err, 'Failed to delete permission');
  }
};

// ---- mappings --------------------------------------------------------------

const getMatrix = async (req, res) => {
  res.json({ roles: rbacService.getMatrix(), permissions: rbacService.getPermissions() });
};

/** PUT /roles/:key/permissions  body: { permissions: ["claims.view", ...] } */
const replaceRolePermissions = async (req, res) => {
  const key = str(req.params.key);
  const list = req.body?.permissions;
  if (!Array.isArray(list)) {
    return res.status(400).json({ message: 'permissions (array of permission keys) is required' });
  }
  try {
    const granted = await rbacService.replaceRolePermissions(key, list.map(str).filter(Boolean));
    if (granted === null) return res.status(404).json({ message: `Role '${key}' not found` });
    res.json({ message: 'Saved', key, granted });
  } catch (err) {
    sendError(res, err, 'Failed to update role permissions');
  }
};

/** PATCH /roles/:roleKey/permissions/:permKey  body: { enabled: bool } (default grant) */
const setRolePermission = async (req, res) => {
  const roleKey = str(req.params.roleKey);
  const permKey = str(req.params.permKey);
  const enabled = req.body?.enabled === undefined ? true : !!req.body.enabled;
  try {
    const ok = await rbacService.setRolePermission(roleKey, permKey, enabled);
    if (!ok) return res.status(404).json({ message: `Role '${roleKey}' or permission '${permKey}' not found` });
    res.json({ message: 'Saved', roleKey, permKey, enabled });
  } catch (err) {
    sendError(res, err, 'Failed to update mapping');
  }
};

const removeRolePermission = async (req, res) => {
  const roleKey = str(req.params.roleKey);
  const permKey = str(req.params.permKey);
  try {
    const ok = await rbacService.removeRolePermission(roleKey, permKey);
    if (!ok) return res.status(404).json({ message: `Mapping for '${roleKey}'/'${permKey}' not found` });
    res.json({ message: 'Deleted', roleKey, permKey });
  } catch (err) {
    sendError(res, err, 'Failed to remove mapping');
  }
};

// ---- modules (roadmap 1.5) -------------------------------------------------

// Readable by any authenticated user so the frontend can hydrate its nav.
const listModules = async (req, res) => {
  res.json({ items: rbacService.getModules() });
};

const upsertModule = async (req, res) => {
  const key = str(req.params.key || req.body?.key);
  const label = str(req.body?.label);
  if (!key) return res.status(400).json({ message: 'module key is required' });
  if (!label) return res.status(400).json({ message: 'label is required' });
  const allowedRoles = req.body?.allowedRoles;
  if (allowedRoles !== undefined && allowedRoles !== null && !Array.isArray(allowedRoles)) {
    return res.status(400).json({ message: 'allowedRoles must be an array or null' });
  }
  try {
    await rbacService.upsertModule({
      key,
      label,
      path: req.body?.path ?? null,
      isEnabled: req.body?.isEnabled !== undefined ? !!req.body.isEnabled : true,
      allowedRoles: allowedRoles === undefined ? null : allowedRoles,
      sortOrder: Number.isFinite(Number(req.body?.sortOrder)) ? Number(req.body.sortOrder) : 0,
    });
    res.json({ message: 'Saved', key });
  } catch (err) {
    sendError(res, err, 'Failed to save module');
  }
};

const setModuleEnabled = async (req, res) => {
  const key = str(req.params.key);
  if (req.body?.enabled === undefined) {
    return res.status(400).json({ message: 'enabled (boolean) is required' });
  }
  try {
    const ok = await rbacService.setModuleEnabled(key, !!req.body.enabled);
    if (!ok) return res.status(404).json({ message: `Module '${key}' not found` });
    res.json({ message: 'Saved', key, enabled: !!req.body.enabled });
  } catch (err) {
    sendError(res, err, 'Failed to update module');
  }
};

const setModuleRoles = async (req, res) => {
  const key = str(req.params.key);
  const allowedRoles = req.body?.allowedRoles;
  if (allowedRoles !== null && !Array.isArray(allowedRoles)) {
    return res.status(400).json({ message: 'allowedRoles must be an array (or null for any role)' });
  }
  try {
    const ok = await rbacService.setModuleRoles(key, allowedRoles);
    if (!ok) return res.status(404).json({ message: `Module '${key}' not found` });
    res.json({ message: 'Saved', key, allowedRoles });
  } catch (err) {
    sendError(res, err, 'Failed to update module roles');
  }
};

const deleteModule = async (req, res) => {
  const key = str(req.params.key);
  const mod = rbacService.getModules().find((m) => m.key === key);
  if (mod && mod.isSystem) {
    return res.status(400).json({ message: `Module '${key}' is a system module and cannot be deleted (disable it instead).` });
  }
  try {
    const ok = await rbacService.deleteModule(key);
    if (!ok) return res.status(404).json({ message: `Module '${key}' not found` });
    res.json({ message: 'Deleted', key });
  } catch (err) {
    sendError(res, err, 'Failed to delete module');
  }
};

// ---- current user's effective permissions ----------------------------------
//
// Not superuser-only: any authenticated user may read their OWN effective
// permissions, so the frontend can gate UI later. (Reads req.user populated by
// the auth middleware.)
const getMyPermissions = async (req, res) => {
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  const username = req.user?.username || '';
  const isSuperuser = hasSuperUserAccess(roles, username);
  const permissions = isSuperuser
    ? rbacService.getPermissions().filter((p) => p.isEnabled).map((p) => p.key)
    : [...rbacService.permissionsForRoles(roles)];
  res.json({ username, roles, isSuperuser, permissions: permissions.sort() });
};

module.exports = {
  getStatus,
  listRoles,
  createRole,
  updateRole,
  setRoleEnabled,
  deleteRole,
  listPermissions,
  createPermission,
  updatePermission,
  setPermissionEnabled,
  deletePermission,
  getMatrix,
  replaceRolePermissions,
  setRolePermission,
  removeRolePermission,
  listModules,
  upsertModule,
  setModuleEnabled,
  setModuleRoles,
  deleteModule,
  getMyPermissions,
};
