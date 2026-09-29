// src/config/logConfig.js
//
// Backwards-compatible shim (roadmap 3.4). This module used to create its own
// winston logger writing to a single, UNBOUNDED logs/application.log. It now
// re-exports the centralized logger (src/util/logger.js), so every existing
// `require('../config/logConfig')` consumer automatically gains:
//   - configurable levels (incl. fatal) via LOG_LEVEL,
//   - size/time log ROTATION with retention (no more unbounded application.log),
//   - correlation ids on every line, and
//   - optional centralized shipping.
//
// The public API (.info/.warn/.error/.debug, plus .fatal/.trace) is unchanged.
module.exports = require('../util/logger');
