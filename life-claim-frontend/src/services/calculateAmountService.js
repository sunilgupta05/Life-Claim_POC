import wrapper from "../util/ApiWrapper";

const calculateAmountService = async (obj) => { 
    console.log(obj)
    const response = await wrapper.fetchWithToken("/calculate-amount", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({obj:obj})
    });
    const data = await response.json().catch(() => null);
    console.log(data)
    return data;
  }

export default calculateAmountService;