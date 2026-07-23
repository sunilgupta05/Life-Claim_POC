/** v1 browse vs work mode for /registration-fetch/:claimNo */



export function isBrowseMode(locationState) {

  return locationState?.from === 'claimSearch'

}



export function isWorkModeEntry(locationState) {

  return locationState?.from === 'myTask' || locationState?.from === 'dashboard'

}



export function isDashboardEntry(locationState) {

  return locationState?.from === 'dashboard'

}



export function areFieldsDisabled(locationState) {

  return isBrowseMode(locationState)

}



import { coalesceRoles, isAssessorRoleName, isVerifierRoleName } from './workflowRole'

const norm = (s) => String(s || '').toLowerCase().trim()

function userHasRole(userRoles, roleName) {
  const list = coalesceRoles(userRoles)
  if (roleName === 'assessor') return list.some(isAssessorRoleName)
  if (roleName === 'verifier') return list.some(isVerifierRoleName)
  return list.some((r) => norm(r) === roleName)
}



export function enableAssessor(locationState, claim, userRoles = []) {

  if (areFieldsDisabled(locationState)) return false

  const status = norm(claim?.status)

  const claimRole = norm(claim?.claimRole)

  const userIsAssessor = userHasRole(userRoles, 'assessor')



  const claimIsWithAssessor =

    claimRole === 'assessor' || status.includes('assessor')



  if (!claimIsWithAssessor && !userIsAssessor) return false



  if (userIsAssessor && isWorkModeEntry(locationState)) return true

  if (claimIsWithAssessor && status === 'pending assessor action') return true

  if (claimIsWithAssessor && isWorkModeEntry(locationState)) return true

  return false

}



export function enableVerifier(locationState, claim, userRoles = []) {

  if (areFieldsDisabled(locationState)) return false

  const status = norm(claim?.status)

  const claimRole = norm(claim?.claimRole)

  const userIsVerifier = userHasRole(userRoles, 'verifier')



  const claimIsWithVerifier =

    claimRole === 'verifier' || status.includes('verifier')



  if (!claimIsWithVerifier && !userIsVerifier) return false



  if (userIsVerifier && isWorkModeEntry(locationState)) return true

  if (claimIsWithVerifier && status === 'pending verifier action') return true

  if (claimIsWithVerifier && isWorkModeEntry(locationState)) return true

  return false

}



/** Full workspace edit (all tabs) — assessor or verifier in work mode. */

export function workspaceCanEdit(locationState, claim, userRoles = []) {

  return enableAssessor(locationState, claim, userRoles) || enableVerifier(locationState, claim, userRoles)

}



export function canEditWorkspace(locationState, claim, userRoles = []) {

  return workspaceCanEdit(locationState, claim, userRoles)

}



export function getSubmitGuard(claim, username, locationState) {

  if (areFieldsDisabled(locationState)) {

    return { ok: false, hint: 'Browse mode — open this claim from My Task or Dashboard to work it.' }

  }



  const logged = (username || sessionStorage.getItem('loggedUser') || '').trim()

  const claimRole = norm(claim?.claimRole)

  const status = norm(claim?.status)

  const assigned = (claim?.assignedTo || '').trim()



  if (assigned && logged && assigned.toLowerCase() !== logged.toLowerCase()) {

    return { ok: false, hint: `Assigned to ${assigned}. You are logged in as ${logged}.` }

  }



  if (claimRole === 'assessor' || status.includes('assessor')) {

    if (status !== 'pending assessor action') {

      return { ok: false, hint: 'Assessor submit requires status “Pending Assessor Action”.' }

    }

    return { ok: true, mode: 'assessor' }

  }



  if (claimRole === 'verifier' || status.includes('verifier')) {

    if (status !== 'pending verifier action') {

      return { ok: false, hint: 'Verifier submit requires status “Pending Verifier Action”.' }

    }

    return { ok: true, mode: 'verifier' }

  }



  return { ok: false, hint: 'Submit is only available when the claim is with Assessor or Verifier.' }

}



const ASSESSOR_DECISIONS_REQUIRING_REASON = new Set([
  'reject',
  'repudiate',
  'request more documents',
  'refer to verifier',
])

/** Assessor must pick a decision before submit. */
export function isAssessorDecisionComplete(accessorDecision, accessorReason = '') {
  const decision = String(accessorDecision || '').trim()
  if (!decision) {
    return { ok: false, hint: 'Select an assessor decision before submit.' }
  }
  if (ASSESSOR_DECISIONS_REQUIRING_REASON.has(norm(decision)) && !String(accessorReason || '').trim()) {
    return { ok: false, hint: 'Enter reason / remarks for this assessor decision before submit.' }
  }
  return { ok: true, hint: '' }
}

/** Verifier must pick Verified or Rejected (not Pending / empty). */
export function isVerifierDecisionComplete(verificationStatus) {
  const status = norm(verificationStatus)
  if (!status || status === 'pending') {
    return { ok: false, hint: 'Select Verified or Rejected before submit.' }
  }
  return { ok: true, hint: '' }
}

/** Role guard + decision fields → whether Submit can be used. */
export function getWorkspaceSubmitState(submitGuard, edits = {}) {
  if (!submitGuard?.ok) return submitGuard
  const {
    accessorDecision = '',
    accessorReason = '',
    verificationStatus = '',
  } = edits
  if (submitGuard.mode === 'assessor') {
    const check = isAssessorDecisionComplete(accessorDecision, accessorReason)
    if (!check.ok) return { ...submitGuard, ok: false, hint: check.hint }
  }
  if (submitGuard.mode === 'verifier') {
    const check = isVerifierDecisionComplete(verificationStatus)
    if (!check.ok) return { ...submitGuard, ok: false, hint: check.hint }
  }
  return { ...submitGuard, hint: 'Ready to submit.' }
}



export function mapAccessorDecisionToApi(decision) {

  const d = norm(decision)

  if (d === 'approve' || d === 'accept') return 'accept'

  if (d === 'reject' || d === 'repudiate') return 'reject'

  return d || 'accept'

}


