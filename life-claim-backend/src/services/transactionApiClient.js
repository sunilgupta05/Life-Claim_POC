const axios = require('axios');

/**
 * Transaction API (Life Asia) base URL.
 * Prefer TXN_API_BASE_URL, e.g. http://localhost:3003
 */
const getTransactionApiBase = () =>
  (
    process.env.TXN_API_BASE_URL ||
    `http://${process.env.TXN_HOST || process.env.DB_HOST || 'localhost'}:${process.env.TXN_PORT || '3003'}`
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
  const response = await axios.get(url);
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
