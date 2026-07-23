import wrapper from "../util/ApiWrapper";
//this file has many apis for states,requirement and portfolio

const statesService = {
  getAllStates: async () => {
    try {
      const response = await wrapper.fetchWithToken("/states", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const payload = await response.json().catch(() => null);
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    } catch (error) {
      console.error("Error fetching states:", error);
      return [];
    }
  },
}

export const requirementMasterService = async () => {
  try {
    const response = await wrapper.fetchWithToken("/states/requirements", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json().catch(() => null);
    return data;
  } catch (error) {
    console.error("Error fetching requirements master:", error);
    return [];
  }
}

//portfolio in intimation 
export const getPortfolioService = async (productCode, productName, sumAssured) => {
  try {
    const response = await wrapper.fetchWithToken("/states/portfolio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productCode,
        productName,
        sumAssured,
      }),
    });

    const data = await response.json().catch(() => null);
    return data.portfolio; // Only returning portfolio type
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return null;
  }
};


//system requirement in requirements
export const getSystemRequirementService = async (portfolioType,typeOfClaim,policyStatus, sumAssured) => {
  try {
    console.log("services >> statesService.js >> getSystemRequirementService >> portfolioType : ", portfolioType);
    console.log("services >> statesService.js >> getSystemRequirementService >> typeOfClaim : ", typeOfClaim);
    console.log("services >> statesService.js >> getSystemRequirementService >> policyStatus : ", policyStatus);
    console.log("services >> statesService.js >> getSystemRequirementService >> sumAssured : ", sumAssured);
    const response = await wrapper.fetchWithToken("/states/system-requirement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        portfolioType,typeOfClaim,policyStatus, sumAssured
      }),
    });
    const data = await response.json().catch(() => null);
    return data; 
  } catch (error) {
    console.error("Error fetching system requirement:", error);
    return null;
  }
};
export default statesService;