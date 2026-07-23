export function todayIsoDate() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function parseIsoDate(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  if (!s) return null
  const d = new Date(s.includes('T') ? s : `${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function compareIsoDates(a, b) {
  const da = parseIsoDate(a)
  const db = parseIsoDate(b)
  if (!da || !db) return null
  da.setHours(0, 0, 0, 0)
  db.setHours(0, 0, 0, 0)
  return da.getTime() - db.getTime()
}

/**
 * Cross-field date rules for Intimation Details (Section 2).
 * Returns specific messages for Save & Continue and per-field inline errors.
 */
export function validateIntimationDates(data, { policy, laDob: laDobOverride } = {}) {
  const errors = []
  const fieldErrors = {}
  const today = todayIsoDate()

  const add = (field, message) => {
    if (!fieldErrors[field]) fieldErrors[field] = message
    if (!errors.includes(message)) errors.push(message)
  }

  const intimation = data.intimationDate
  const dod = data.dateOfDeathEvent
  const dodReg = data.dateOfDeathReg
  const accident = data.dateOfAccident
  const cremation = data.dateOfCremation
  const dcReg = data.dcRegDate
  const rcd = data.riskCommencementDate || policy?.riskCommencementDate
  const laDob = laDobOverride || data.laDob

  const checkNotFuture = (field, label, value) => {
    if (!value) return
    if (compareIsoDates(value, today) > 0) {
      add(field, `${label} cannot be later than today`)
    }
  }

  checkNotFuture('intimationDate', 'Intimation Date', intimation)
  checkNotFuture('dateOfDeathEvent', 'Date of Death / Event', dod)
  checkNotFuture('dateOfDeathReg', 'Date of Death Registration', dodReg)
  checkNotFuture('dateOfAccident', 'Date of Accident', accident)
  checkNotFuture('dateOfCremation', 'Date of Cremation', cremation)
  if (data.deathCertificate !== 'NA') {
    checkNotFuture('dcRegDate', 'Death Certificate Reg. Date', dcReg)
  }

  if (dod && accident && compareIsoDates(dod, accident) < 0) {
    add('dateOfDeathEvent', 'Date of Death cannot be earlier than Date of Accident')
    add('dateOfAccident', 'Date of Accident cannot be after Date of Death')
  }

  if (dod && dodReg && compareIsoDates(dodReg, dod) < 0) {
    add('dateOfDeathReg', 'Date of Death Registration cannot be earlier than Date of Death')
  }

  if (dod && cremation && compareIsoDates(cremation, dod) < 0) {
    add('dateOfCremation', 'Date of Cremation cannot be earlier than Date of Death')
  }

  if (intimation && dod && compareIsoDates(intimation, dod) < 0) {
    add('intimationDate', 'Intimation Date cannot be earlier than Date of Death / Event')
  }

  if (intimation && dodReg && compareIsoDates(intimation, dodReg) < 0) {
    add('intimationDate', 'Intimation Date cannot be earlier than Date of Death Registration')
  }

  if (intimation && accident && compareIsoDates(intimation, accident) < 0) {
    add('intimationDate', 'Intimation Date cannot be earlier than Date of Accident')
  }

  if (dod && laDob && compareIsoDates(dod, laDob) < 0) {
    add('dateOfDeathEvent', 'Date of Death cannot be earlier than Life Assured date of birth')
  }

  if (dod && rcd && compareIsoDates(dod, rcd) < 0) {
    add('dateOfDeathEvent', 'Date of Death cannot be before policy Risk Commencement Date')
  }

  if (dcReg && dodReg && data.deathCertificate !== 'NA' && compareIsoDates(dcReg, dodReg) < 0) {
    add('dcRegDate', 'Death Certificate Reg. Date cannot be earlier than Date of Death Registration')
  }

  return { valid: errors.length === 0, errors, fieldErrors }
}
