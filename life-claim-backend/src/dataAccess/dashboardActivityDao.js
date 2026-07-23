const db = require('../config/dbConfig');

const getRecentActivities = async () => {
  try {
    // Fetch activities from the last 24 hours
    // Joining with users table to get the role of the person who performed the action
    const query = `
      SELECT 
        sh.CLAIM_NUMBER as claimId,
        sh.MODIFIED_BY as user,
        sh.STATUS as status,
        sh.DECISION as decision,
        sh.MODIFIED_ON as time,
        u.roles as roles
      FROM STATUS_HISTORY sh
      LEFT JOIN users u ON sh.MODIFIED_BY = u.username
      WHERE sh.MODIFIED_ON >= NOW() - INTERVAL 24 HOUR
      ORDER BY sh.MODIFIED_ON DESC
      LIMIT 100
    `;
    
    const [rows] = await db.execute(query);
    return rows;
  } catch (error) {
    console.error('Error fetching dashboard activities from DB:', error);
    throw error;
  }
};

module.exports = {
  getRecentActivities
};
