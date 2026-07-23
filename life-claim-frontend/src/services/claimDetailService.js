import { formatProductName } from '../util/formatProductName'
import { workflowStatusFromRow, workflowRoleFromRow } from '../util/claimSearchMap'
import { computeDaysOpen } from '../util/claimDaysOpen'
import { acuityFromClaimRow } from '../util/acuity'

export const unwrapWorkspace = (payload) =>
  payload?.data != null ? payload.data : payload

const mapClaimants = (rows = []) =>
  rows.map((c) => ({
    name: c.name || c.firstName || c.claimantName || '—',
    role: c.role || c.claimantRole || '—',
    relation: c.relation || '—',
    mobileNo: c.mobileNo || c.mobile || '—',
    panNo: c.panNo || c.pan || '—',
  }))

const mapHospitals = (rows = []) =>
  rows.map((h) => ({
    hospitalName: h.hospitalName || h.name || '—',
    admissionDate: h.admissionDate || h.dateOfAdmission || '—',
    dischargeDate: h.dischargeDate || h.dateOfDischarge || '—',
    diagnosis: h.diagnosis || '—',
    natureOfIllness: h.natureOfIllness || h.nature || '—',
  }))

export function mapClaimViewFromWorkspace(claimNumber, raw) {
  const d = raw?.demogs || {}
  const r = raw?.requirements || {}
  const a = raw?.assessment || {}
  const dec = raw?.decision || {}

  const claimRow = raw?.searchRow || d.claim || dec.claim
  if (!claimRow || (typeof claimRow === 'object' && !Object.keys(claimRow).length)) {
    return null
  }

  const intimation = d.intimation || {}
  const cause = d.cause || {}
  const lifeAssured = d.lifeAssured || {}
  const contact = d.contact || {}
  const accessor = dec.decisionAccessor || {}
  const system = dec.decisionSystem || {}
  const verification = dec.decisionVerificationAndSummary || {}

  const status = workflowStatusFromRow(claimRow)
  const normalizedStatus = status === '—' ? 'Pending' : status

  const assessmentAnswers = {}
  const questions = a.assessment || a.claimQuestions
  if (questions && typeof questions === 'object') {
    Object.entries(questions).forEach(([key, val], idx) => {
      if (val != null && val !== '') assessmentAnswers[String(idx + 1)] = String(val)
    })
  }

  const reqStatus = {}
  const reqTable = r.requirementTable || r.requirement_table || []
  if (Array.isArray(reqTable)) {
    reqTable.forEach((row, i) => {
      const id = row.id || row.requirementId || String(i + 1)
      reqStatus[id] = row.status || row.documentStatus || 'Pending'
    })
  }

  return {
    claimId: claimNumber,
    policyId: claimRow.policyId || claimRow.POLICY_ID || claimRow.policyID || '—',
    policyStatus: claimRow.POLICY_STATUS || claimRow.policyStatus || '—',
    status: normalizedStatus,
    claimRole: workflowRoleFromRow(claimRow) === '—' ? (d.claim?.role || '') : workflowRoleFromRow(claimRow),
    assignedTo: claimRow.ASSIGNED_TO || claimRow.assignedTo || '',
    createdBy: claimRow.CREATED_BY || claimRow.createdBy || '—',
    createdOn: (claimRow.CREATED_AT || claimRow.CREATED_ON || '').toString().split('T')[0] || '—',
    priority: claimRow.priority || 'Normal',
    daysOpen: computeDaysOpen(
      claimRow.CREATED_AT || claimRow.INITIMATION_DATE || claimRow.createdOn,
      claimRow.MODIFIED_AT || claimRow.modifiedAt,
      normalizedStatus,
    ),
    claimType: claimRow.claimType || claimRow.CLAIM_TYPE || '—',
    informationType: intimation.informationType || intimation.INFORMATION_TYPE || '',
    laName:
      lifeAssured.name || lifeAssured.laName || claimRow.createdBy || claimRow.CREATED_BY || '—',
    laDob: lifeAssured.dob || lifeAssured.dateOfBirth || '—',
    laGender: lifeAssured.gender || '—',
    laCity: lifeAssured.city || lifeAssured.city1 || lifeAssured.resCity || '—',
    laState: lifeAssured.state || lifeAssured.state1 || lifeAssured.resState || '—',
    laPincode: lifeAssured.pincode || lifeAssured.pinCode || lifeAssured.resPincode || '',
    laMobile: lifeAssured.mobileNo || lifeAssured.mobile || contact?.mobileNo || '',
    intimationDate: intimation.intimationDate || intimation.initiationDate || '',
    dateOfDeathEvent: intimation.dateOfDeath || intimation.dateOfDeathEvent || '',
    source: intimation.source || '—',
    bondType: intimation.bondType || '—',
    firPmReceived: intimation.firPmReceived || '—',
    declaredByDoctor: intimation.declaredByDoctor || '—',
    dateOfDeathReg: intimation.dateOfDeathReg || '—',
    placeOfDeath: intimation.placeOfDeath || cause.placeOfDeath || '—',
    deathCertificate: intimation.deathCertificate || '—',
    causeCode: cause.causeCode || '—',
    causeDescription: cause.causeDescription || '—',
    causeCategory: cause.causeCategory || '—',
    causeSubType: cause.causeSubType || '—',
    productName: formatProductName(claimRow.productName) || '—',
    sumAssured: claimRow.sumAssured || claimRow.SUM_ASSURED,
    advisorCode: claimRow.advisorCode || '—',
    uwDecision: claimRow.uwDecision || '—',
    sysRecommendation:
      system.decision1 || system.recommendation || system.systemRecommendation || '',
    sysPayableAmount:
      system.base || system.totalAmtPayable || system.payableAmount || system.systemPayableAmount,
    sysRiskScore: system.remarks1 || system.riskScore || system.trapScore,
    sysProcessedOn: system.processedOn || system.processedDate || '',
    accessorDecision: accessor.decision || accessor.accessorDecision || '',
    accessorReason: accessor.reason || accessor.remarks || accessor.decisionReason || '',
    accessorAmount: accessor.amount || accessor.payableAmount || accessor.reqDamt || '',
    verificationStatus: verification.verificationStatus || verification.status || '',
    verificationRemarks: verification.remarks || verification.verificationRemarks || '',
    claimants: mapClaimants(d.claimant || []),
    hospitalDetails: mapHospitals(d.hospitalDetailsTable || []),
    doctorDetails: d.doctorDetailsTable || [],
    reqStatus,
    assessmentAnswers,
    auditTrail: [],
    fraudContext: {
      intimation,
      lifeAssured,
      claimant: d.claimant || [],
      contact,
      eagle: d.eagle || {},
      trap: d.trap || {},
    },
    acuity: acuityFromClaimRow(claimRow),
  }
}

export default { mapClaimViewFromWorkspace, unwrapWorkspace }
