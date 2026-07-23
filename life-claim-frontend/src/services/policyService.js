import wrapper from "../util/ApiWrapper";
import { normalizePolicyResponse } from "../util/normalizePolicyResponse";

const policyService = {
    getPolicyDetails : async (policyID) => {
        const response = await wrapper.fetchWithToken(`/policy/details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ policyID: String(policyID || '').trim() }),
        });
    
        const data = await response.json();
        return normalizePolicyResponse(data, policyID);
      },
      getAgentRepudiationDetails : async (agentCode) => {
        console.log(agentCode)
        const response = await wrapper.fetchWithToken(`/agentRepudiation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({agentCode})
        });
    
        const data = await response.json();
        return data;
      },
}

export default policyService;

export const fetchPolicyDetails = (policyID) => policyService.getPolicyDetails(policyID)
export const fetchAgentRepudiation = (agentCode) => policyService.getAgentRepudiationDetails(agentCode)
