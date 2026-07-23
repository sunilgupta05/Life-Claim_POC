/** Business timezone for naive MySQL DATETIME values (no offset in DB). */
const APP_TZ_OFFSET = '+05:30'

/**
 * Parse activity timestamps from API (MySQL datetime, ISO, or Date).
 * Naive "YYYY-MM-DD HH:mm:ss" values are treated as IST (+05:30).
 */
export function parseActivityDate(input) {
  if (!input) return null
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input
  }
  const s = String(input).trim()
  if (!s || /^\d+[smhd]\s+ago$/i.test(s)) return null

  const mysql = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?$/)
  if (mysql) {
    return new Date(`${mysql[1]}T${mysql[2]}${APP_TZ_OFFSET}`)
  }

  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Relative time in the user's browser locale (e.g. "5m ago", "2h ago"). */
export function formatRelativeTime(input, { now = new Date() } = {}) {
  const date = parseActivityDate(input)
  if (!date) {
    return typeof input === 'string' ? input : ''
  }

  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`

  const minutes = Math.floor(diffSec / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
