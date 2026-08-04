-- =============================================================================
-- migration: __NAME__
-- description: TODO — one line on what this changes and why.
-- =============================================================================
--
-- Guidelines:
--   * Keep it idempotent where practical (CREATE TABLE IF NOT EXISTS, guarded
--     ALTERs). MySQL DDL is NOT transactional, so a failed migration cannot be
--     auto-rolled-back mid-way — re-running should be safe.
--   * Prefer neutral SQL (no backtick idents / no MySQL-only functions) so the
--     same file can run against a future Oracle target. If you must use
--     MySQL-specific SQL, note it here.
--   * Never edit a migration after it has been applied anywhere — add a new one.

-- @UP  ------------------------------------------------------------------------



-- @DOWN  ----------------------------------------------------------------------
-- The inverse of @UP. Leave empty only if truly irreversible (then `migrate:down`
-- will refuse to revert it).


