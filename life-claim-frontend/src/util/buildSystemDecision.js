const todayIso = () => new Date().toISOString().split('T')[0]

/** Map v2 wizard state → backend system decision payload (v1 field names included). */
export function buildSystemDecisionPayload(data, policy = null) {
  const sumAssured = data.sumAssured || policy?.sumAssured || policy?.currentSA || 0
  return {
    ...data,
    claimType: data.claimType || 'Death',
    policyStatusOnDOD: data.policyStatusOnDod || policy?.premiumStatus || 'IF',
    DATE_OF_DEATH: data.dateOfDeathEvent,
    DATE_OF_DISABILITY: data.dateOfDisability || data.dateOfDeathEvent,
    productCode: data.productCode || policy?.productCode,
    productType: data.portfolioType,
    portfolio: data.portfolioType,
    AVAILABLE_SA: sumAssured,
    RCD: data.riskCommencementDate || policy?.riskCommencementDate,
    ISSUE_DATE: data.issueDate || policy?.issueDate,
    PAID_TO_DATE: data.paidToDate || policy?.paidToDate,
    RISKCOMMENCEMENTDATE: data.riskCommencementDate || policy?.riskCommencementDate,
    POLICY_AGE: data.policyAge1,
    POLICY_STATUS: data.premiumStatus || policy?.premiumStatus,
    SOURCINGCHANNEL: data.salesChannel || policy?.salesChannel || 'Agency',
    sourcingChannel: data.salesChannel || policy?.salesChannel || 'Agency',
    trapScore: data.trapScore,
    trapRisk: data.trapRisk,
    typeOfClaim: data.typeOfClaim,
    source: data.source,
    sumAssured,
  }
}

/** POC system decision from wizard data when API returns unstructured/empty body. */
export function deriveLocalSystemDecision(data, policy = null) {
  const sumAssured = Number(data.sumAssured || policy?.sumAssured || policy?.currentSA || 0)
  const trap = parseFloat(data.trapScore || 0)
  const trapRisk = data.trapRisk || (trap >= 4 ? 'High' : trap >= 2 ? 'Medium' : 'Low')
  const reqStatus = data.reqStatus || {}
  const mandatoryPending = Object.values(reqStatus).filter((s) => s === 'Pending').length

  let recommendation = 'Approve'
  let reason =
    'Policy active on date of event. Mandatory requirements addressed. Trap score within acceptable range for standard processing.'

  if (!data.trapScore) {
    recommendation = 'Refer'
    reason = 'Trap score not generated — refer for manual assessment before approval.'
  } else if (trap >= 4) {
    recommendation = 'Refer'
    reason = `Trap score ${data.trapScore} (${trapRisk}) indicates elevated risk — refer for senior review.`
  } else if (mandatoryPending > 0) {
    recommendation = 'Refer'
    reason = `${mandatoryPending} document(s) still pending — refer until requirements are complete or waived.`
  }

  return {
    recommendation,
    payableAmount: sumAssured,
    reason,
    riskScore: trapRisk,
    processedOn: todayIso(),
    estimated: true,
  }
}

export function normalizeSystemDecisionResponse(raw, data, policy = null) {
  const nested = raw?.result
  const flat = nested && typeof nested === 'object' && !Array.isArray(nested) ? nested : raw

  const recommendation =
    flat?.recommendation || flat?.systemRecommendation || flat?.decision
  if (recommendation && recommendation !== 'NA' && recommendation !== 'ERR') {
    return {
      recommendation: recommendation === 'Success' ? 'Approve' : recommendation,
      payableAmount:
        flat?.payableAmount ?? flat?.systemPayableAmount ?? data.sumAssured ?? policy?.sumAssured ?? 0,
      reason:
        flat?.reason ||
        flat?.systemReason ||
        flat?.remark ||
        'System decision generated from claim data.',
      riskScore: flat?.riskScore || data.trapRisk || 'Low',
      processedOn: flat?.processedOn || todayIso(),
      estimated: false,
      rawResult: raw?.rawResult ?? nested,
      rawResult1: raw?.rawResult1 ?? raw?.result1,
    }
  }

  if (typeof nested === 'string' && nested !== 'Success') {
    const local = deriveLocalSystemDecision(data, policy)
    return {
      ...local,
      reason: `${nested}. ${local.reason}`,
      estimated: true,
    }
  }

  return deriveLocalSystemDecision(data, policy)
}
