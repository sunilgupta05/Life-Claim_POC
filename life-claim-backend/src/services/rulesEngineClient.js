const axios = require('axios');

const getRulesEngineBase = () =>
  (process.env.RULES_ENGINE_URL || 'http://localhost:8095').replace(/\/$/, '');

const isRulesEngineEnabled = () => process.env.RULES_ENGINE_ENABLED !== 'false';

/**
 * Evaluate ADD exclusion rules via life-claim-rules (Drools).
 * @param {{ caseId?: number, hasContractDetails: boolean, rcdYears: number }} facts
 * @returns {Promise<{ excluded: boolean, exclusionType?: string|null, reasons?: string[], engineVersion?: string }>}
 */
const evaluateAddExclusion = async (facts) => {
  const url = `${getRulesEngineBase()}/api/rules/add-exclusion`;
  const timeout = Number(process.env.RULES_ENGINE_TIMEOUT_MS || 10000);
  const { data } = await axios.post(url, facts, { timeout });
  return data;
};

module.exports = {
  evaluateAddExclusion,
  isRulesEngineEnabled,
  getRulesEngineBase,
};
