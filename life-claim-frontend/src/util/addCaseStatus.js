function normStatus(caseStatus) {
  return String(caseStatus || '').trim().toUpperCase()
}

export function isFinalizedByApprover(caseStatus) {
  const s = normStatus(caseStatus)
  return s.includes('APPROVED BY APPROVER') || s.includes('REJECTED BY APPROVER')
}

export function isCaseClosed(caseStatus) {
  return normStatus(caseStatus).includes('CASE CLOSED')
}

export function isMovedToReferred(caseStatus) {
  const s = normStatus(caseStatus)
  return s.includes('MOVED TO BE REFFERED') || s.includes('MOVED TO BE REFERRED')
}

export function isTerminalStatus(caseStatus) {
  return isCaseClosed(caseStatus) || isFinalizedByApprover(caseStatus)
}

export function isAssessorReadOnly(caseStatus) {
  return isCaseClosed(caseStatus) || isFinalizedByApprover(caseStatus)
}

/**
 * @param {string} caseStatus
 * @param {'close_exclusion'|'move_referred'|'approve'|'reject'} action
 * @param {{ isExcluded?: boolean|string }} [options]
 */
export function canPerformAddAction(caseStatus, action, options = {}) {
  const excluded = options.isExcluded === 'Y' || options.isExcluded === true

  switch (action) {
    case 'close_exclusion':
      return excluded && !isTerminalStatus(caseStatus) && !isMovedToReferred(caseStatus)
    case 'move_referred':
      return !isTerminalStatus(caseStatus) && !isMovedToReferred(caseStatus)
    case 'approve':
    case 'reject':
      return !isCaseClosed(caseStatus) && !isFinalizedByApprover(caseStatus)
    default:
      return false
  }
}

export function addCaseStatusLabel(caseStatus) {
  if (isFinalizedByApprover(caseStatus)) {
    const s = String(caseStatus || '')
    if (s.toLowerCase().includes('approved')) return 'Approved by approver — case is locked.'
    if (s.toLowerCase().includes('rejected')) return 'Rejected by approver — case is locked.'
    return 'Decided by approver — case is locked.'
  }
  if (isCaseClosed(caseStatus)) return 'Closed as exclusion — no further action required.'
  if (isMovedToReferred(caseStatus)) return 'Moved to non-exclusion queue for full assessment.'
  return null
}

export function addCaseStatusTone(caseStatus) {
  if (isFinalizedByApprover(caseStatus)) return 'warn'
  if (isCaseClosed(caseStatus)) return 'neutral'
  if (isMovedToReferred(caseStatus)) return 'info'
  return null
}
