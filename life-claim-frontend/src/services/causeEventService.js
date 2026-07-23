import wrapper from "../util/ApiWrapper";
import { normalizeCauseEventList } from "../util/normalizeCauseEvent";

const causeEventService = {
    causeEvent : async () => {
        const response = await wrapper.fetchWithToken("/cause-event", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const payload = await response.json().catch(() => null);
        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
        return normalizeCauseEventList(rows);
      },
}

export default causeEventService;