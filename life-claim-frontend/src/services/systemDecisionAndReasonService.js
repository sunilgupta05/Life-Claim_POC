import wrapper from '../util/ApiWrapper'

const systemDecisionAndReasonService = async (sysdata) => {
  const response = await wrapper.fetchWithToken('/systemDec/generateSystemDecision', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      policyData: sysdata,
    }),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.message || 'System decision request failed')
  }
  return data
}

export default systemDecisionAndReasonService
