-- =============================================================================
-- migration: 0002_user_login_audit_logout_reason
-- description: Add LOGOUT_REASON to user_login_audit — records how a session
--              ended (e.g. idle, user, concurrent_session).
--
-- Origin: this is the former hand-run script
--         scripts/add-user-login-audit-logout-reason.sql, which had NOT been
--         applied to the claims_poc database (the column is absent from the
--         0001 baseline). It is captured here as the first tracked change so it
--         rolls out consistently across DEV/UAT/PROD.
--
-- MySQL note: MySQL 8 has no "ADD COLUMN IF NOT EXISTS", so the ALTER is guarded
-- via information_schema + a prepared statement (the same idempotency pattern
-- already used in scripts/run-acuity-setup.sql). This block is MySQL-specific;
-- an Oracle target would guard with a PL/SQL EXISTS check instead.
-- =============================================================================

-- @UP  ------------------------------------------------------------------------

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'user_login_audit'
    AND COLUMN_NAME  = 'LOGOUT_REASON'
);
SET @ddl = IF(@col_exists = 0,
  'ALTER TABLE user_login_audit
     ADD COLUMN LOGOUT_REASON VARCHAR(128) NULL DEFAULT NULL
     COMMENT ''e.g. idle, user, concurrent_session''
     AFTER LOGOUT_AT',
  'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- @DOWN  ----------------------------------------------------------------------

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'user_login_audit'
    AND COLUMN_NAME  = 'LOGOUT_REASON'
);
SET @ddl = IF(@col_exists = 1,
  'ALTER TABLE user_login_audit DROP COLUMN LOGOUT_REASON',
  'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
