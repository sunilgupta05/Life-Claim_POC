-- Run once on claims_poc. Stores how the session ended (e.g. idle, user).
ALTER TABLE claims_poc.user_login_audit
  ADD COLUMN LOGOUT_REASON VARCHAR(128) NULL DEFAULT NULL
  COMMENT 'e.g. idle, user, concurrent_session'
  AFTER LOGOUT_AT;
