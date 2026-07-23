const express = require('express');
const { getHistorySearch } = require('../controllers/historySearchController');
const { protect } = require('../middleware/keycloak');
const { authorizeHistorySearchAccess } = require('../middleware/claimAccessMiddleware');

const router = express.Router();

router.post('/', protect(), authorizeHistorySearchAccess, getHistorySearch);

module.exports = router;