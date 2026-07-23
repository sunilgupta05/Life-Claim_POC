/** Shared CAPS row mappers (Section I). */

export const CASE_SEARCH_ATTRIBUTES = [
  { id: 'policy_number', label: 'Policy Number' },
  { id: 'krn', label: 'KRN' },
  { id: 'case_status', label: 'Case Status' },
  { id: 'iris_status', label: 'IRIS Status' },
]

export const CASE_ASSIGNMENT_EXTRA_ATTRIBUTES = [
  { id: 'assigned_to', label: 'Assigned To' },
]

export const POOL_SEARCH_ATTRIBUTES = [
  { id: '', label: 'No filter (all in pool)' },
  { id: 'policy_number', label: 'Policy Number' },
  { id: 'case_id', label: 'Case Id' },
  { id: 'krn', label: 'KRN' },
  { id: 'app_no', label: 'Application Number' },
  { id: 'case_status', label: 'Case Status' },
  { id: 'iris_status', label: 'IRIS Status' },
  { id: 'base_sa', label: 'Base SA' },
]

export function extractCaseRows(result) {
  if (result?.success && Array.isArray(result.data)) return result.data
  if (Array.isArray(result?.data)) return result.data
  if (Array.isArray(result)) return result
  return []
}

export function mapCaseRow(row) {
  const caseId = row.case_id ?? row.CASE_ID ?? row.id
  return {
    caseId: caseId != null ? String(caseId) : '—',
    policyNumber: row.policy_number || row.POLICY_NUMBER || '—',
    krn: row.krn || row.KRN || '—',
    source: row.source || row.SOURCE || '—',
    irisStatus: row.iris_status || row.IRIS_STATUS || '—',
    referralDate: formatCaseDate(row.referral_date || row.referralDate || row.created_on),
    initiationDate: formatCaseDate(row.initiation_date || row.initiationDate),
    assignedTo: row.assigned_to || row.ASSIGNED_TO || 'Unassigned',
    status: row.case_status || row.CASE_STATUS || row.status || 'Open',
    exclusionType: row.exclusion_type_rule || row.exclusion_type || '—',
  }
}

export function mapPoolRow(row) {
  const caseId = row.case_id ?? row.CASE_ID
  return {
    caseId: caseId != null ? String(caseId) : null,
    policyId: row.policy_number || row.policy_no || row.POLICY_NO || '—',
    applicationNo: row.application_number || row.application_no || row.APPLICATION_NO || '—',
    krn: row.krn || row.ksn || row.KSN || '—',
    source: row.source || row.SOURCE || '—',
    referralDate: formatCaseDate(row.referral_date || row.REFERRAL_DATE),
    triggerDate: formatCaseDate(row.trigger_date || row.TRIGGER_DATE),
    status: row.case_status || row.CASE_STATUS || row.status || 'Pending',
    exclusionType: row.exclusion_type || row.EXCLUSION_TYPE || '—',
    exclusion: row.is_excluded === 'Y' || row.exclusion_type ? 'Y' : 'N',
    daysOpen: row.scn_aging ?? row.sch_aging ?? row.SCH_AGING ?? 0,
    irisStatus: row.iris_status || row.irss_status || row.IRSS_STATUS || '—',
    productCode: row.product_code || row.PRODUCT_CODE || '—',
    policyStatus: row.policy_status || row.POLICY_STATUS || '—',
    baseSa: row.base_sum_assured ?? row.base_sa ?? row.BASE_SA ?? '—',
    city: row.city || row.CITY || '—',
    state: row.state || row.STATE || '—',
    pincode: row.pincode || row.PINCODE || '—',
  }
}

function formatCaseDate(raw) {
  if (!raw) return '—'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return String(raw).split('T')[0] || '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Match capsAddCaseSearchDoa policy_number padding for validation. */
export function normalizePolicyNumber(value) {
  const s = String(value ?? '').trim()
  if (!s) return ''
  if (s.length < 8 && /^\d+$/.test(s)) return s.padStart(8, '0')
  return s
}

