const logger = require('../util/logger');
const { getPortfolioFromDB } = require("../dataAccess/portfolioDao");

const getPortfolio = async (req, res) => {
  try {
    const { productCode, productName, sumAssured } = req.body;

    if (!productCode || !productName || !sumAssured) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const portfolio = await getPortfolioFromDB(productCode, productName, sumAssured);
    
    res.json({ portfolio });
  } catch (error) {
    logger.error("Error:", error.message);
    res.status(500).json({ error: "An error occurred while fetching portfolio" });
  }
};

module.exports = { getPortfolio };
