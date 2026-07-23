/** Parse claim date from API (ISO or MySQL datetime). */
export function parseClaimDate(raw) {
  if (!raw) return null
  const s = String(raw).trim()
  if (!s) return null
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Match claim registration date against dashboard table filters. */
export function matchesDateFilter(createdRaw, filter = 'All') {
  if (!filter || filter === 'All') return true
  const claimDate = parseClaimDate(createdRaw)
  if (!claimDate) return false

  const today = startOfDay(new Date())
  const claimDay = startOfDay(claimDate)

  if (filter === 'Today') {
    return claimDay.getTime() === today.getTime()
  }

  if (filter === 'This Week') {
    const weekStart = new Date(today)
    const day = today.getDay()
    const daysFromMonday = day === 0 ? 6 : day - 1
    weekStart.setDate(today.getDate() - daysFromMonday)
    return claimDay >= weekStart && claimDay <= today
  }

  if (filter === 'This Month') {
    return (
      claimDay.getMonth() === today.getMonth()
      && claimDay.getFullYear() === today.getFullYear()
    )
  }

  return true
}

export function formatClaimDate(raw) {
  const d = parseClaimDate(raw)
  if (!d) {
    const s = String(raw || '').trim()
    const part = s.split('T')[0].split(' ')[0]
    return part || '—'
  }
  return d.toISOString().split('T')[0]
}

export function isTerminalClaimStatus(status) {
  const s = String(status || '').toLowerCase()
  return (
    s.includes('payout completed')
    || s.includes('approved')
    || s.includes('reject')
  )
}

/** Calendar days from registration to today (or last modified when closed). */
export function computeDaysOpen(createdAt, modifiedAt, status) {
  const start = parseClaimDate(createdAt)
  if (!start) return 0
  const terminal = isTerminalClaimStatus(status)
  const end = terminal ? (parseClaimDate(modifiedAt) || new Date()) : new Date()
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((end - start) / 86400000))
}

/** Timeline steps for hover preview — only dates we actually have. */
export function buildClaimTimelineSteps(claim) {
  const created = formatClaimDate(claim.created || claim.CREATED_AT)
  const modified = formatClaimDate(claim.modified || claim.MODIFIED_AT)
  const status = claim.status || '—'
  const terminal = isTerminalClaimStatus(status)

  const steps = [
    { label: 'Claim Registered', date: created, done: true },
  ]

  if (modified !== '—' && modified !== created) {
    steps.push({ label: 'Last Updated', date: modified, done: true })
  }

  steps.push({
    label: terminal ? status : (status !== '—' ? status : 'In Progress'),
    date: modified !== '—' ? modified : created,
    done: terminal,
    active: !terminal,
  })

  return steps
}
