/** Normalize role strings for comparison (Keycloak, DB JSON, legacy labels). */
export function normRole(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Flatten roles from JWT, DB JSON string, or single role field. */
export function coalesceRoles(...sources) {
  const out = []
  for (const src of sources) {
    if (src == null || src === '') continue
    if (Array.isArray(src)) {
      out.push(...src)
      continue
    }
    if (typeof src === 'string') {
      const trimmed = src.trim()
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed)
          if (Array.isArray(parsed)) {
            out.push(...parsed)
            continue
          }
        } catch {
          /* fall through */
        }
      }
      out.push(trimmed)
    }
  }
  return [...new Set(out.map((r) => String(r).trim()).filter(Boolean))]
}

function isDefaultRealmRole(role) {
  const n = normRole(role)
  return n.startsWith('default') || n === 'offline access' || n === 'uma authorization'
}

export function isPreAssessorRoleName(role) {
  const n = normRole(role)
  if (!n) return false
  if (n === 'pre assessor' || n === 'preassessor') return true
  return n.includes('pre') && n.includes('assessor')
}

export function isAssessorRoleName(role) {
  const n = normRole(role)
  if (!n || isPreAssessorRoleName(role)) return false
  return n === 'assessor' || (n.includes('assessor') && !n.includes('pre'))
}

export function isVerifierRoleName(role) {
  const n = normRole(role)
  if (!n) return false
  return n === 'verifier' || n.includes('verifier')
}

export function matchOperationalRole(roles, target) {
  const list = coalesceRoles(roles)
  const want = normRole(target)
  if (want === 'pre assessor') return list.some(isPreAssessorRoleName)
  if (want === 'assessor') return list.some(isAssessorRoleName)
  if (want === 'verifier') return list.some(isVerifierRoleName)
  return list.some((r) => normRole(r) === want)
}

/**
 * Highest workflow role for the current user (verifier > assessor > pre assessor).
 * claimRole is a fallback when JWT/DB roles only contain Keycloak defaults.
 */
export function resolveWorkflowRole(userRoles = [], claimRole = null) {
  const list = coalesceRoles(userRoles, claimRole).filter((r) => !isDefaultRealmRole(r))

  if (list.some(isVerifierRoleName)) return 'verifier'
  if (list.some(isAssessorRoleName)) return 'assessor'
  if (list.some(isPreAssessorRoleName)) return 'pre assessor'

  const claim = normRole(claimRole)
  if (claim === 'verifier') return 'verifier'
  if (claim === 'assessor') return 'assessor'
  if (claim === 'pre assessor') return 'pre assessor'

  return null
}

export function primaryOperationalRole(userRoles = [], userRole = null, claimRole = null) {
  return resolveWorkflowRole(coalesceRoles(userRoles, userRole), claimRole)
}

/** Human-readable role for UI — hides Keycloak default-role-* labels. */
export function formatWorkflowRoleLabel(role) {
  const r = normRole(role)
  if (!r || isDefaultRealmRole(role)) return ''
  if (r === 'pre assessor') return 'Pre Assessor'
  if (r === 'assessor') return 'Assessor'
  if (r === 'verifier') return 'Verifier'
  if (r === 'superuser' || r === 'super user') return 'Super User'
  return String(role || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
