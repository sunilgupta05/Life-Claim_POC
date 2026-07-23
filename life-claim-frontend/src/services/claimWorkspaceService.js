import { claimSearch } from './claimSearchService'
import assessorFetchService from './assessorFetchService'
import updatePolicyService from './updatePolicyService'
import { mapClaimViewFromWorkspace, unwrapWorkspace } from './claimDetailService'
import { applyDecisionEditsToPolicyData } from '../util/buildPolicyData'
import { normalizeDemogsEagleTables } from '../util/eagleTableMappers'

/** Initial load: claim row + demographics (Section D3 lazy pattern). */
export async function loadClaimWorkspaceInitial(claimNumber) {
  const [searchRow, demogs] = await Promise.all([
    claimSearch.claimSearchNumber(claimNumber),
    assessorFetchService.demogsFetch(claimNumber),
  ])

  const raw = {
    searchRow,
    demogs: normalizeDemogsEagleTables(unwrapWorkspace(demogs)),
    requirements: null,
    assessment: null,
    decision: null,
    calcAmt: null,
  }

  const view = mapClaimViewFromWorkspace(claimNumber, raw)
  if (!view) {
    const err = new Error('Claim not found')
    err.status = 404
    throw err
  }

  return { view, raw }
}

/** Load tab payload on first open (demogs already loaded). */
export async function loadClaimWorkspaceTab(claimNumber, tabId, raw) {
  const next = { ...raw }
  if (tabId === 'Requirements' && !next.requirements) {
    next.requirements = unwrapWorkspace(await assessorFetchService.requireFetch(claimNumber))
  }
  if (tabId === 'Assessment' && !next.assessment) {
    next.assessment = unwrapWorkspace(await assessorFetchService.assessmentFetch(claimNumber))
  }
  if (tabId === 'Decision & Summary' && !next.decision) {
    const [decision, calcAmt] = await Promise.all([
      assessorFetchService.decisionFetch(claimNumber),
      assessorFetchService.calculateAmountFetch(claimNumber).catch(() => null),
    ])
    next.decision = unwrapWorkspace(decision)
    next.calcAmt = unwrapWorkspace(calcAmt)
  }
  const view = mapClaimViewFromWorkspace(claimNumber, next)
  return { view, raw: next }
}

/** Fetch all assessor-fetch slices at once (fallback). */
export async function loadClaimWorkspace(claimNumber) {
  const { view, raw } = await loadClaimWorkspaceInitial(claimNumber)
  let next = raw
  for (const tab of ['Requirements', 'Assessment', 'Decision & Summary']) {
    const loaded = await loadClaimWorkspaceTab(claimNumber, tab, next)
    next = loaded.raw
  }
  return { view: mapClaimViewFromWorkspace(claimNumber, next), raw: next }
}

/** Build POST body for /api/register-claim/update (v1 flat shape). */
export function buildClaimUpdatePayload(raw, edits, user, policyData) {
  if (policyData?.claimNo) {
    const base = applyDecisionEditsToPolicyData(policyData, edits)
    return {
      ...base,
      modifiedBy: user?.username || sessionStorage.getItem('loggedUser') || base.modifiedBy || 'system',
    }
  }

  const claimNo =
    raw?.searchRow?.claimNumber ||
    raw?.searchRow?.CLAIM_NUMBER ||
    raw?.demogs?.claim?.claimNumber ||
    edits?.claimId

  const username =
    user?.username || sessionStorage.getItem('loggedUser') || 'system'

  const intimation = { ...(raw?.demogs?.intimation || {}) }
  const lifeAssured = { ...(raw?.demogs?.lifeAssured || {}) }
  const contact = { ...(raw?.demogs?.contact || {}) }
  const eagle = { ...(raw?.demogs?.eagle || {}) }
  const requirements = { ...(raw?.requirements?.requirement || {}) }
  const requirementTable = raw?.requirements?.requirementTable || []
  const claimQuestions = {
    ...(raw?.assessment?.assessment || raw?.assessment?.claimQuestions || {}),
  }

  const accessorDetails = {
    ...(raw?.decision?.decisionAccessor || {}),
    decision: edits?.accessorDecision,
    decisionReason: edits?.accessorReason,
    remarks: edits?.accessorReason,
    reqDamt: edits?.accessorAmount,
  }

  const verifierDetails = {
    ...(raw?.decision?.decisionVerificationAndSummary || {}),
    status: edits?.verificationStatus,
    remarks: edits?.verificationRemarks,
  }

  return {
    claimNo,
    modifiedBy: username,
    intimationDetails: intimation,
    lifeAssuredDetails: lifeAssured,
    contactDetails: contact,
    eagleScreenDetails: eagle,
    requirements,
    requirementTable,
    claimQuestions,
    accessorDetails,
    verifierDetails,
    claimantDetails: raw?.demogs?.claimant || [],
    payeeDetails: raw?.demogs?.payee || [],
    hospitalDetailsTable: raw?.demogs?.hospitalDetailsTable || [],
    doctorDetailsTable: raw?.demogs?.doctorDetailsTable || [],
    establishedCauseDetails: raw?.demogs?.establishedCause || {},
    systemDetails: raw?.decision?.decisionSystem || {},
    systemAssessorRemarks: raw?.assessment?.remarks || {},
    iibEnquiryTable: raw?.assessment?.iibEnquiry || [],
    telecallingTable: raw?.assessment?.telecalling || [],
    caseTriggerTable: raw?.assessment?.caseTrigger || [],
  }
}

export async function saveClaimWorkspace(raw, edits, user, policyData) {
  const payload = buildClaimUpdatePayload(raw, edits, user, policyData)
  if (!payload.claimNo) throw new Error('Missing claim number for update')
  return updatePolicyService(payload)
}

export default {
  loadClaimWorkspace,
  loadClaimWorkspaceInitial,
  loadClaimWorkspaceTab,
  buildClaimUpdatePayload,
  saveClaimWorkspace,
}
