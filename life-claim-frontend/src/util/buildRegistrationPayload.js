import { getPolicyClients } from './policyClients'
import {
  REGISTRATION_ASSESSMENT_QUESTIONS,
  REGISTRATION_REQUIREMENTS,
} from '../config/registrationCatalog'

/** Policy age from date of death/event vs contract RCD (v1 ContactDetails). */
export function computePolicyAge(dateOfDeathEvent, riskCommencementDate) {
  if (!dateOfDeathEvent || !riskCommencementDate) {
    return { policyAge: null, policyAge1: null, policyAgeLabel: null }
  }
  const end = new Date(dateOfDeathEvent)
  const start = new Date(riskCommencementDate)
  if (Number.isNaN(end.getTime()) || Number.isNaN(start.getTime()) || end < start) {
    return { policyAge: null, policyAge1: null, policyAgeLabel: null }
  }

  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  let days = end.getDate() - start.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  const policyAge1 = Math.round((totalDays / 365.25) * 10) / 10
  const policyAgeLabel = `${years} years ${months} months ${days} days`

  return { policyAge: policyAgeLabel, policyAge1, policyAgeLabel }
}

/** Whole years between DOB and date of death (backend trap score expects a number). */
export function computeAgeAtDeath(dateOfDeath, dob) {
  if (!dateOfDeath || !dob) return null
  const end = new Date(dateOfDeath)
  const start = new Date(dob)
  if (Number.isNaN(end.getTime()) || Number.isNaN(start.getTime())) return null
  let age = end.getFullYear() - start.getFullYear()
  const monthDiff = end.getMonth() - start.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < start.getDate())) age -= 1
  return age >= 0 ? age : null
}

export function deriveTrapRisk(score) {
  const n = parseFloat(score)
  if (Number.isNaN(n)) return 'Unknown'
  if (n >= 4) return 'High'
  if (n >= 2) return 'Medium'
  return 'Low'
}

const todayIso = () => new Date().toISOString().split('T')[0]

/** DATE columns — never send NA / Invalid date to MySQL. */
export function sanitizeDateField(value) {
  if (value == null) return null
  const s = String(value).trim()
  if (!s || s === 'NA' || s === 'N/A' || s.toLowerCase() === 'invalid date') return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

/** Agent repudiation / rider APIs may return { data: [...] } instead of a bare array. */
export function asArray(value) {
  if (Array.isArray(value)) return value
  if (value == null || value === '') return []
  if (typeof value === 'object') {
    for (const key of [
      'data',
      'rows',
      'records',
      'list',
      'items',
      'agentHistory',
      'agentRepudiation',
    ]) {
      const nested = value[key]
      if (Array.isArray(nested)) return nested
      if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        const inner = asArray(nested)
        if (inner.length) return inner
      }
    }
  }
  return []
}

/** Fill every trap field the backend expects so generation never blocks on blanks. */
export function applyTrapScoreDefaults(payload, data = {}, policy = null) {
  const c = laClient(data, policy)
  const claimant = (data.claimants || [])[0] || {}
  const age = computePolicyAge(
    data.dateOfDeathEvent,
    data.riskCommencementDate || policy?.riskCommencementDate
  )
  const dob = data.laDob || c.dob
  const computedAge =
    payload.ageAtDeath ??
    computeAgeAtDeath(data.dateOfDeathEvent, dob) ??
    45
  const firPm = payload.firPmReceived || payload.firPMReceived || 'Not Required'
  const claimRepudiate = payload.claimRepudiate || payload.claimsRupidiate || 'Not Required'
  const city = payload.city || c.city || claimant.city || 'Mumbai sub'
  const pin = String(payload.pin || payload.pinCode || c.pincode || claimant.pincode || '400001')
  const productCode = payload.productCode || data.productCode || policy?.productCode || 'P001'
  const occCategory =
    payload.occCategory ||
    c.occCode ||
    (productCode.charAt(0) === 'G' ? undefined : 'OTH')

  return {
    ...payload,
    gender: payload.gender || c.gender || data.laGender || 'Male',
    ageAtDeath: computedAge,
    education: payload.education || c.education || 'GRAD',
    policyAge: payload.policyAge ?? data.policyAge1 ?? age.policyAge1 ?? 1,
    productCategory: payload.productCategory || data.portfolioType || 'Traditional',
    occCategory,
    avlSA: payload.avlSA ?? data.currentSA ?? policy?.currentSA ?? data.sumAssured ?? policy?.sumAssured ?? 0,
    advStatus: payload.advStatus || data.advisorStatus || policy?.advisorStatus || 'Active',
    claimRepudiate,
    claimsRupidiate: claimRepudiate,
    causeOfDeath: payload.causeOfDeath || data.causeOfClaim || data.causeDescription || data.causeCode || 'OTHER',
    placeOfClaim: payload.placeOfClaim || data.placeOfDeath || 'Residence',
    firPmReceived: firPm,
    firPMReceived: firPm,
    declareByDR: payload.declareByDR || data.declaredByDoctor || 'No',
    umCode: payload.umCode || policy?.umCode,
    advisorCode: payload.advisorCode || data.advisorCode || policy?.advisorCode || 'NA',
    advisorCategory: payload.advisorCategory || policy?.advisorCategory,
    advisorClub: payload.advisorClub || policy?.advisorClub,
    claimType: payload.claimType || data.claimType || 'Death',
    source: payload.source || data.source || 'Branch',
    intimationDate: payload.intimationDate || data.intimationDate || todayIso(),
    dateOfDeath: payload.dateOfDeath || data.dateOfDeathEvent || todayIso(),
    dateOfDisability: payload.dateOfDisability || data.dateOfDisability || data.dateOfDeathEvent || todayIso(),
    typeOfClaim: payload.typeOfClaim || data.typeOfClaim || 'Non-accidental',
    productCode,
    city,
    pin,
    pinCode: pin,
  }
}

/** Last-resort score when the trap API is down — keeps registration moving. */
export function buildLocalTrapScoreFallback(payload = {}) {
  const factors = [
    payload.gender,
    payload.ageAtDeath,
    payload.productCategory,
    payload.city,
    payload.advisorCode,
    payload.causeOfDeath,
    payload.policyAge,
  ].filter((v) => v != null && v !== '').length
  const raw = Math.min(5.5, Math.max(1.2, 1.4 + factors * 0.35))
  const trapScore = raw.toFixed(2)
  return {
    trapScore,
    trapRisk: deriveTrapRisk(trapScore),
    trapRemarks:
      '# Estimated locally — trap API unavailable. Score uses available demographics; re-generate when backend is reachable.',
    trapDate: todayIso(),
  }
}

function laClient(data, policy) {
  const clients = getPolicyClients(policy)
  return clients[0] || {}
}

export function buildIntimationDetails(data, policy) {
  const dcNa = data.deathCertificate === 'NA'
  return {
    claimType: data.claimType,
    policyStatus: data.policyStatus || policy?.premiumStatus || data.initialPolicyStatus,
    intimationType: data.informationType,
    initiationDate: sanitizeDateField(data.initiationDate),
    intimationDate: sanitizeDateField(data.intimationDate),
    source: data.source,
    firPmReceived: data.firPmReceived,
    firPMReceived: data.firPmReceived,
    bondType: data.bondType,
    whatsappFlag: data.whatsappFlag,
    declaredByDoctor: data.declaredByDoctor,
    portfolio: data.portfolioType,
    lifeAsrStatus: data.lifeAsrStatus,
    dateOfDeathEvent: sanitizeDateField(data.dateOfDeathEvent),
    dateOfDeathReg: sanitizeDateField(data.dateOfDeathReg),
    dateOfCremation: sanitizeDateField(data.dateOfCremation),
    dateOfAccident: sanitizeDateField(data.dateOfAccident),
    placeOfDeathTi: data.placeOfDeath,
    policyStatusOnDoddoe: data.policyStatusOnDod,
    policyStatusEditRemark: data.policyStatusEditRemark,
    deathCertificate: data.deathCertificate,
    deathCertificateRegNumber: dcNa ? 'NA' : data.dcRegNumber,
    deathCertificateRegDate: dcNa ? null : sanitizeDateField(data.dcRegDate),
    deathCertificateIssueDistrict: data.dcIssueDistrict,
    deathCertificateIssuingAuthority: data.dcIssuingAuthority,
    deathCertificateTehsil: data.dcTehsil,
    deathCertificateIssueState: data.dcIssueState,
    deathCertificatePlaceOnCertificate: data.dcPlaceOnCertificate,
    deathCertificateVillageBlock: data.dcVillageBlock,
    deathCertificateOfficerPosition: data.dcOfficerPosition,
    initialPolicyStatus: data.initialPolicyStatus || data.policyStatusOnDod || policy?.premiumStatus,
  }
}

export function buildCauseEvent(data) {
  return {
    typeOfClaim: data.typeOfClaim,
    causeCode: data.causeCode,
    causeDescription: data.causeDescription,
    causeCategory: data.causeCategory,
    causeOfClaim: data.causeOfClaim || data.causeDescription || data.causeCode,
    ifOthersSpecify: data.causeIfOthers || '',
    dateOfEvent: data.causeEventDate || data.dateOfDeathEvent,
    polStatusOnEvent: data.policyStatusOnEvent || data.policyStatusOnDod,
    claimSubType: data.causeSubType || data.claimSubType,
    claimRegistrationType: data.claimRegistrationType,
  }
}

export function buildLifeAssuredDetails(data, policy) {
  const c = laClient(data, policy)
  return {
    name: data.laName || [c.name, c.lastName].filter(Boolean).join(' '),
    clientId: data.laClientId || c.clientId,
    dob: data.laDob || c.dob,
    gender: data.laGender || c.gender,
    riskIndicator: data.laRiskIndicator || c.riskIndicator,
    ageAtDeath: data.laAgeAtDeath,
    idProofType: data.laIdProofType,
    idNumber: data.laIdNumber || c.idNumber,
    mobileNo: data.laMobileNo || c.mobileNo,
    mobileNo1: data.laMobileNo || c.mobileNo,
    emailId: data.laEmailId || c.emailId,
    emailId1: data.laEmailId || c.emailId,
    flat: data.laFlat || c.flat,
    road: data.laRoad || c.road,
    area: data.laArea || c.area,
    city: data.laCity || c.city,
    state: data.laState || c.state,
    pincode: data.laPincode || c.pincode,
    occCode: data.laOccCode,
    occDesc: data.laOccDesc,
    income: data.laIncome,
    estName: data.laEstName,
    designation: data.laDesignation,
    natureOfWork: data.laNatureOfWork,
  }
}

export function buildContactDetails(data, policy) {
  const age = computePolicyAge(
    data.dateOfDeathEvent,
    data.riskCommencementDate || policy?.riskCommencementDate
  )
  return {
    appNo: data.appNo,
    policyNo: data.policyId || policy?.policyId,
    productName: data.productName || policy?.productName,
    productCode: data.productCode || policy?.productCode,
    cdfDate: data.cdfDate,
    issueDate: data.issueDate || policy?.issueDate,
    riskCommencementDate: data.riskCommencementDate || policy?.riskCommencementDate,
    paidToDate: data.paidToDate || policy?.paidToDate,
    premiumFrequency: data.premiumFrequency || policy?.premiumFrequency,
    premiumStatus: data.premiumStatus || policy?.premiumStatus,
    term: data.term || policy?.term,
    premPaidYrs: data.premPaidYrs || policy?.premPaidYrs,
    totalPremiumPaid: data.totalPremiumPaid || policy?.totalPremiumPaid,
    originalSa: data.originalSA || policy?.originalSA,
    currentSa: data.currentSA || policy?.currentSA,
    cashValue: data.cashValue || policy?.cashValue,
    maturityValue: data.maturityValue || policy?.maturityValue,
    outstandingLoan: data.outstandingLoan,
    excessPremium: data.excessPremium,
    uwDecision: data.uwDecision || policy?.uwDecision,
    uwDecisionDate: data.uwDecisionDate || policy?.uwDecisionDate,
    advisorCode: data.advisorCode || policy?.advisorCode,
    advisorStatus: data.advisorStatus || policy?.advisorStatus,
    nameChangeDecl: data.nameChangeDecl,
    ekitPrinted: data.ekitPrinted || policy?.ekitPrinted,
    assignment: data.assignment || policy?.assignment,
    salesChannel: data.salesChannel || policy?.salesChannel,
    policyAge: data.policyAge || age.policyAgeLabel,
    policyAge1: data.policyAge1 ?? age.policyAge1,
    availableSa: data.currentSA || policy?.currentSA || data.sumAssured || policy?.sumAssured,
  }
}

/** Flat wizard state → backend POST /trap-score body (v1 field names). */
export function buildTrapScoreApiPayload(data, policy) {
  const c = laClient(data, policy)
  const age = computePolicyAge(
    data.dateOfDeathEvent,
    data.riskCommencementDate || policy?.riskCommencementDate
  )
  const dob = data.laDob || c.dob
  const rawAge = data.laAgeAtDeath
  const ageAtDeath =
    typeof rawAge === 'number'
      ? rawAge
      : typeof rawAge === 'string' && /^\d+$/.test(rawAge.trim())
        ? parseInt(rawAge.trim(), 10)
        : computeAgeAtDeath(data.dateOfDeathEvent, dob)

  const claimRepudiate = data.claimsRupidiate || data.claimRepudiate || 'Not Required'

  const base = {
    gender: data.laGender || c.gender,
    ageAtDeath,
    education: data.laEducation || c.education,
    policyAge: data.policyAge1 ?? age.policyAge1,
    productCategory: data.portfolioType,
    occCategory: data.laOccCode || c.occCode,
    avlSA: data.currentSA || policy?.currentSA || data.sumAssured || policy?.sumAssured,
    advStatus: data.advisorStatus || policy?.advisorStatus,
    claimRepudiate,
    claimsRupidiate: claimRepudiate,
    causeOfDeath: data.causeOfClaim || data.causeDescription || data.causeCode,
    placeOfClaim: data.placeOfDeath,
    firPmReceived: data.firPmReceived,
    firPMReceived: data.firPmReceived,
    declareByDR: data.declaredByDoctor,
    umCode: data.umCode || policy?.umCode,
    advisorCode: data.advisorCode || policy?.advisorCode,
    advisorCategory: data.advisorCategory || policy?.advisorCategory,
    advisorClub: data.advisorClub || policy?.advisorClub,
    claimType: data.claimType,
    source: data.source,
    intimationDate: data.intimationDate,
    dateOfDeath: data.dateOfDeathEvent,
    dateOfDisability: data.dateOfDisability || data.dateOfDeathEvent,
    typeOfClaim: data.typeOfClaim,
    productCode: data.productCode || policy?.productCode,
    city: data.laCity || c.city,
    pin: data.laPincode || c.pincode,
    pinCode: data.laPincode || c.pincode,
  }

  return applyTrapScoreDefaults(base, data, policy)
}

const truncStr = (v, max) => (v == null || v === '' ? v : String(v).slice(0, max))

/** Map UI system decision → v1 decision_system column names (DECISION1, REASON1, …). */
export function buildSystemDetailsForDb(flat) {
  const src =
    flat.systemDetails && typeof flat.systemDetails === 'object' && !Array.isArray(flat.systemDetails)
      ? flat.systemDetails
      : {}
  const rec =
    flat.sysRecommendation || src.recommendation || src.decision1 || src.decision
  const reason = flat.sysReason || src.reason || src.reason1
  const risk = flat.sysRiskScore || src.riskScore || src.remarks1
  const payable =
    flat.sysPayableAmount ??
    src.payableAmount ??
    src.base ??
    src.totalAmtPayable ??
    flat.sumAssured

  return {
    decision1: truncStr(rec, 50),
    reason1: truncStr(reason, 100),
    remarks1: truncStr(risk, 100),
    base: payable,
    totalAmtPayable: payable,
  }
}

export function buildTrapScoreData(data, policy) {
  const score = parseFloat(data.trapScore)
  return {
    ...buildTrapScoreApiPayload(data, policy),
    trapScore: Number.isNaN(score) ? data.trapScore : score,
    trapRemarks: data.trapRemarks,
    trapScoreDate: data.trapDate || data.trapScoreDate || todayIso(),
    declaredByDoctor: data.declaredByDoctor,
    dateOfDeathEvent: data.dateOfDeathEvent,
    availableSa: data.sumAssured || policy?.sumAssured,
    pincode: data.laPincode || laClient(data, policy).pincode,
  }
}

export function buildEagleScreen(data) {
  return {
    laMobile: data.eagleLaMobile,
    claimantMobile: data.eagleClaimantMobile,
    agentMobile: data.eagleAgentMobile,
    bankName: data.eagleBankName,
    accountNo: data.eagleAccNo,
    accountOpenDate: data.eagleAccOpenDate,
    centerName: data.eagleCenterName,
    doctorName: data.eagleDoctorName,
    occupation: data.eagleOccupation,
    advisorHistoryCount: data.advisorHistoryCount,
  }
}

export function buildClaimQuestions(flat) {
  const ans = flat.assessmentAnswers || {}
  const out = {}
  REGISTRATION_ASSESSMENT_QUESTIONS.forEach((q, idx) => {
    const val = ans[q.id]
    if (!val) return
    out[`question${idx}`] = val === 'Yes' ? 'Y' : val === 'No' ? 'N' : val
  })
  return out
}

export function buildRequirementTableRows(flat) {
  if (Array.isArray(flat.requirementTable) && flat.requirementTable.length) {
    return flat.requirementTable.map((row) => ({
      requirementName1: row.requirementName1 || row.documentName || row.name,
      requirementType1: row.requirementType1 || row.docType,
      source1: row.source1 || row.source,
      status1: row.status1 || row.status,
      triggeredBy1: row.triggeredBy1 || row.triggeredBy || 'System',
      triggerDate1: row.triggerDate1 || row.triggerDate,
      receiptDate1: row.receiptDate1 || row.receiptDate || '',
    }))
  }
  const reqStatus = flat.reqStatus || {}
  const reqReceivedDates = flat.reqReceivedDates || {}
  const reqTriggerDates = flat.reqTriggerDates || {}
  const today = new Date().toISOString().split('T')[0]
  const defaultTrigger = flat.intimationDate || flat.initiationDate || today
  return REGISTRATION_REQUIREMENTS.map((doc) => ({
    requirementName1: doc.name,
    requirementType1: doc.docType,
    source1: doc.source,
    status1: reqStatus[doc.id] || 'Pending',
    triggeredBy1: 'System',
    triggerDate1: reqTriggerDates[doc.id] || defaultTrigger,
    receiptDate1: reqReceivedDates[doc.id] || '',
  }))
}

function buildTelecallingRows(flat) {
  if (!flat.telecallingDate && !flat.telecallerName && !flat.telecalledNumber) return []
  const details = [flat.telecallingRemarks, flat.telecallDuration && `Duration: ${flat.telecallDuration}`]
    .filter(Boolean)
    .join(' · ')
  return [
    {
      callTo: flat.telecalledNumber,
      theDate: flat.telecallingDate,
      callBy: flat.telecallerName,
      outcome: flat.telecallOutcome || flat.telecallStatus,
      details: truncStr(details, 4000),
    },
  ]
}

function buildCaseTriggerRows(flat) {
  if (!flat.caseTrigger) return []
  return [
    {
      reason: truncStr(flat.caseTrigger, 200),
      remarks: truncStr(flat.triggerReason || '', 4000),
      priorityFlag: truncStr(flat.priorityFlag || '', 200),
    },
  ]
}

function buildPriorityFlagRows(flat) {
  if (!flat.priorityFlag) return []
  return [{ reason: truncStr(flat.priorityFlag, 50) }]
}

/** Map flat v2 wizard state → v1 register-claim body (keeps flat fields too). */
export function buildRegistrationPayload(flat, policy) {
  const claimants = flat.claimants || flat.claimantDetails || []
  const payees = Array.isArray(flat.payeeDetails) ? flat.payeeDetails : []
  return {
    ...flat,
    policyID: flat.policyId || flat.policyID,
    intimationDetails: buildIntimationDetails(flat, policy),
    causeEvent: buildCauseEvent(flat),
    payeeDetails: payees,
    claimantDetails: claimants,
    lifeAssuredDetails: buildLifeAssuredDetails(flat, policy),
    contactDetails: buildContactDetails(flat, policy),
    eagleScreen: buildEagleScreen(flat),
    requirements: flat.requirements || {},
    requirementTable: buildRequirementTableRows(flat),
    claimQuestions: buildClaimQuestions(flat),
    systemDetails: buildSystemDetailsForDb(flat),
    accessorDetails: flat.accessorDetails || {
      decision: flat.accessorDecision || (flat.preAssessorRemarks ? 'Pending Assessment' : undefined),
      reqDamt: flat.accessorAmount,
      remarks: flat.accessorReason || flat.preAssessorRemarks,
    },
    verifierDetails: flat.verifierDetails || {
      sendMail: flat.sendMail !== 'No',
      status: flat.verificationStatus,
      remarks: flat.verificationRemarks,
    },
    systemAssessorRemarks: flat.systemAssessorRemarks || {
      remarks: flat.assessorRemarks || flat.systemAssessorRemarks,
      fraudRemarks: flat.fraudRemarks,
    },
    telecalling: buildTelecallingRows(flat),
    caseTrigger: buildCaseTriggerRows(flat),
    priorityFlag: buildPriorityFlagRows(flat),
    systemRemarks: [],
    smsData: [],
    unregisteredPolicies: [],
    reqCommonDetailsTable: [],
    reqRiderDetailsTable: [],
    reqEmailTable: [],
    reqLetterTable: [],
    hospitalDetailsTable: asArray(flat.hospitalDetails),
    doctorDetailsTable: asArray(flat.doctorDetails),
    proofDetailsTable: asArray(flat.proofDetails),
    insuranceProofDetailsTable: asArray(flat.insProofDetails),
    witnessDetailsTable: asArray(flat.witnessDetails),
    incomeDetailsTable: asArray(flat.incomeDetails),
    agentHistoryTable: asArray(policy?.agentRepudiation || flat.agentHistoryTable),
    trapScoreData: buildTrapScoreData(flat, policy),
    riderDetailsTable1: asArray(policy?.riders || flat.riderDetailsTable1),
    // Explicit IIB Enquiry fields (Assessment → IIB Enquiry sub-tab).
    // Keep them as top-level keys so registerClaimController can destructure them
    // even if a later spread overwrite ever drops something from `...flat`.
    iibRefNo: flat.iibRefNo || '',
    iibEnquiryDate: flat.iibEnquiryDate || null,
    iibStatus: flat.iibStatus || '',
    iibPoliciesFound: flat.iibPoliciesFound ?? '',
    iibTotalSA: flat.iibTotalSA ?? '',
    iibFraudFlag: flat.iibFraudFlag || '',
    iibMultiplePolicy: flat.iibMultiplePolicy || '',
    iibNonDisclosure: flat.iibNonDisclosure || '',
    iibRemarks: flat.iibRemarks || '',
  }
}

/** Sync v1 nested keys into flat state (for Requirements / trap / register). */
export function syncDemographicsSections(flat, policy) {
  const age = computePolicyAge(
    flat.dateOfDeathEvent,
    flat.riskCommencementDate || policy?.riskCommencementDate
  )
  return {
    intimationDetails: buildIntimationDetails(flat, policy),
    causeEvent: buildCauseEvent(flat),
    lifeAssuredDetails: buildLifeAssuredDetails(flat, policy),
    contactDetails: buildContactDetails(flat, policy),
    trapScoreData: buildTrapScoreData(flat, policy),
    eagleScreen: buildEagleScreen(flat),
    policyAge: flat.policyAge || age.policyAgeLabel,
    policyAge1: flat.policyAge1 ?? age.policyAge1,
  }
}
