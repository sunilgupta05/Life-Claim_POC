import wrapper from "../util/ApiWrapper";

const caseReasonsService = {
    getAllCaseReasons : async () => {
        try {
          const response = await wrapper.fetchWithToken("/case-reasons/", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          const payload = await response.json().catch(() => null);
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload?.data)) return payload.data;
          return [];
        } catch (error) {
          console.error("Error fetching case reasons:", error);
          return [];
        }
      },
      getCaseAccessorRemarks : async (claimId) => {
        try {
          const response = await wrapper.fetchWithToken("/case-reasons/system-assessor-remarks/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              claimId: claimId,
            }),
          });
          const data = await response.json().catch(() => null);
          return data;
        } catch (error) {
          console.error("Error fetching assessor remarks:", error);
          return null;
        }
      },
}


export default caseReasonsService;