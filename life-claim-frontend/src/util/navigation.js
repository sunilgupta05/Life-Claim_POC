const ACTIVE_CLAIM_KEY = 'activeClaimId'
const ACTIVE_ADD_CASE_KEY = 'activeAddCaseId'

/** Canonical workspace URL without PII in path. */
export function claimWorkspacePath() {
  return '/registration-fetch'
}

/** Canonical ADD case workspace URL without case ID in path. */
export function addCaseWorkspacePath() {
  return '/add-case'
}

/** Open workspace with claim ID in state/session, not URL. */
export function openClaimWorkspace(navigate, claimId, options = {}) {
  const id = String(claimId || '').trim()
  if (!id) {
    navigate('/claim-search')
    return
  }
  try {
    sessionStorage.setItem(ACTIVE_CLAIM_KEY, id)
  } catch {
    // ignore storage errors; navigation state still carries claim ID
  }
  navigate(claimWorkspacePath(), { state: { ...options, claimId: id } })
}

/** Open ADD case workspace with case ID in state/session, not URL. */
export function openAddCaseWorkspace(navigate, caseId, options = {}) {
  const id = String(caseId || '').trim()
  if (!id || id === '—') {
    navigate('/add-screen?tab=assess-pool')
    return
  }
  try {
    sessionStorage.setItem(ACTIVE_ADD_CASE_KEY, id)
  } catch {
    // ignore storage errors; navigation state still carries case ID
  }
  const { case: caseMeta, ...rest } = options
  navigate(addCaseWorkspacePath(), {
    state: {
      ...rest,
      caseId: id,
      case: caseMeta || { caseId: id },
    },
  })
}
