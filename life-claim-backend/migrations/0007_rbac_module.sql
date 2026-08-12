-- =============================================================================
-- migration: 0007_rbac_module
-- description: Per-module access config (roadmap 1.5) — makes "which modules a
--              role can see" editable data instead of a hardcoded frontend
--              registry. Backs the Access Control admin console.
--
-- The frontend module registry (1.3) overlays these rows on top of its built-in
-- defaults: a module row's IS_ENABLED drives on/off and ALLOWED_ROLES drives
-- which roles see it in the nav + can reach its routes. The seed reproduces the
-- current 1.3 registry exactly (plus the new `access-control` console module),
-- so applying this changes NOTHING until an admin edits a row.
--
-- ALLOWED_ROLES semantics: NULL / [] = any authenticated operational user (the
-- registry's `roles: null`); a JSON array names the roles that may see it.
--
-- MySQL note: the guarded single-row-style seed + the JSON append to
-- org_profile.ENABLED_MODULES are MySQL-specific (as with 0003/0005).
-- =============================================================================

-- @UP  ------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rbac_module (
  ID            INT           NOT NULL AUTO_INCREMENT,
  MODULE_KEY    VARCHAR(64)   NOT NULL,
  LABEL         VARCHAR(100)  NOT NULL,
  PATH          VARCHAR(120)  DEFAULT NULL,
  IS_ENABLED    TINYINT(1)    NOT NULL DEFAULT 1,
  ALLOWED_ROLES JSON          DEFAULT NULL,
  IS_SYSTEM     TINYINT(1)    NOT NULL DEFAULT 0,
  SORT_ORDER    INT           NOT NULL DEFAULT 0,
  CREATED_AT    DATETIME      DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT    DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ID),
  UNIQUE KEY uq_rbac_module_key (MODULE_KEY)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed = current 1.3 registry + the new access-control console module.
-- (ALLOWED_ROLES NULL means "any operational user".) Idempotent via MODULE_KEY.
INSERT INTO rbac_module (MODULE_KEY, LABEL, PATH, IS_ENABLED, ALLOWED_ROLES, IS_SYSTEM, SORT_ORDER) VALUES
  ('dashboard',          'Dashboard',            '/dashboard',              1, NULL,                                 1, 10),
  ('superuser-overview', 'Super User Overview',  '/superuser',              1, CAST('["superuser"]' AS JSON),        1, 20),
  ('superuser-claims',   'Claim Assignment',     '/superuser/claim-search', 1, CAST('["superuser"]' AS JSON),        1, 30),
  ('policy',             'Policy Search',        '/policy-search',          1, CAST('["Pre Assessor"]' AS JSON),     1, 40),
  ('claims',             'Claim Search',         '/claim-search',           1, NULL,                                 1, 50),
  ('pool',               'Pool Selection',       '/pool-selection',         1, CAST('["Assessor","Verifier"]' AS JSON), 1, 60),
  ('tasks',              'My Tasks',             '/my-task',                1, CAST('["Assessor","Verifier"]' AS JSON), 1, 70),
  ('add',                'Advance Intelligence', '/add-screen',             1, CAST('["Assessor","Verifier"]' AS JSON), 1, 80),
  ('audit-log',          'Login Sessions',       '/audit-log',              1, CAST('["superuser"]' AS JSON),        1, 90),
  ('access-control',     'Access Control',       '/superuser/access',       1, CAST('["superuser"]' AS JSON),        1, 100)
ON DUPLICATE KEY UPDATE MODULE_KEY = MODULE_KEY;

-- Make sure the org profile's enabled-modules list includes the new console
-- module, so the org-profile fallback path (when this table is unread) still
-- shows it. Only touches the active row; a no-op if it's already present.
UPDATE org_profile
   SET ENABLED_MODULES = JSON_ARRAY_APPEND(
         COALESCE(ENABLED_MODULES, CAST('[]' AS JSON)), '$', 'access-control')
 WHERE IS_ACTIVE = 1
   AND (ENABLED_MODULES IS NULL
        OR JSON_CONTAINS(ENABLED_MODULES, CAST('"access-control"' AS JSON)) = 0);

-- @DOWN  ----------------------------------------------------------------------

DROP TABLE IF EXISTS rbac_module;

-- Best-effort: remove access-control from the org profile's enabled list.
UPDATE org_profile
   SET ENABLED_MODULES = JSON_REMOVE(
         ENABLED_MODULES,
         JSON_UNQUOTE(JSON_SEARCH(ENABLED_MODULES, 'one', 'access-control')))
 WHERE IS_ACTIVE = 1
   AND ENABLED_MODULES IS NOT NULL
   AND JSON_SEARCH(ENABLED_MODULES, 'one', 'access-control') IS NOT NULL;
