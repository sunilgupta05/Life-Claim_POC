import wrapper from "../util/ApiWrapper";


const registerPolicyService = async (policyData) => { 
    console.log(policyData)
    const response = await wrapper.fetchWithToken("/register-claim/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(policyData)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = data?.detail || data?.message || response.statusText
      throw new Error(typeof detail === 'string' ? detail : 'Update failed')
    }
    return data;
  }

  export default registerPolicyService