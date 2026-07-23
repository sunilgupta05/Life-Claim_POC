import wrapper from '../../util/ApiWrapper'

const post = async (path, body) => {
  const res = await wrapper.fetchWithToken(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json().catch(() => ({}))
}

export const applyExclusionRules = (caseId) =>
  post('/Assessment/applyExclusionRules', { caseId })

export const applyExclusionRulesBatch = (caseIds) =>
  post('/Assessment/applyExclusionRulesBatch', { caseIds })

export const refreshAssessorPoolCase = (caseId) =>
  post('/Assessment/refreshAssessorPoolCase', { caseId })

export const refreshAssessorPoolCasesBatch = (caseIds) =>
  post('/Assessment/refreshAssessorPoolCasesBatch', { caseIds })
