-- =============================================================================
-- migration: 0010_form_field_config
-- description: Per-deployment field show/hide/require overrides (roadmap 2.3).
--
-- Layers on the 2.2 schema-driven forms: each form has a SUPERSET of fields
-- (defined in the frontend catalog); this table lets an admin, per install,
-- HIDE fields and flip REQUIRED — so each client configures its own form variant
-- without a code fork. Read by the frontend (applied to the schema before
-- render) and enforced by the validation engine.
--
-- IS_REQUIRED is NULLABLE: NULL = inherit the field's schema default; 1/0 = force
-- required/optional. Seeded EMPTY, so every form behaves exactly as its base
-- schema until an admin edits it (non-breaking).
--
-- Also registers the "Form Fields" admin screen as a superuser module (like
-- 0007/0009) so it appears in the nav + Access Control "Modules" tab.
-- =============================================================================

-- @UP  ------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS form_field_config (
  ID          INT           NOT NULL AUTO_INCREMENT,
  FORM_KEY    VARCHAR(64)   NOT NULL,
  FIELD_NAME  VARCHAR(64)   NOT NULL,
  IS_VISIBLE  TINYINT(1)    NOT NULL DEFAULT 1,
  IS_REQUIRED TINYINT(1)    DEFAULT NULL,          -- NULL = inherit schema default
  SORT_ORDER  INT           NOT NULL DEFAULT 0,
  CREATED_AT  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT  DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ID),
  UNIQUE KEY uq_form_field (FORM_KEY, FIELD_NAME),
  KEY idx_form_field_form (FORM_KEY)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Register the "Form Fields" superuser admin screen (roadmap 2.3).
INSERT INTO rbac_module (MODULE_KEY, LABEL, PATH, IS_ENABLED, ALLOWED_ROLES, IS_SYSTEM, SORT_ORDER) VALUES
  ('form-fields', 'Form Fields', '/superuser/forms', 1, CAST('["superuser"]' AS JSON), 1, 120)
ON DUPLICATE KEY UPDATE MODULE_KEY = MODULE_KEY;

UPDATE org_profile
   SET ENABLED_MODULES = JSON_ARRAY_APPEND(
         COALESCE(ENABLED_MODULES, CAST('[]' AS JSON)), '$', 'form-fields')
 WHERE IS_ACTIVE = 1
   AND (ENABLED_MODULES IS NULL
        OR JSON_CONTAINS(ENABLED_MODULES, CAST('"form-fields"' AS JSON)) = 0);

-- @DOWN  ----------------------------------------------------------------------

DROP TABLE IF EXISTS form_field_config;

DELETE FROM rbac_module WHERE MODULE_KEY = 'form-fields';

UPDATE org_profile
   SET ENABLED_MODULES = JSON_REMOVE(
         ENABLED_MODULES,
         JSON_UNQUOTE(JSON_SEARCH(ENABLED_MODULES, 'one', 'form-fields')))
 WHERE IS_ACTIVE = 1
   AND ENABLED_MODULES IS NOT NULL
   AND JSON_SEARCH(ENABLED_MODULES, 'one', 'form-fields') IS NOT NULL;
