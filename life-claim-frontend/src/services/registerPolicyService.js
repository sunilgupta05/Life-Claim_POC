import wrapper from "../util/ApiWrapper";


const registerPolicyService = async (policyData) => { 
  console.log('registerPolicyService.js >> policyData', policyData)
    
    const response = await wrapper.fetchWithToken("/register-claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(policyData)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = data?.error || data?.message || response.statusText
      throw new Error(
        typeof detail === 'string' ? detail : `Registration failed (${response.status})`
      )
    }
    return data;
  }

  const getPolicyService = async (policyData) => { 
    
    const response = await wrapper.fetchWithToken("/register-claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(policyData)
    });
    const data = await response.json().catch(() => null);
    console.log(data)
    return data;
  }

  export default registerPolicyService