import wrapper from "../util/ApiWrapper";

export const claimSearch = {
  claimSearchNumber: async (claimNumber) => {
    try {
      const response = await wrapper.fetchWithToken("/claim-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claimNumber }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        return data;
      } else {
        console.error("claim no search error:", data?.message);
        return null;
      }
    } catch (error) {
      console.error("Error during search:", error);
      return null;
    }
  },

  updateAssessor: async (assessor, claimNumber, username) => {
    try {
      const response = await wrapper.fetchWithToken("/claim-search/update-ass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assessor, claimNumber, username }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        return data;
      }
      const msg = data?.message || data?.detail || response.statusText
      throw new Error(msg || 'Assessor update failed')
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Assessor update failed')
    }
  },

  updateVerifier: async (verifier, claimNumber, username) => {
    try {
      const response = await wrapper.fetchWithToken("/claim-search/update-ver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ verifier, claimNumber, username }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        return data;
      }
      const msg = data?.message || data?.detail || response.statusText
      throw new Error(msg || 'Verifier update failed')
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Verifier update failed')
    }
  },
};