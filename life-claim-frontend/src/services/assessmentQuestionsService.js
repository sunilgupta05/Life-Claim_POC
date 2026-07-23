import wrapper from "../util/ApiWrapper";

const assessmentQuestionsService = async (data) => { 
    // console.log(data)
    const response = await wrapper.fetchWithToken("/assessment-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data:data
      })
    });

    const result = await response.json().catch(() => null);
    // console.log(result)
    return result;
  }
  export default assessmentQuestionsService