import { coalesceRoles } from './workflowRole'
import { resolveDisplayRole } from './superuserRole'

/** Build AuthContext user from server session profile (no JWT in browser storage). */
export function buildUserFromProfile(profile) {
  if (!profile) return null
  const roles = coalesceRoles(profile.roles || [])
  const username = String(profile.preferred_username || profile.username || '').trim()
  const name =
    [profile.given_name, profile.family_name].filter(Boolean).join(' ') || username
  return {
    id: profile.sub || username,
    username,
    name,
    email: profile.email || null,
    role: resolveDisplayRole(roles, username),
    roles,
    avatar:
      (profile.given_name?.[0] || username[0] || '').toUpperCase() +
      (profile.family_name?.[0] || ''),
    tokenExp: profile.exp || null,
    loginTime: new Date().toISOString(),
  }
}

/** Decode JWT payload for session profile (no token storage in browser). */
export function decodeJwtProfile(accessToken) {
  if (!accessToken || typeof accessToken !== 'string') return null
  try {
    const payloadPart = accessToken.split('.')[1]
    if (!payloadPart) return null
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function profileFromLoginResponse(data, fallbackUsername = '') {
  if (data?.user && typeof data.user === 'object') return data.user
  const payload = decodeJwtProfile(data?.access_token)
  if (!payload) return null
  return {
    sub: payload.sub || fallbackUsername,
    preferred_username: payload.preferred_username || payload.username || fallbackUsername,
    roles: payload.realm_access?.roles || payload.roles || [],
    email: payload.email || null,
    given_name: payload.given_name || null,
    family_name: payload.family_name || null,
    exp: payload.exp || null,
  }
}

export function clearLegacyTokenStorage() {
  try {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('refreshToken')
  } catch {
    /* ignore */
  }
}
