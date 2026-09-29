const logger = require('../util/logger');
const { getAllCauseEventsFromDB } = require('../dataAccess/causeEventsDao');


const getAllCauseEvents = async (req, res) => {
  try {
    const causes = await getAllCauseEventsFromDB();
    res.json(causes); // Send the result back to the client
  } catch (error) {
    logger.info("Error: ", error.message);
    res.status(500).json({ error: 'An error occurred while fetching cause events' });
  }
};

module.exports = { getAllCauseEvents };
