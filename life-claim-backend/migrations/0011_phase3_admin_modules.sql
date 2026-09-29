-- =============================================================================
-- migration: 0011_phase3_admin_modules
-- description: Register the Phase 3 superuser admin screens as modules (like
--              0007/0009/0010) so they appear in the nav + Access Control
--              "Modules" tab and are toggleable per deployment:
--                - integration-health  (roadmap 3.2) — live integration dashboard
--                - it-admin            (roadmap 3.5) — runtime System Settings
--
-- Data-only: no new tables. Both screens read existing endpoints
-- (/api/health/integrations, /api/settings) that are gated on admin.config.manage
-- (superuser today). Seeding is idempotent and non-breaking — the frontend
-- registry already enables these by default, so this only makes them visible in
-- the Access Control console and part of ENABLED_MODULES.
-- =============================================================================

-- @UP  ------------------------------------------------------------------------

INSERT INTO rbac_module (MODULE_KEY, LABEL, PATH, IS_ENABLED, ALLOWED_ROLES, IS_SYSTEM, SORT_ORDER) VALUES
  ('integration-health', 'Integration Health', '/superuser/health',   1, CAST('["superuser"]' AS JSON), 1, 130),
  ('it-admin',           'System Settings',     '/superuser/settings', 1, CAST('["superuser"]' AS JSON), 1, 140)
ON DUPLICATE KEY UPDATE MODULE_KEY = MODULE_KEY;

UPDATE org_profile
   SET ENABLED_MODULES = JSON_ARRAY_APPEND(
         COALESCE(ENABLED_MODULES, CAST('[]' AS JSON)), '$', 'integration-health')
 WHERE IS_ACTIVE = 1
   AND (ENABLED_MODULES IS NULL
        OR JSON_CONTAINS(ENABLED_MODULES, CAST('"integration-health"' AS JSON)) = 0);

UPDATE org_profile
   SET ENABLED_MODULES = JSON_ARRAY_APPEND(
         COALESCE(ENABLED_MODULES, CAST('[]' AS JSON)), '$', 'it-admin')
 WHERE IS_ACTIVE = 1
   AND (ENABLED_MODULES IS NULL
        OR JSON_CONTAINS(ENABLED_MODULES, CAST('"it-admin"' AS JSON)) = 0);

-- @DOWN  ----------------------------------------------------------------------

DELETE FROM rbac_module WHERE MODULE_KEY IN ('integration-health', 'it-admin');

UPDATE org_profile
   SET ENABLED_MODULES = JSON_REMOVE(
         ENABLED_MODULES,
         JSON_UNQUOTE(JSON_SEARCH(ENABLED_MODULES, 'one', 'integration-health')))
 WHERE IS_ACTIVE = 1
   AND ENABLED_MODULES IS NOT NULL
   AND JSON_SEARCH(ENABLED_MODULES, 'one', 'integration-health') IS NOT NULL;

UPDATE org_profile
   SET ENABLED_MODULES = JSON_REMOVE(
         ENABLED_MODULES,
         JSON_UNQUOTE(JSON_SEARCH(ENABLED_MODULES, 'one', 'it-admin')))
 WHERE IS_ACTIVE = 1
   AND ENABLED_MODULES IS NOT NULL
   AND JSON_SEARCH(ENABLED_MODULES, 'one', 'it-admin') IS NOT NULL;
