const { getSystemRequirementFromDB } = require("../dataAccess/systemRequirementDao");

const getSystemRequirement = async (req, res) => {
  try {
    const { portfolioType,typeOfClaim,policyStatus, sumAssured } = req.body;

    if (!portfolioType || !typeOfClaim || !policyStatus || !sumAssured) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const requirement = await getSystemRequirementFromDB(portfolioType,typeOfClaim,policyStatus, sumAssured);
    
    res.json({ requirement });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "An error occurred while fetching portfolio" });
  }
};

module.exports = { getSystemRequirement };
