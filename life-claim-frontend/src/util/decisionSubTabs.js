import { resolveWorkflowRole, coalesceRoles } from './workflowRole'

export const DECISION_SUB_TAB = {
  SYSTEM: 'System Decision',
  ACCESSOR: 'Accessor Decision',
  VERIFICATION: 'Verification',
  SUMMARY: 'Summary',
}

const ALL_TABS = [
  DECISION_SUB_TAB.SYSTEM,
  DECISION_SUB_TAB.ACCESSOR,
  DECISION_SUB_TAB.VERIFICATION,
  DECISION_SUB_TAB.SUMMARY,
]

/**
 * Pre Assessor: System + Summary
 * Assessor: System + Accessor + Summary
 * Verifier: all tabs
 */
export function getDecisionSubTabs(userRoles = [], options = {}) {
  const { userRole, claimRole, forcePreAssessor = false } = options
  const roles = coalesceRoles(userRoles, userRole)
  let workflow = resolveWorkflowRole(roles, claimRole)

  if (!workflow && forcePreAssessor) workflow = 'pre assessor'

  if (workflow === 'verifier') return [...ALL_TABS]
  if (workflow === 'assessor') {
    return [DECISION_SUB_TAB.SYSTEM, DECISION_SUB_TAB.ACCESSOR, DECISION_SUB_TAB.SUMMARY]
  }
  if (workflow === 'pre assessor') {
    return [DECISION_SUB_TAB.SYSTEM, DECISION_SUB_TAB.SUMMARY]
  }

  return [...ALL_TABS]
}
