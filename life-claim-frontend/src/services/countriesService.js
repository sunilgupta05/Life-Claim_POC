import wrapper from "../util/ApiWrapper";

const countriesService = {
    getAllCountries : async () => {
        try {
          const response = await wrapper.fetchWithToken("/countries", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          const payload = await response.json().catch(() => null);
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload?.data)) return payload.data;
          return [];
        } catch (error) {
          console.error("Error fetching countries:", error);
          return [];
        }
      },
}

export default countriesService;