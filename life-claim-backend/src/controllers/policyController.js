const {
  getTransactionApiBase,
  fetchPolicySearch,
} = require('../services/transactionApiClient');
const { mapLifeAsiaPolicyResponse } = require('../services/policyMapper');

const getPolicyDetails = async (req, res, next) => {
  try {
    const policyID = req.params.policyID;
    const { data, formattedPolicyNo } = await fetchPolicySearch(policyID);
    res.json(mapLifeAsiaPolicyResponse(data, formattedPolicyNo));
  } catch (error) {
    next(error);
  }
};

const getPolicyDetailsFromBody = async (req, res, next) => {
  try {
    const policyID = req.body.policyID || req.body.policyId || req.body.policyNumber;
    const { data, formattedPolicyNo } = await fetchPolicySearch(policyID);
    res.json(mapLifeAsiaPolicyResponse(data, formattedPolicyNo));
  } catch (error) {
    next(error);
  }
};

const getAgentRepudiationDetails = async (req, res) => {
  const { agentCode } = req.body;
  const url = `${getTransactionApiBase()}/api/agentRepudiation/${agentCode}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while fetching the details.' });
  }
};

module.exports = {
  getPolicyDetails,
  getPolicyDetailsFromBody,
  getAgentRepudiationDetails,
};
