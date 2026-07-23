const dashboardActivityService = require('../services/dashboardActivityService');

const getDashboardActivities = async (req, res) => {
  try {
    console.log('Controller >> Fetching dashboard activities for user:', req.user?.username);
    const activities = await dashboardActivityService.getRecentActivitiesService();
    console.log('Controller >> Fetched activities count:', activities.length);
    res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching dashboard activities:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getDashboardActivities
};
