import {
  REGISTRATION_ASSESSMENT_QUESTIONS,
  REGISTRATION_REQUIREMENTS,
} from '../config/registrationCatalog'

import { validateIntimationDates } from './intimationDateValidation'

const isEmpty = (v) => v == null || String(v).trim() === ''

const DEMO_SECTION_ORDER = [
  'register', 'intimation', 'cause', 'payee', 'claimant', 'la',
  'contract', 'eagle', 'trap', 'agent',
]

/** v1 sections that block Demographics → Requirements (la, eagle, agent are optional). */
const DEMO_SECTIONS_REQUIRED = [
  'register', 'intimation', 'cause', 'payee', 'claimant', 'contract', 'trap',
]

const DEMO_SECTION_LABELS = {
  register: 'Policy & Claim Setup',
  intimation: 'Intimation Details',
  cause: 'Declared Cause',
  payee: 'Payee Details',
  claimant: 'Claimant Details',
  la: 'Life Assured Details',
  contract: 'Contract Details',
  eagle: 'Eagle Screen',
  trap: 'Trap Score',
  agent: 'Agent Repudiation',
}

/** User-facing toast for validation failures. */
export function showValidationToast(toast, missing, title = 'Cannot continue') {
  if (!missing?.length) return
  const detail = missing.length <= 4
    ? missing.join(' · ')
    : `${missing.slice(0, 4).join(' · ')} (+${missing.length - 4} more)`
  toast('warning', title, detail)
}

/** Validate dynamic table / modal row fields. */
export function validateRowFields(fields = [], form = {}) {
  const missing = fields
    .filter((f) => f.required && isEmpty(form[f.key]))
    .map((f) => f.label)
  return { valid: missing.length === 0, missing }
}

function validateClaimants(claimants) {
  const missing = []
  if (!Array.isArray(claimants) || claimants.length === 0) {
    return ['At least one claimant — fill the form and click "Add Claimant"']
  }
  claimants.forEach((c, i) => {
    const n = i + 1
    if (isEmpty(c.clientId)) missing.push(`Claimant ${n}: Client ID`)
    if (isEmpty(c.name)) missing.push(`Claimant ${n}: Name`)
    if (isEmpty(c.dob)) missing.push(`Claimant ${n}: DOB`)
    if (isEmpty(c.gender)) missing.push(`Claimant ${n}: Gender`)
    if (isEmpty(c.role)) missing.push(`Claimant ${n}: Role`)
    if (isEmpty(c.relation)) missing.push(`Claimant ${n}: Relation with Life Assured`)
    if (isEmpty(c.flat)) missing.push(`Claimant ${n}: Flat / House No`)
    if (isEmpty(c.road)) missing.push(`Claimant ${n}: Road / Street`)
    if (isEmpty(c.area)) missing.push(`Claimant ${n}: Area`)
    if (isEmpty(c.state)) missing.push(`Claimant ${n}: State`)
    if (isEmpty(c.city)) missing.push(`Claimant ${n}: City`)
    if (isEmpty(c.pincode)) missing.push(`Claimant ${n}: Pincode`)
    if (isEmpty(c.mobileNo)) missing.push(`Claimant ${n}: Mobile No`)
  })
  return missing
}

function validateClaimantDraft(form) {
  const missing = []
  if (isEmpty(form.clientId)) missing.push('Claimant client ID')
  if (isEmpty(form.name)) missing.push('Claimant name')
  if (isEmpty(form.dob)) missing.push('Claimant date of birth')
  if (isEmpty(form.gender)) missing.push('Claimant gender')
  if (isEmpty(form.role)) missing.push('Claimant role')
  if (isEmpty(form.relation)) missing.push('Claimant relation with Life Assured')
  if (isEmpty(form.flat)) missing.push('Claimant flat / house no')
  if (isEmpty(form.road)) missing.push('Claimant road / street')
  if (isEmpty(form.area)) missing.push('Claimant area')
  if (isEmpty(form.state)) missing.push('Claimant state')
  if (isEmpty(form.city)) missing.push('Claimant city')
  if (isEmpty(form.pincode)) missing.push('Claimant pincode')
  if (isEmpty(form.mobileNo)) missing.push('Claimant mobile number')
  if (form.mobileNo && !/^\d{10}$/.test(String(form.mobileNo).trim())) {
    missing.push('Claimant mobile number (10 digits)')
  }
  return { valid: missing.length === 0, missing }
}

/** Inputs required before generating trap score (aligned with backend checkForNull). */
export function validateTrapScoreInputs(data, policy, policyClients = []) {
  const missing = []
  const la = policyClients[0] || {}
  if (isEmpty(data.causeOfClaim) && isEmpty(data.causeCode)) missing.push('Cause of Death (Section 3)')
  if (isEmpty(data.placeOfDeath)) missing.push('Place of Death (Section 2)')
  if (isEmpty(data.source)) missing.push('Source (Section 2)')
  if (isEmpty(data.intimationDate)) missing.push('Intimation Date (Section 2)')
  if (isEmpty(data.declaredByDoctor)) missing.push('Declared by Doctor (Section 2)')
  if (isEmpty(data.firPmReceived)) missing.push('FIR/PM Received (Section 2)')
  if (isEmpty(data.claimType)) missing.push('Claim Type')
  if (isEmpty(data.typeOfClaim)) missing.push('Type of Claim (Section 3)')
  if (isEmpty(data.portfolioType)) missing.push('Portfolio / Product Category (load policy)')
  const sumAssured = data.sumAssured || policy?.sumAssured
  if (sumAssured == null || sumAssured === '') missing.push('Sum Assured (load policy)')
  const gender = data.laGender || la.gender
  if (isEmpty(gender)) missing.push('Life Assured gender (Section 6 or policy)')
  const dod = data.dateOfDeathEvent
  const dob = data.laDob || la.dob
  if (isEmpty(dod) || isEmpty(dob)) missing.push('Date of Death and Life Assured DOB (for age at death)')
  const productCode = data.productCode || policy?.productCode
  const occ = data.laOccCode || la.occCode
  if (productCode?.charAt(0) !== 'G' && isEmpty(occ)) {
    missing.push('Life Assured occupation (Section 6 or policy)')
  }
  const city = data.laCity || la.city
  const pin = data.laPincode || la.pincode
  if (isEmpty(city)) missing.push('Life Assured city (Section 6 or policy)')
  if (isEmpty(pin)) missing.push('Life Assured pincode (Section 6 or policy)')
  const policyAge = data.policyAge1 ?? computePolicyAgeForTrap(data, policy)
  if (policyAge == null) missing.push('Policy age (set Date of Death in Intimation first)')
  const advisorPresent =
    data.advisorCode || policy?.advisorCode || data.umCode || data.advisorClub || data.advisorCategory
  if (isEmpty(advisorPresent)) missing.push('Advisor code (from policy / Section 7)')
  if (
    String(data.typeOfClaim || '').toLowerCase() === 'non-accidental' &&
    isEmpty(data.causeOfClaim) &&
    isEmpty(data.causeCode)
  ) {
    missing.push('Cause of Death for non-accidental claim (Section 3)')
  }
  return { valid: missing.length === 0, missing }
}

function computePolicyAgeForTrap(data, policy) {
  if (!data.dateOfDeathEvent) return null
  const rcd = data.riskCommencementDate || policy?.riskCommencementDate
  if (!rcd) return null
  const end = new Date(data.dateOfDeathEvent)
  const start = new Date(rcd)
  if (Number.isNaN(end.getTime()) || Number.isNaN(start.getTime()) || end < start) return null
  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  return Math.round((totalDays / 365.25) * 10) / 10
}

/** Validate a demographics sub-section before Save & Continue. */
export function validateDemographicsSection(sectionId, data, { policy, fromRegisterGate } = {}) {
  const missing = []

  switch (sectionId) {
    case 'register':
      if (!fromRegisterGate && !policy) missing.push('Policy (fetch from Life Asia)')
      if (isEmpty(data.claimType)) missing.push('Claim Type')
      if (isEmpty(data.informationType)) missing.push('Information Type')
      break

    case 'intimation':
      if (isEmpty(data.intimationDate)) missing.push('Intimation Date')
      if (isEmpty(data.source)) missing.push('Source')
      if (isEmpty(data.bondType)) missing.push('Bond Type')
      if (isEmpty(data.firPmReceived)) missing.push('FIR / PM Received')
      if (isEmpty(data.declaredByDoctor)) missing.push('Declared by Doctor')
      if (isEmpty(data.dateOfDeathEvent)) missing.push('Date of Death / Event')
      if (isEmpty(data.dateOfDeathReg)) missing.push('Date of Death Registration')
      if (isEmpty(data.placeOfDeath)) missing.push('Place of Death')
      if (data.dateOfDeathEvent && isEmpty(data.policyStatusOnDod)) {
        missing.push('Policy Status on DOD/DOE')
      }
      if (isEmpty(data.deathCertificate)) missing.push('Death Certificate Type')
      {
        const dateCheck = validateIntimationDates(data, { policy })
        if (!dateCheck.valid) missing.push(...dateCheck.errors)
      }
      break

    case 'cause':
      if (isEmpty(data.causeOfClaim) && isEmpty(data.causeCode)) {
        missing.push('Cause of Death / Event (select from master list)')
      }
      break

    case 'payee':
      if (isEmpty(data.selectedPayeeId)) missing.push('Payee selection from policy clients')
      if (isEmpty(data.payeeRelation)) missing.push('Payee relation with Life Assured')
      if (isEmpty(data.payeeStatus)) missing.push('Payee status')
      break

    case 'claimant':
      missing.push(...validateClaimants(data.claimants))
      break

    case 'la':
      break

    case 'contract':
      if (!policy && isEmpty(data.policyId)) missing.push('Policy details (load policy first)')
      if (isEmpty(data.nameChangeDecl)) missing.push('Name change declaration (Yes/No)')
      if (isEmpty(data.policyAge) && data.policyAge1 == null) {
        missing.push('Policy age (set Date of Death in Intimation first)')
      }
      break

    case 'eagle':
      break

    case 'trap':
      if (isEmpty(data.trapScore)) missing.push('Trap score — click "Generate Trap Score"')
      break

    case 'agent':
      break

    default:
      break
  }

  return { valid: missing.length === 0, missing }
}

/** v1 gate sections required before Demographics → Requirements. */
export function validateDemographicsForTrap(data, { policy, fromRegisterGate } = {}) {
  const sections = DEMO_SECTIONS_REQUIRED.filter(
    (id) => id !== 'trap' && (!fromRegisterGate || id !== 'register')
  )
  const missing = []
  sections.forEach((id) => {
    const result = validateDemographicsSection(id, data, { policy, fromRegisterGate })
    result.missing.forEach((m) => missing.push(`${DEMO_SECTION_LABELS[id]}: ${m}`))
  })
  return { valid: missing.length === 0, missing }
}

/** All mandatory demographics sections (v1 Next: Requirement gate). */
export function validateDemographicsComplete(data, { policy, fromRegisterGate } = {}) {
  const sections = fromRegisterGate
    ? DEMO_SECTIONS_REQUIRED.filter((id) => id !== 'register')
    : DEMO_SECTIONS_REQUIRED

  const missing = []
  sections.forEach((id) => {
    const result = validateDemographicsSection(id, data, { policy, fromRegisterGate })
    result.missing.forEach((m) => missing.push(`${DEMO_SECTION_LABELS[id]}: ${m}`))
  })
  return { valid: missing.length === 0, missing }
}

/** Document checklist before completing Requirements tab. */
export function validateRequirements(data, { allDocs = [] } = {}) {
  const missing = []
  const reqStatus = data.reqStatus || {}
  const reqRemarks = data.reqRemarks || {}
  const mandatoryDocs = allDocs.filter((d) => d.required)

  mandatoryDocs.forEach((doc) => {
    const status = reqStatus[doc.id] || 'Pending'
    if (status === 'Pending') {
      missing.push(`Mandatory document pending: ${doc.name}`)
    } else if (status === 'Waived' && isEmpty(reqRemarks[doc.id])) {
      missing.push(`Remark required for waived document: ${doc.name}`)
    }
  })

  return { valid: missing.length === 0, missing }
}

/** Assessment tab before advancing to Decision. */
export function validateAssessment(data, { questions = [], isPreAssessor = true } = {}) {
  const missing = []
  const ans = data.assessmentAnswers || {}

  if (questions.length > 0) {
    const unanswered = questions.filter((q) => isEmpty(ans[q.id]))
    if (unanswered.length) {
      missing.push(`${unanswered.length} assessment question(s) still unanswered`)
    }
  }

  if (isPreAssessor) {
    if (isEmpty(data.caseTrigger)) missing.push('Case Trigger (Assessment → Remarks tab)')
    if (isEmpty(data.priorityFlag)) missing.push('Priority Flag (Assessment → Remarks tab)')
  } else {
    if (isEmpty(data.accessorRemarks) && isEmpty(data.assessorRemarks)) {
      missing.push('Assessor remarks (Assessment → Remarks or Assessor Remarks tab)')
    }
  }

  return { valid: missing.length === 0, missing }
}

/** Full pre-assessor registration before final submit. */
export function validatePreAssessorSubmit(data, {
  policy,
  fromRegisterGate = false,
  questions = REGISTRATION_ASSESSMENT_QUESTIONS,
  allDocs = REGISTRATION_REQUIREMENTS,
} = {}) {
  const missing = []

  if (!data._demographicsComplete) {
    missing.push('Demographics — complete all sections and click "Complete Demographics"')
  } else {
    const demo = validateDemographicsComplete(data, { policy, fromRegisterGate })
    missing.push(...demo.missing)
  }

  if (!data._requirementsComplete) {
    missing.push('Requirements — mark all mandatory documents Received or Waived (with remark)')
  } else if (allDocs.length > 0) {
    const req = validateRequirements(data, { allDocs })
    missing.push(...req.missing)
  }

  if (!data._assessmentComplete) {
    missing.push('Assessment — answer all questions and set Case Trigger / Priority Flag')
  } else if (questions.length > 0) {
    const assess = validateAssessment(data, { questions, isPreAssessor: true })
    missing.push(...assess.missing)
  }

  if (isEmpty(data.sysRecommendation)) {
    missing.push('System Decision — complete Assessment or generate on Decision tab')
  }
  if (isEmpty(data.policyId)) missing.push('Policy ID')
  if (isEmpty(data.trapScore)) missing.push('Trap score')

  return { valid: missing.length === 0, missing }
}

/** Assessor / verifier decision tab submit. */
export function validateAssessorSubmit(data, {
  policy,
  questions = REGISTRATION_ASSESSMENT_QUESTIONS,
  allDocs = REGISTRATION_REQUIREMENTS,
} = {}) {
  const missing = []

  const demo = validateDemographicsComplete(data, { policy, fromRegisterGate: true })
  missing.push(...demo.missing)

  const req = validateRequirements(data, { allDocs })
  missing.push(...req.missing)

  const assess = validateAssessment(data, { questions, isPreAssessor: false })
  missing.push(...assess.missing)

  if (isEmpty(data.sysRecommendation)) missing.push('System Decision')
  if (isEmpty(data.accessorDecision)) missing.push('Accessor Decision')
  if (['Reject', 'Repudiate', 'Request More Documents', 'Refer to Verifier'].includes(data.accessorDecision)) {
    if (isEmpty(data.accessorReason)) missing.push('Accessor reason / remarks for this decision')
  }

  return { valid: missing.length === 0, missing }
}

export { validateClaimantDraft }
