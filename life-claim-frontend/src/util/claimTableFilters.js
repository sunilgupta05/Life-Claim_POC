/** Client-side filter + sort for Assessor / Verifier claim tables (My Task, Pool Selection). */

export function filterClaimRows(rows, {
  search = '',
  statusFilter = 'All Statuses',
  roleFilter = 'All Roles',
} = {}) {
  let list = rows
  const q = String(search || '').trim().toLowerCase()
  if (q) {
    list = list.filter((t) =>
      String(t.claimId || '').toLowerCase().includes(q)
      || String(t.policyId || '').toLowerCase().includes(q)
      || String(t.createdBy || '').toLowerCase().includes(q)
    )
  }
  if (statusFilter && statusFilter !== 'All Statuses') {
    list = list.filter((t) => String(t.status || '').toLowerCase() === statusFilter.toLowerCase())
  }
  if (roleFilter && roleFilter !== 'All Roles') {
    list = list.filter((t) => String(t.role || '').toLowerCase() === roleFilter.toLowerCase())
  }
  return list
}

export function sortClaimRows(rows, sortCol, sortDir = 'asc') {
  if (!sortCol) return rows
  const dir = sortDir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    let av = a[sortCol]
    let bv = b[sortCol]
    if (sortCol === 'createdOn') {
      const ad = new Date(av).getTime()
      const bd = new Date(bv).getTime()
      const an = Number.isNaN(ad) ? 0 : ad
      const bn = Number.isNaN(bd) ? 0 : bd
      if (an < bn) return -1 * dir
      if (an > bn) return 1 * dir
      return 0
    }
    av = String(av ?? '').toLowerCase()
    bv = String(bv ?? '').toLowerCase()
    if (av < bv) return -1 * dir
    if (av > bv) return 1 * dir
    return 0
  })
}

export function uniqueFieldValues(rows, field) {
  const set = new Set()
  rows.forEach((r) => {
    const v = String(r[field] || '').trim()
    if (v && v !== '—') set.add(v)
  })
  return [...set].sort((a, b) => a.localeCompare(b))
}

export const CLAIM_TABLE_COLUMNS = [
  { label: 'Claim Number', key: 'claimId' },
  { label: 'Policy Number', key: 'policyId' },
  { label: 'Created On', key: 'createdOn' },
  { label: 'Created By', key: 'createdBy' },
  { label: 'Status', key: 'status' },
  { label: 'Role', key: 'role' },
]
