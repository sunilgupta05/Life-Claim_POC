import wrapper from "../util/ApiWrapper";

export const DataSearch = async (role) => {
  try {
    const response = await wrapper.fetchWithToken("/pool-selection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });

    const data = await response.json().catch(() => null);

    if (response.ok) {
      return Array.isArray(data) ? data : data?.claims || data?.data || []
    }
    throw new Error(data?.message || 'Pool search failed')
  } catch (error) {
    console.error("Error during search:", error);
    return null;
  }
};

export const updateAssignedUser = async (claimNumber, LoggedUser, role, checkboxValue) => {
  try {
    const response = await wrapper.fetchWithToken(`/pool-selection/${claimNumber}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ checkboxValue, LoggedUser, role }),
    });

    console.log(`/api/pool-selection/${claimNumber}`);
    console.log(JSON.stringify({ checkboxValue, LoggedUser }));

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      if (response.ok) {
        return data
      }
      throw new Error(data?.message || 'Assign failed')
    }
    throw new Error('Invalid server response')
  } catch (error) {
    if (error?.message) throw error
    throw new Error('Could not assign claim')
  }
}