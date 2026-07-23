import wrapper from '../util/ApiWrapper'
import { deriveTrapRisk } from '../util/buildRegistrationPayload'

const formatTrapDate = (ts) => {
  if (!ts) return new Date().toISOString().split('T')[0]
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? String(ts) : d.toISOString().split('T')[0]
}

export function normalizeTrapScoreResponse(payload) {
  const result = payload?.result || payload
  if (!result) {
    throw new Error(payload?.message || 'Trap score API returned no result')
  }
  const remarks = result.trapRemarks || ''
  const trapScore = result.trapScore ?? '0.0'
  const estimated = String(remarks).toLowerCase().includes('failure')
  return {
    trapScore,
    trapRisk: deriveTrapRisk(trapScore),
    trapRemarks: remarks || '# Trap score generated',
    trapDate: formatTrapDate(result.trapScoreDate),
    estimated,
  }
}

const trapScoreService = async (trapScoreData) => {
  const response = await wrapper.fetchWithToken(`/trap-score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      trapScoreData,
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.message || 'Trap score request failed')
  }
  return normalizeTrapScoreResponse(data)
}

export default trapScoreService
