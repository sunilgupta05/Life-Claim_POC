import { normRole, coalesceRoles, primaryOperationalRole, formatWorkflowRoleLabel } from './workflowRole'

export const SUPERUSER_LABEL = 'Super User'
export const SUPERUSER_USERNAME = 'superuser'
export const SUPERUSER_ROUTE_ROLES = ['superuser', 'Super User', 'Superuser']

export function isSuperUserRole(role) {
  const n = normRole(role)
  return n === 'superuser' || n === 'super user'
}

export function isSuperUserUsername(username) {
  return normRole(username) === 'superuser'
}

/** Retired legacy admin account — use superuser instead. */
export function isRetiredAdminUsername(username) {
  return normRole(username) === 'admin'
}

export function hasSuperUserRole(roles = []) {
  return (Array.isArray(roles) ? roles : []).some(isSuperUserRole)
}

/** Realm role `superuser` or Keycloak username `superuser`. */
export function hasSuperUserAccess(roles = [], username = '') {
  return hasSuperUserRole(roles) || isSuperUserUsername(username)
}

/** Super User with no operational workflow roles — lands on /superuser shell only. */
export function isSuperUserOnlyUser(roles = [], username = '') {
  const OPERATIONAL = ['pre assessor', 'assessor', 'verifier', 'clerk', 'business']
  const list = Array.isArray(roles) ? roles : []
  const hasSuper = hasSuperUserAccess(list, username)
  const hasOperational = list.some((r) => OPERATIONAL.includes(normRole(r)))
  return hasSuper && !hasOperational
}

export function formatSuperUserLabel(role) {
  return isSuperUserRole(role) ? SUPERUSER_LABEL : formatWorkflowRoleLabel(role)
}

export function resolveDisplayRole(roles = [], fallback = '') {
  if (isSuperUserUsername(fallback)) return SUPERUSER_LABEL
  const list = coalesceRoles(roles)
  const superRole = list.find(isSuperUserRole)
  const workflowRole = primaryOperationalRole(list)
  if (!workflowRole && superRole) return SUPERUSER_LABEL
  if (workflowRole) return formatWorkflowRoleLabel(workflowRole)
  if (superRole) return SUPERUSER_LABEL
  const named = list.find((r) => {
    const n = normRole(r)
    return n && !n.startsWith('default') && n !== 'offline access' && n !== 'uma authorization'
  })
  return named ? formatWorkflowRoleLabel(named) : fallback
}
