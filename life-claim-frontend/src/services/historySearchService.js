import wrapper from "../util/ApiWrapper";

export const historySearch = async (policyNumber,claimNumber) => {
    try {
        const response = await wrapper.fetchWithToken("/history-search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ policyNumber,claimNumber }),
        });

        const data = await response.json().catch(() => null);
        return data;
    } catch (error) {
        console.error('Error during search:', error);
        return null;
    }
};
