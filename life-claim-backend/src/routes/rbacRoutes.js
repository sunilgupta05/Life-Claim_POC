// src/routes/rbacRoutes.js
//
// Dynamic RBAC admin API (roadmap 1.1), mounted at /api/rbac under the
// authenticated gate. Every route requires a valid session; all of them except
// GET /my-permissions additionally require superuser (same idiom as
// configRoutes / adminRoutes).

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requirePermission = require('../middleware/requirePermission');
const rbac = require('../controllers/rbacController');

const router = express.Router();

// Authenticate every RBAC route.
router.use(authMiddleware.authenticate);

// A user may read their OWN effective permissions (for future UI gating).
// Declared before the superuser gate so it stays available to all roles.
router.get('/my-permissions', rbac.getMyPermissions);

// Module access config (roadmap 1.5) is READABLE by any authenticated user so
// the frontend can hydrate its nav; writes are superuser-only (below the gate).
router.get('/modules', rbac.listModules);

// Everything below requires the RBAC-admin permission (roadmap 1.2). Only
// superuser holds admin.rbac.manage, so this stays superuser-only as before.
router.use(requirePermission('admin.rbac.manage'));

router.get('/status', rbac.getStatus);

// Roles
router.get('/roles', rbac.listRoles);
router.post('/roles', rbac.createRole);
router.put('/roles/:key', rbac.updateRole);
router.patch('/roles/:key/enabled', rbac.setRoleEnabled);
router.delete('/roles/:key', rbac.deleteRole);

// Role → permission mappings (declared before the generic :key routes are hit
// for permissions; Express matches by path so ordering here is for clarity).
router.put('/roles/:key/permissions', rbac.replaceRolePermissions);
router.patch('/roles/:roleKey/permissions/:permKey', rbac.setRolePermission);
router.delete('/roles/:roleKey/permissions/:permKey', rbac.removeRolePermission);

// Permissions
router.get('/permissions', rbac.listPermissions);
router.post('/permissions', rbac.createPermission);
router.put('/permissions/:key', rbac.updatePermission);
router.patch('/permissions/:key/enabled', rbac.setPermissionEnabled);
router.delete('/permissions/:key', rbac.deletePermission);

// Full roles × permissions matrix (admin UI).
router.get('/matrix', rbac.getMatrix);

// Modules — per-module enable + allowed-roles CRUD (roadmap 1.5, superuser-only).
router.post('/modules', rbac.upsertModule);
router.put('/modules/:key', rbac.upsertModule);
router.patch('/modules/:key/enabled', rbac.setModuleEnabled);
router.patch('/modules/:key/roles', rbac.setModuleRoles);
router.delete('/modules/:key', rbac.deleteModule);

module.exports = router;
