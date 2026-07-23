import claimsServices from './claimsServices'
import { claimSearch } from './claimSearchService'
import registerPolicyService from './registerPolicyService'
import {
  loadClaimWorkspace,
  loadClaimWorkspaceInitial,
  loadClaimWorkspaceTab,
  saveClaimWorkspace,
} from './claimWorkspaceService'
import wrapper from '../util/ApiWrapper'

export const getClaimsByUser = (username) => claimsServices.getClaimByUsername(username)

/** Section D2 — claim number only (POST /api/claim-search). */
export const searchClaims = async ({ claimNumber, q } = {}) => {
  const num = String(claimNumber || q || '').trim()
  if (!num) return { claims: [] }
  const data = await claimSearch.claimSearchNumber(num)
  if (!data) return { claims: [] }
  return { claims: [data] }
}

export const getClaimByNumber = async (claimNumber) => {
  const { view } = await loadClaimWorkspace(claimNumber)
  return view
}

export const getClaimWorkspace = (claimNumber) => loadClaimWorkspace(claimNumber)

export const getClaimWorkspaceInitial = (claimNumber) => loadClaimWorkspaceInitial(claimNumber)

export const getClaimWorkspaceTab = (claimNumber, tabId, raw) =>
  loadClaimWorkspaceTab(claimNumber, tabId, raw)

export const updateClaimWorkspace = (raw, edits, user) =>
  saveClaimWorkspace(raw, edits, user)

export const registerClaim = async (policyData) => registerPolicyService(policyData)

export const changeClaimStatus = async (claimNumber, status, remarks, decision) => {
  const response = await wrapper.fetchWithToken('/claims/changeStatus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimNumber, status, remarks, decision }),
  })
  return response.json()
}

export const assignClaim = (claimNumber, assignTo, role) =>
  claimsServices.assignClaim({ claimNumber, assignTo, role })

export default {
  getClaimsByUser,
  searchClaims,
  getClaimByNumber,
  registerClaim,
  changeClaimStatus,
  assignClaim,
}
