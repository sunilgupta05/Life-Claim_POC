const db = require("../config/dbConfig");

// Function to fetch Portfolio Type based on ProductCode, ProductName, and SumAssured
const getPortfolioFromDB = async (productCode, productName, sumAssured) => {
  try {
    const query = `
      SELECT PORTFOLIO_TYPE 
      FROM caps_portfolio_master
      WHERE PRODUCT_CODE = ? 
      AND PRODUCT_NAME = ? 
      AND ? > PRODUCT_SUM_ASSURED 
      LIMIT 1
    `;

    const [rows] = await db.query(query, [productCode, productName, sumAssured]);
    console.log([rows])
    return rows.length > 0 ? rows[0].PORTFOLIO_TYPE : null;
  } catch (error) {
    throw new Error("Database error: " + error.message);
  }
};

// Export function
module.exports = { getPortfolioFromDB };
