/** Map claim/workflow status strings to premium-grid badge tones */
export function statusToGridTone(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('reject') || s.includes('repudi')) return 'rejected'
  if (s.includes('payout completed') || s.includes('approved')) return 'approved'
  if (s.includes('pending verifier')) return 'info'
  if (s.includes('pending assessor') || s.includes('pending')) return 'pending'
  return 'neutral'
}
