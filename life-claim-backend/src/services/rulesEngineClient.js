const axios = require('axios');
const config = require('../config/configService');

// Secret: stays in .env, never in the DB config store.
const RULES_ENGINE_API_KEY = process.env.RULES_ENGINE_API_KEY || 'dev-only-change-me';

// Business settings via the centralized config service (roadmap 0.3):
// resolves app_config (DB, runtime-editable) -> .env -> default. Read at
// call-time so runtime edits hot-reload without a restart. Behaviour is
// identical to the previous process.env reads when no DB value is set.
const getRulesEngineBase = () =>
  config.get('RULES_ENGINE_URL', 'http://localhost:8095').replace(/\/$/, '');

const isRulesEngineEnabled = () => config.getBool('RULES_ENGINE_ENABLED', true);

/**
 * Evaluate ADD exclusion rules via life-claim-rules (Drools).
 * @param {{ caseId?: number, hasContractDetails: boolean, rcdYears: number }} facts
 * @returns {Promise<{ excluded: boolean, exclusionType?: string|null, reasons?: string[], engineVersion?: string }>}
 */
const evaluateAddExclusion = async (facts) => {
  const url = `${getRulesEngineBase()}/api/rules/add-exclusion`;
  const timeout = config.getNumber('RULES_ENGINE_TIMEOUT_MS', 10000);
  const { data } = await axios.post(url, facts, {
    timeout,
    headers: { 'X-Internal-Api-Key': RULES_ENGINE_API_KEY },
  });
  return data;
};

module.exports = {
  evaluateAddExclusion,
  isRulesEngineEnabled,
  getRulesEngineBase,
};
