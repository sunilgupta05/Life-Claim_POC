import { workflowStatusFromRow, resolveClaimantName } from './claimSearchMap'
import { coalesceRoles, resolveWorkflowRole } from './workflowRole'
import { computeDaysOpen, formatClaimDate } from './claimDaysOpen'
import { percentOf, withDisplayPercents } from './percentDisplay'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function last6CalendarMonthSlots() {
  const now = new Date()
  const slots = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    slots.push({
      name: MONTH_NAMES[d.getMonth()],
      key: `${d.getFullYear()}-${d.getMonth()}`,
    })
  }
  return slots
}

const REJECTED_STATUSES = new Set([
  'rejected',
  'assessor rejected',
  'verifier rejected',
  'payout rejected',
])

const APPROVED_TERMINAL = new Set(['approved', 'payout completed'])

export function claimStatusKey(row) {
  const ws = workflowStatusFromRow(row)
  if (ws && ws !== '—') return ws.toLowerCase()
  return String(row?.status || row?.STATUS || row?.CLAIM_STATUS || '').trim().toLowerCase()
}

function isRejectedStatus(status) {
  return REJECTED_STATUSES.has(status)
}

function isApprovedStatus(status, workflowRole) {
  if (APPROVED_TERMINAL.has(status)) return true
  if (workflowRole === 'assessor') {
    return status === 'pending verifier allocation' || status === 'pending verifier action'
  }
  return false
}

/** Each claim maps to exactly one bucket: pending | approved | rejected */
export function classifyClaimBucket(row, userRoles = []) {
  const status = claimStatusKey(row)
  const workflowRole = resolveWorkflowRole(coalesceRoles(userRoles))

  if (isRejectedStatus(status)) return 'rejected'
  if (isApprovedStatus(status, workflowRole)) return 'approved'
  return 'pending'
}

export function normalizeClaimType(raw) {
  const t = String(raw || '').trim()
  if (!t) return 'Other'
  const lower = t.toLowerCase()
  if (lower === 'death' || lower === 'death claim') return 'Death'
  if (lower === 'rider' || lower === 'rider claim') return 'Rider'
  return t
}

export function mapDashboardClaimRow(row) {
  const ws = workflowStatusFromRow(row)
  const status = ws === '—' ? 'Pending' : ws
  const createdRaw = row.CREATED_AT || row.INITIMATION_DATE || row.created
  const modifiedRaw = row.MODIFIED_AT || row.modified
  return {
    id: row.CLAIM_NUMBER || row.id,
    policy: row.POLICY_ID || row.policy,
    claimant: resolveClaimantName(row),
    type: normalizeClaimType(row.CLAIM_TYPE || row.type),
    status,
    statusKey: claimStatusKey(row),
    priority: row.priority || 'Normal',
    amount: Number(row.amount ?? row.CURRENT_SA ?? row.ORIGINAL_SA ?? 0) || 0,
    created: formatClaimDate(createdRaw),
    createdRaw,
    modified: formatClaimDate(modifiedRaw),
    modifiedRaw,
    daysOpen: computeDaysOpen(createdRaw, modifiedRaw, status),
    bucket: null,
  }
}

const parseClaimAmount = (row) =>
  Number(row.amount ?? row.AMOUNT ?? row.CURRENT_SA ?? row.ORIGINAL_SA ?? 0) || 0

export function buildDashboardMetrics(rawClaims = [], userRoles = []) {
  const claims = (rawClaims || []).map((row) => {
    const mapped = mapDashboardClaimRow(row)
    mapped.bucket = classifyClaimBucket(row, userRoles)
    return mapped
  })

  const pending = claims.filter((c) => c.bucket === 'pending')
  const approved = claims.filter((c) => c.bucket === 'approved')
  const rejected = claims.filter((c) => c.bucket === 'rejected')
  const total = claims.length

  const pendingAmounts = pending.map((c) => c.amount)
  const totalPipelineValue = pendingAmounts.reduce((sum, n) => sum + n, 0)
  const daysList = pending.map((c) => c.daysOpen)
  const avgDaysOpen = daysList.length
    ? Math.round((daysList.reduce((a, b) => a + b, 0) / daysList.length) * 10) / 10
    : 0
  const overdueCount = daysList.filter((d) => d > 3).length
  const slaCompliance = percentOf(approved.length, total)
  const approvalRate = percentOf(approved.length, total)

  const typeMap = {}
  claims.forEach((c) => {
    typeMap[c.type] = (typeMap[c.type] || 0) + 1
  })
  const typeColors = ['#1D4ED8', '#0891B2', '#7C3AED', '#059669', '#D97706', '#64748B']
  const typeBreakdownRaw = Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name, value, color: typeColors[i % typeColors.length] }))
  const typeBreakdown = withDisplayPercents(typeBreakdownRaw, total)

  const trendBuckets = {}
  claims.forEach((c) => {
    if (!c.createdRaw) return
    const d = new Date(c.createdRaw)
    if (Number.isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!trendBuckets[key]) trendBuckets[key] = { approved: 0, rejected: 0, pending: 0 }
    if (c.bucket === 'approved') trendBuckets[key].approved++
    else if (c.bucket === 'rejected') trendBuckets[key].rejected++
    else trendBuckets[key].pending++
  })
  const monthlyTrend = last6CalendarMonthSlots().map(({ name, key }) => {
    const b = trendBuckets[key] || { approved: 0, rejected: 0, pending: 0 }
    const monthTotal = b.approved + b.rejected + b.pending
    return { name, approved: b.approved, rejected: b.rejected, pending: b.pending, total: monthTotal }
  })
  const monthlyTrendSum = monthlyTrend.reduce((sum, m) => sum + m.total, 0)

  const fraudFlags = claims.filter((c) => {
    const f = String(c.priority || '').toLowerCase()
    return f === 'high' || f === 'fraud'
  }).length

  return {
    total,
    pending: pending.length,
    approved: approved.length,
    rejected: rejected.length,
    totalPipelineValue,
    avgDaysOpen,
    overdueCount,
    slaCompliance,
    approvalRate,
    fraudFlags,
    claims,
    typeBreakdown,
    monthlyTrend,
    monthlyTrendSum,
    pieData: withDisplayPercents(
      [
        { name: 'Approved', value: approved.length, color: '#059669' },
        { name: 'Pending', value: pending.length, color: '#D97706' },
        { name: 'Rejected', value: rejected.length, color: '#DC2626' },
      ].filter((d) => d.value > 0),
      total
    ),
  }
}
