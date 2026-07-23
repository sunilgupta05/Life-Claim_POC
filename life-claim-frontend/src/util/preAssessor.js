import { coalesceRoles, isPreAssessorRoleName } from './workflowRole'

export function isPreAssessorRole(userRole, roles = []) {
  const list = coalesceRoles(roles, userRole)
  return list.some(isPreAssessorRoleName)
}
