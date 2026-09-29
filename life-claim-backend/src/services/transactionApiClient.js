const axios = require('axios');
const appConfig = require('../config/configService');
const { run } = require('../util/resilience');

/**
 * Transaction API (Life Asia) base URL.
 * Prefer TXN_API_BASE_URL, e.g. http://localhost:3003
 */
const getTransactionApiBase = () =>
  (
    appConfig.get('TXN_API_BASE_URL') ||
    `http://${appConfig.get('TXN_HOST') || process.env.DB_HOST || 'localhost'}:${appConfig.get('TXN_PORT') || '3003'}`
  ).replace(/\/$/, '');

/** Pad policy numbers to 8 digits for Life Asia policySearch. */
const formatPolicyNumber = (policyNo) => {
  let formatted = String(policyNo ?? '').trim();
  if (!formatted) return formatted;
  if (formatted.length < 8) formatted = formatted.padStart(8, '0');
  return formatted;
};

/** Life Asia policy search — GET /api/policy/policySearch/{policyNo} */
const buildPolicySearchUrl = (policyNo) =>
  `${getTransactionApiBase()}/api/policy/policySearch/${formatPolicyNumber(policyNo)}`;

/**
 * Fetch policy master from Life Asia (policySearch).
 * @returns {{ data: object, formattedPolicyNo: string }}
 */
const fetchPolicySearch = async (policyNo) => {
  const formattedPolicyNo = formatPolicyNumber(policyNo);
  if (!formattedPolicyNo) {
    throw new Error('Policy number is required');
  }
  const url = buildPolicySearchUrl(formattedPolicyNo);
  // Resilient call (roadmap 3.1): circuit breaker + retry/backoff; the axios
  // timeout (below, also a hard backstop) prevents an indefinite hang.
  const timeout = appConfig.getNumber('TRANSACTION_API_TIMEOUT_MS', undefined);
  const response = await run(
    'transaction-api',
    () => axios.get(url, timeout ? { timeout } : { timeout: 10000 }),
    timeout ? { timeout } : undefined
  );
  return { data: response.data || {}, formattedPolicyNo };
};

/** Throws if policySearch response has no contract or life assured data. */
const assertPolicySearchHasData = (apiResponse, formattedPolicyNo) => {
  const finalElement = apiResponse?.FinalElement || {};
  const hasContract =
    finalElement.ContractDetails && finalElement.ContractDetails.length > 0;
  const hasLifeAssured =
    finalElement.LifeAssured?.ClientDetails &&
    finalElement.LifeAssured.ClientDetails.length > 0;

  if (!hasContract && !hasLifeAssured) {
    throw new Error(`Policy ${formattedPolicyNo} not found in Life Asia system`);
  }
  return finalElement;
};

module.exports = {
  getTransactionApiBase,
  formatPolicyNumber,
  buildPolicySearchUrl,
  fetchPolicySearch,
  assertPolicySearchHasData,
};
