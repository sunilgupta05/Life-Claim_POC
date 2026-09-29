-- =============================================================================
-- migration: 0009_rbac_branding_module
-- description: Register the Branding admin screen (roadmap 2.1) as a superuser
--              module in rbac_module (1.5), and add it to the org profile's
--              enabled-modules list — so it shows in the nav + the Access Control
--              "Modules" tab, consistent with the other admin screens.
--
-- Additive + idempotent; matches the seed shape of 0007. Frontend module
-- registry also lists `branding` as a default, so this keeps the DB in sync.
-- =============================================================================

-- @UP  ------------------------------------------------------------------------

INSERT INTO rbac_module (MODULE_KEY, LABEL, PATH, IS_ENABLED, ALLOWED_ROLES, IS_SYSTEM, SORT_ORDER) VALUES
  ('branding', 'Branding', '/superuser/branding', 1, CAST('["superuser"]' AS JSON), 1, 110)
ON DUPLICATE KEY UPDATE MODULE_KEY = MODULE_KEY;

UPDATE org_profile
   SET ENABLED_MODULES = JSON_ARRAY_APPEND(
         COALESCE(ENABLED_MODULES, CAST('[]' AS JSON)), '$', 'branding')
 WHERE IS_ACTIVE = 1
   AND (ENABLED_MODULES IS NULL
        OR JSON_CONTAINS(ENABLED_MODULES, CAST('"branding"' AS JSON)) = 0);

-- @DOWN  ----------------------------------------------------------------------

DELETE FROM rbac_module WHERE MODULE_KEY = 'branding';

UPDATE org_profile
   SET ENABLED_MODULES = JSON_REMOVE(
         ENABLED_MODULES,
         JSON_UNQUOTE(JSON_SEARCH(ENABLED_MODULES, 'one', 'branding')))
 WHERE IS_ACTIVE = 1
   AND ENABLED_MODULES IS NOT NULL
   AND JSON_SEARCH(ENABLED_MODULES, 'one', 'branding') IS NOT NULL;
