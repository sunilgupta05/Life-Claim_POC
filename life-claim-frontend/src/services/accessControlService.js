// src/services/accessControlService.js
//
// Frontend client for the RBAC admin API (roadmap 1.5). Wraps the /api/rbac
// endpoints built in 1.1 (roles, permissions, matrix) + 1.5 (modules) using the
// shared axios client (credentials/cookies included).

import api from './api'

const rbac = {
  // Modules (module list is readable by any authenticated user; writes are superuser)
  getModules: () => api.get('/rbac/modules').then((r) => r.data.items || []),
  setModuleEnabled: (key, enabled) => api.patch(`/rbac/modules/${encodeURIComponent(key)}/enabled`, { enabled }).then((r) => r.data),
  setModuleRoles: (key, allowedRoles) => api.patch(`/rbac/modules/${encodeURIComponent(key)}/roles`, { allowedRoles }).then((r) => r.data),

  // Roles
  getRoles: () => api.get('/rbac/roles').then((r) => r.data.items || []),
  createRole: (body) => api.post('/rbac/roles', body).then((r) => r.data),
  updateRole: (key, body) => api.put(`/rbac/roles/${encodeURIComponent(key)}`, body).then((r) => r.data),
  setRoleEnabled: (key, enabled) => api.patch(`/rbac/roles/${encodeURIComponent(key)}/enabled`, { enabled }).then((r) => r.data),
  deleteRole: (key) => api.delete(`/rbac/roles/${encodeURIComponent(key)}`).then((r) => r.data),

  // Permissions
  getPermissions: () => api.get('/rbac/permissions').then((r) => r.data.items || []),
  createPermission: (body) => api.post('/rbac/permissions', body).then((r) => r.data),
  updatePermission: (key, body) => api.put(`/rbac/permissions/${encodeURIComponent(key)}`, body).then((r) => r.data),
  setPermissionEnabled: (key, enabled) => api.patch(`/rbac/permissions/${encodeURIComponent(key)}/enabled`, { enabled }).then((r) => r.data),
  deletePermission: (key) => api.delete(`/rbac/permissions/${encodeURIComponent(key)}`).then((r) => r.data),

  // Matrix
  getMatrix: () => api.get('/rbac/matrix').then((r) => r.data),
  setRolePermission: (roleKey, permKey, enabled) =>
    api.patch(`/rbac/roles/${encodeURIComponent(roleKey)}/permissions/${encodeURIComponent(permKey)}`, { enabled }).then((r) => r.data),
}

export default rbac
