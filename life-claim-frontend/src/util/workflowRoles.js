/** Assessor / Verifier pool roles from JWT (Section E1). */
export function getWorkflowPoolRoles(user) {
  const roles = user?.roles?.length ? user.roles : user?.role ? [user.role] : []
  return ['Assessor', 'Verifier'].filter((r) => roles.includes(r))
}

export function defaultPoolRole(user) {
  const pools = getWorkflowPoolRoles(user)
  if (pools.includes('Assessor')) return 'Assessor'
  return pools[0] || 'Assessor'
}
