import wrapper from "../util/ApiWrapper";

const placeOfDeathService =async ()=>{
        try {
          const response = await wrapper.fetchWithToken("/states/place", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const payload = await response.json().catch(() => null);
          const rawList = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

          return rawList
            .map((item) => {
              if (typeof item === "string") {
                return { place: item };
              }
              const placeValue =
                item?.place ??
                item?.PLACE ??
                item?.place_of_death ??
                item?.PLACE_OF_DEATH ??
                item?.name ??
                item?.NAME ??
                "";
              return { ...item, place: placeValue };
            })
            .filter((item) => item.place);
        } catch (error) {
          console.error("Error fetching place of death:", error);
          return [];
        }
}

export default placeOfDeathService;