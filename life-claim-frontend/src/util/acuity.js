export function acuityFromClaimRow(row) {
  if (!row || typeof row !== 'object') return null
  const final = row.FINAL_ACUITY_DECISION || row.finalAcuityDecision
  const claimant = row.CLAIMANT_ACUITY_DECISION || row.claimantAcuityDecision
  const payee = row.PAYEE_ACUITY_DECISION || row.payeeAcuityDecision
  if (!final && !claimant && !payee) return null
  return {
    finalAcuityDecision: final || 'NOT FLAGGED',
    claimantAcuityDecision: claimant || 'NOT FLAGGED',
    payeeAcuityDecision: payee || 'NOT FLAGGED',
  }
}
