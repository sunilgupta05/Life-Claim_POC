-- =============================================================================
-- migration: 0004_app_config
-- description: Centralized config store (roadmap 0.3). A key/value table holding
--              runtime-editable BUSINESS settings, read through the backend
--              config service (src/config/configService.js).
--
-- Resolution order in the service: app_config (DB) -> process.env (.env) ->
-- code default. Secrets are NOT stored here — they stay in .env (IS_SECRET
-- exists only to flag/mask any that ever are, and to keep them out of the admin
-- listing).
--
-- Intentionally seeded with NOTHING: an empty table means every lookup falls
-- back to .env exactly as today, so applying this migration changes no
-- behaviour. Settings are added later via the admin API (PUT /api/config/:key)
-- or the IT Admin console (roadmap 3.5).
--
-- MySQL note: ON DUPLICATE KEY UPSERT is done in the DAO; this file is plain DDL
-- and ports cleanly to other engines.
-- =============================================================================

-- @UP  ------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app_config (
  CONFIG_KEY    VARCHAR(191)  NOT NULL,
  CONFIG_VALUE  TEXT          DEFAULT NULL,
  VALUE_TYPE    VARCHAR(20)   NOT NULL DEFAULT 'string',   -- string|number|boolean|json
  CATEGORY      VARCHAR(64)   DEFAULT NULL,
  DESCRIPTION   VARCHAR(255)  DEFAULT NULL,
  IS_SECRET     TINYINT(1)    NOT NULL DEFAULT 0,
  UPDATED_BY    VARCHAR(100)  DEFAULT NULL,
  CREATED_AT    DATETIME      DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT    DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (CONFIG_KEY),
  KEY idx_app_config_category (CATEGORY)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- @DOWN  ----------------------------------------------------------------------

DROP TABLE IF EXISTS app_config;
