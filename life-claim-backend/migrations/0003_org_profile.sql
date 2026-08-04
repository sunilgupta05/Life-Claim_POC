-- =============================================================================
-- migration: 0003_org_profile
-- description: Active-organization profile (roadmap 0.2). A single settings row
--              describing THIS deployment's org — name, code, logo, locale,
--              enabled modules, branding & contact — loaded by the backend at
--              startup and served to the frontend, replacing the hardcoded
--              frontend companyBrand.js.
--
-- Delivery model: one org per install (no multi-tenancy), so this is a single
-- authoritative row, not a tenant table. The seed row below reproduces the
-- current Dark Horse Digital branding EXACTLY, so behaviour is unchanged until
-- an operator edits the row.
--
-- enabled_modules is stored now but not yet enforced anywhere (module gating is
-- roadmap 1.3); serving it is forward-looking and does not affect current flow.
--
-- MySQL note: JSON columns + the guarded single-row seed are MySQL-specific;
-- an Oracle target would use CLOB + a MERGE/BEGIN..EXCEPTION guard instead.
-- =============================================================================

-- @UP  ------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS org_profile (
  ID              INT           NOT NULL AUTO_INCREMENT,
  ORG_NAME        VARCHAR(200)  NOT NULL,
  ORG_CODE        VARCHAR(50)   NOT NULL,
  PRODUCT_NAME    VARCHAR(200)  DEFAULT NULL,
  TAGLINE         VARCHAR(255)  DEFAULT NULL,
  SUPPORT_EMAIL   VARCHAR(200)  DEFAULT NULL,
  SUPPORT_PHONE   VARCHAR(50)   DEFAULT NULL,
  WEBSITE         VARCHAR(200)  DEFAULT NULL,
  LOGO_PATH       VARCHAR(500)  DEFAULT NULL,
  LOCALE          VARCHAR(20)   DEFAULT 'en-IN',
  ENABLED_MODULES JSON          DEFAULT NULL,
  BRAND_COLORS    JSON          DEFAULT NULL,
  IS_ACTIVE       TINYINT(1)    NOT NULL DEFAULT 1,
  CREATED_AT      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ID),
  UNIQUE KEY uq_org_profile_code (ORG_CODE)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed the single active row (idempotent: only inserts if the table is empty).
INSERT INTO org_profile
  (ORG_NAME, ORG_CODE, PRODUCT_NAME, TAGLINE, SUPPORT_EMAIL, SUPPORT_PHONE,
   WEBSITE, LOGO_PATH, LOCALE, ENABLED_MODULES, BRAND_COLORS, IS_ACTIVE)
SELECT
  'Dark Horse Digital',
  'DHDIGITAL',
  'Life Claims Platform',
  'Driving Digital Transformation',
  'claimssupport@dhdigital.co.in',
  '+91 98923 94104',
  'www.dhdigital.co.in',
  '/company-logo.png',
  'en-IN',
  CAST('["dashboard","superuser-overview","superuser-claims","policy","claims","pool","tasks","add","audit-log"]' AS JSON),
  CAST('{"primary":"#1D4ED8","accent":"#8B1A2B","text":"#0F172A","muted":"#64748B","border":"#E2E8F0","headerBg":"#F8FAFC"}' AS JSON),
  1
WHERE NOT EXISTS (SELECT 1 FROM org_profile);

-- @DOWN  ----------------------------------------------------------------------

DROP TABLE IF EXISTS org_profile;
