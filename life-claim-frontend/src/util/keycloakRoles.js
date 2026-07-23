/** Flatten realm + client roles from a Keycloak JWT payload. */
export function extractKeycloakRoles(payload = {}) {
  const realm = Array.isArray(payload.realm_access?.roles) ? payload.realm_access.roles : []
  const resource = payload.resource_access && typeof payload.resource_access === 'object'
    ? payload.resource_access
    : {}
  const clientRoles = Object.values(resource).flatMap((entry) =>
    Array.isArray(entry?.roles) ? entry.roles : []
  )
  const extra = Array.isArray(payload.roles) ? payload.roles : []
  return [...new Set([...realm, ...clientRoles, ...extra].map((r) => String(r || '').trim()).filter(Boolean))]
}

export function extractKeycloakUsername(payload = {}) {
  return String(payload.preferred_username || payload.username || payload.sub || '').trim()
}
