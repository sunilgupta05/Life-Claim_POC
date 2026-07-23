import wrapper from "../util/ApiWrapper";

const fetchAssessorData = async (segment, claimNo) => {
  try {
    const response = await wrapper.fetchWithToken(`/assessor-fetch/${segment}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ claimNo: String(claimNo || "").trim() }),
    });
    const data = await response.json().catch(() => null);
    return data;
  } catch (error) {
    console.error(`assessorFetchService error for ${segment}:`, error);
    return null;
  }
};

const assessorFetchService = {
  demogsFetch: async (claimNo) => fetchAssessorData("demogs", claimNo),
  requireFetch: async (claimNo) => fetchAssessorData("require", claimNo),
  assessmentFetch: async (claimNo) => fetchAssessorData("assess", claimNo),
  decisionFetch: async (claimNo) => fetchAssessorData("decision", claimNo),
  calculateAmountFetch: async (claimNo) => fetchAssessorData("calcAmt", claimNo),
};

export default assessorFetchService;
