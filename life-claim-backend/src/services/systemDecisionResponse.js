/** Normalize legacy BRE output into a stable API shape for v2 UI. */
function buildSystemDecisionResponse(policyData = {}, rawResult, rawResult1) {
  const sumAssured = Number(
    policyData.sumAssured ||
      policyData.currentSA ||
      policyData.AVAILABLE_SA ||
      policyData.availableSa ||
      0
  );
  const trap = parseFloat(policyData.trapScore || 0);
  const trapRisk =
    policyData.trapRisk || (trap >= 4 ? "High" : trap >= 2 ? "Medium" : "Low");

  let recommendation = "Approve";
  let reason =
    "Policy status, documentation, and trap score evaluated. Claim meets standard acceptance criteria.";

  if (!policyData.trapScore) {
    recommendation = "Refer";
    reason = "Trap score not available — refer for manual assessment.";
  } else if (trap >= 4) {
    recommendation = "Refer";
    reason = `Trap score ${policyData.trapScore} (${trapRisk}) exceeds threshold — refer for senior review.`;
  } else if (
    typeof rawResult === "string" &&
    rawResult !== "Success" &&
    !String(rawResult).toLowerCase().includes("approve")
  ) {
    recommendation = "Refer";
    reason = String(rawResult);
  }

  return {
    recommendation,
    payableAmount: sumAssured,
    reason,
    riskScore: trapRisk,
    processedOn: new Date().toISOString().split("T")[0],
    rawResult,
    rawResult1,
  };
}

module.exports = { buildSystemDecisionResponse };
