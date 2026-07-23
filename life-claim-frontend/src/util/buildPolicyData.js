import { normalizeDemogsEagleTables } from './eagleTableMappers'

/** Build v1-shaped policyData from assessor-fetch raw bundles (Section F10). */

export function pickClaimQuestionsOnly(claimQuestions = {}) {
  const out = {}
  for (let i = 0; i <= 26; i++) {
    const key = `question${i}`
    if (claimQuestions[key] != null && claimQuestions[key] !== '') {
      out[key] = claimQuestions[key]
    }
  }
  return out
}

const TABLE_KEYS = [
  'hospitalDetailsTable',
  'doctorDetailsTable',
  'proofDetailsTable',
  'insuranceProofDetailsTable',
  'witnessDetailsTable',
  'incomeDetailsTable',
  'iibEnquiryTable',
]

function attachDemogSections(payload, merged) {
  const objKeys = [
    'intimationDetails',
    'establishedCauseDetails',
    'lifeAssuredDetails',
    'contactDetails',
    'eagleScreenDetails',
  ]
  objKeys.forEach((key) => {
    if (hasObjectData(merged[key])) payload[key] = merged[key]
  })
  if (Array.isArray(merged.claimantDetails) && merged.claimantDetails.length) {
    payload.claimantDetails = merged.claimantDetails
  }
  if (Array.isArray(merged.payeeDetails) && merged.payeeDetails.length) {
    payload.payeeDetails = merged.payeeDetails
  }
  TABLE_KEYS.forEach((key) => {
    if (Array.isArray(merged[key]) && merged[key].length) payload[key] = merged[key]
  })
  if (hasObjectData(merged.systemAssessorRemarks)) {
    payload.systemAssessorRemarks = merged.systemAssessorRemarks
  }
  if (Array.isArray(merged.requirementTable) && merged.requirementTable.length) {
    payload.requirementTable = merged.requirementTable
  }
}

/** Work-mode submit — decision + all edited demogs / assessment (skips empty sections). */
export function buildWorkspaceSubmitPayload(policyData, edits, claimNo, username, mode = 'assessor') {
  const merged = policyData || {}
  const payload = {
    claimNo: claimNo || merged.claimNo,
    modifiedBy: username || merged.modifiedBy || '',
    claimQuestions: pickClaimQuestionsOnly(merged.claimQuestions || {}),
  }
  if (mode === 'assessor') {
    payload.accessorDetails = {
      decision: edits?.accessorDecision,
      remarks: edits?.accessorReason,
      reqDamt: edits?.accessorAmount,
    }
  } else if (mode === 'verifier') {
    payload.verifierDetails = {
      status: edits?.verificationStatus,
      remarks: edits?.verificationRemarks,
      verificationStatus: edits?.verificationStatus,
      verificationRemarks: edits?.verificationRemarks,
    }
  }
  attachDemogSections(payload, merged)
  return payload
}

export function buildAssessorSubmitPayload(policyData, edits, claimNo, username) {
  return buildWorkspaceSubmitPayload(policyData, edits, claimNo, username, 'assessor')
}

function hasObjectData(obj) {
  if (!obj || typeof obj !== 'object') return false
  return Object.entries(obj).some(
    ([k, v]) =>
      !['claimId', 'createdBy', 'modifiedBy', 'createdAt', 'modifiedAt'].includes(k) &&
      v != null &&
      String(v).trim() !== ''
  )
}

export function buildPolicyDataFromRaw(raw, claimNo, user) {
  const d = normalizeDemogsEagleTables(raw?.demogs || {})
  const r = raw?.requirements || {}
  const a = raw?.assessment || {}
  const dec = raw?.decision || {}

  return {
    claimNo: claimNo || raw?.searchRow?.CLAIM_NUMBER || raw?.searchRow?.claimNumber,
    modifiedBy: user?.username || sessionStorage.getItem('loggedUser') || '',
    intimationDetails: { ...(d.intimation || {}) },
    establishedCauseDetails: { ...(d.establishedCause || {}) },
    payeeDetails: Array.isArray(d.payee) ? d.payee : [],
    claimantDetails: Array.isArray(d.claimant) ? d.claimant : [],
    lifeAssuredDetails: { ...(d.lifeAssured || {}) },
    contactDetails: { ...(d.contact || {}) },
    eagleScreenDetails: { ...(d.eagle || {}) },
    hospitalDetailsTable: d.hospitalDetailsTable || [],
    doctorDetailsTable: d.doctorDetailsTable || [],
    proofDetailsTable: d.proofDetailsTable || [],
    insuranceProofDetailsTable: d.insuranceProofDetailsTable || [],
    witnessDetailsTable: d.witnessDetailsTable || [],
    incomeDetailsTable: d.incomeDetailsTable || [],
    trapScoreData: d.trap || d.trapScoreData || {},
    agentHistoryTable: d.agentHistoryTable || [],
    riderDetailsTable: d.riderDetailsTable || [],
    requirements: { ...(r.requirement || {}) },
    requirementTable: r.requirementTable || [],
    reqCommonDetailsTable: r.reqCommonDetailsTable || [],
    reqRiderDetailsTable: r.reqRiderDetailsTable || [],
    reqEmailDetailsTable: r.reqEmailDetailsTable || [],
    reqLetterDetailsTable: r.reqLetterDetailsTable || [],
    smsScriptTable: r.smsScriptTable || [],
    claimQuestions: pickClaimQuestionsOnly(a.assessment || a.claimQuestions || {}),
    iibEnquiryTable: a.iibEnquiry || a.iibEnquiryTable || [],
    telecallingTable: a.telecalling || a.telecallingTable || [],
    caseTriggerTable: a.caseTrigger || a.caseTriggerTable || [],
    systemAssessorRemarks: a.remarks || a.systemRemarksTable || {},
    priorityFlagRemarks: a.priorityFlag || a.priorityFlagTable || {},
    accessorDetails: { ...(dec.decisionAccessor || {}) },
    verifierDetails: { ...(dec.decisionVerificationAndSummary || {}) },
    systemDetails: { ...(dec.decisionSystem || {}) },
  }
}

export function mergePolicyData(prev, patch) {
  if (!prev) return patch || {}
  const next = { ...prev, ...patch }
  const mergeObj = (key) => {
    if (patch?.[key] && typeof patch[key] === 'object' && !Array.isArray(patch[key])) {
      next[key] = { ...(prev[key] || {}), ...patch[key] }
    }
  }
    ;['intimationDetails', 'lifeAssuredDetails', 'contactDetails', 'eagleScreenDetails', 'establishedCauseDetails', 'requirements', 'accessorDetails', 'verifierDetails', 'systemDetails'].forEach(mergeObj)
  return next
}

export function applyDecisionEditsToPolicyData(policyData, edits) {
  if (!policyData || !edits) return policyData
  return mergePolicyData(policyData, {
    accessorDetails: {
      ...(policyData.accessorDetails || {}),
      decision: edits.accessorDecision,
      decisionReason: edits.accessorReason,
      remarks: edits.accessorReason,
      reqDamt: edits.accessorAmount,
    },
    verifierDetails: {
      ...(policyData.verifierDetails || {}),
      status: edits.verificationStatus,
      remarks: edits.verificationRemarks,
      verificationStatus: edits.verificationStatus,
      verificationRemarks: edits.verificationRemarks,
    },
  })
}
