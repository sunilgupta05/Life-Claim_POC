import { normalizePolicyResponse } from './normalizePolicyResponse'

/** Policy clients for payee table = LifeAssured.ClientDetails only. */
export function getPolicyClients(policy) {
  if (!policy) return []

  if (Array.isArray(policy.clients) && policy.clients.length > 0) {
    return policy.clients
  }

  if (policy.FinalElement || policy.finalElement) {
    const normalized = normalizePolicyResponse(policy, policy.policyId)
    return normalized.clients || []
  }

  if (policy._raw) {
    const normalized = normalizePolicyResponse(policy._raw, policy.policyId)
    return normalized.clients || []
  }

  return []
}

/** v1 register-claim payeeDetails[] row shape. */
export function clientToPayeeRow(client, overrides = {}) {
  if (!client) return null
  const country = overrides.country ?? overrides.payeeCountry ?? client.country ?? null
  return {
    name: overrides.name ?? overrides.payeeName ?? client.name ?? '',
    lastName: overrides.lastName ?? overrides.payeeLastName ?? client.lastName ?? '',
    clientId: overrides.clientId ?? client.clientId ?? '',
    dob: overrides.dob ?? overrides.payeeDob ?? client.dob ?? '',
    gender: overrides.gender ?? client.gender ?? '',
    role: overrides.role ?? overrides.payeeRole ?? client.role ?? '',
    riskIndicator: overrides.riskIndicator ?? client.riskIndicator ?? '',
    idNumber: overrides.idNumber ?? overrides.payeeIdNumber ?? client.idNumber ?? '',
    relationWithLifeAsr:
      overrides.relationWithLifeAsr ?? overrides.payeeRelation ?? client.relation ?? '',
    status: overrides.status ?? overrides.payeeStatus ?? client.status ?? '',
    panNo: overrides.panNo ?? overrides.payeePanNo ?? client.panNo ?? '',
    panValidityFlag: overrides.panValidityFlag ?? '',
    updatePayee: overrides.updatePayee ?? '',
    flat: overrides.flat ?? client.flat ?? '',
    road: overrides.road ?? client.road ?? '',
    area: overrides.area ?? client.area ?? '',
    state: overrides.state ?? client.state ?? '',
    country,
    nationality:
      overrides.nationality ??
      client.nationality ??
      (country === 'India' ? 'Indian' : country ? 'NRI' : ''),
    pinCode: overrides.pinCode ?? overrides.payeePincode ?? client.pincode ?? '',
    city: overrides.city ?? client.city ?? '',
    telNo: overrides.telNo ?? overrides.payeeTelNo ?? client.telNo ?? '',
    mobileNo: overrides.mobileNo ?? overrides.payeeMobileNo ?? client.mobileNo ?? '',
    emailId: overrides.emailId ?? overrides.payeeEmailId ?? client.emailId ?? '',
    accuityRiskIndicator: overrides.accuityRiskIndicator ?? client.riskIndicator ?? '',
  }
}

export function buildPayeeDetailsArray(clients, selectedClientId, formData = {}) {
  return (clients || []).map((client) => {
    const isSelected = client.clientId === selectedClientId
    const overrides = isSelected
      ? {
          payeeName: formData.payeeName,
          payeeLastName: formData.payeeLastName,
          payeeDob: formData.payeeDob,
          payeeCountry: formData.payeeCountry,
          payeeRole: formData.payeeRole,
          payeeRelation: formData.payeeRelation,
          payeeStatus: formData.payeeStatus,
          payeePanNo: formData.payeePanNo,
          payeeTelNo: formData.payeeTelNo,
          payeeMobileNo: formData.payeeMobileNo,
          payeeEmailId: formData.payeeEmailId,
          payeeIdNumber: formData.payeeIdNumber,
        }
      : {}
    return clientToPayeeRow(client, overrides)
  })
}

export function findSelectedPayee(clients, selectedClientId) {
  return (clients || []).find((c) => c.clientId === selectedClientId) || null
}
