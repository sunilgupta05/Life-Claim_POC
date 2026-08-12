-- =============================================================================
-- migration: 0005_rbac_dynamic
-- description: Dynamic RBAC data layer (roadmap 1.1). Real role / permission /
--              role-permission tables, each with an enable/disable flag, so
--              roles and the permissions assigned to them become DATA that is
--              configured per client at runtime instead of hardcoded strings.
--
-- This REPLACES (functionally) the decorative `roles` table (0001 baseline),
-- which has no primary key and is never consulted for enforcement. The legacy
-- `roles` table and its `/api/role` endpoints are intentionally LEFT IN PLACE
-- here so nothing that reads them today breaks; the new authoritative model is
-- the three `rbac_*` tables below, read through src/services/rbacService.js.
--
-- FOUNDATION ONLY: applying this migration does not change any access decision.
-- The existing authorize()/protect() route guards are untouched; the new tables
-- feed a new opt-in requirePermission() middleware and the /api/rbac admin API.
-- Wiring routes to permissions is a later roadmap item.
--
-- The seed reproduces today's reality (the superuser + operational triad roles
-- and a starter permission catalog grouped by the app's modules), so an admin
-- has a sensible starting matrix to edit. Seeds are idempotent — re-running, or
-- running against a DB that already has the rows, is a no-op.
--
-- MySQL note: the `ON DUPLICATE KEY UPDATE col = col` no-op-upsert idiom used for
-- idempotent seeding, and the CROSS/INNER JOIN seed selects, are MySQL-specific;
-- an Oracle target would use MERGE instead.
-- =============================================================================

-- @UP  ------------------------------------------------------------------------

-- Roles: a named role that can be assigned permissions. ROLE_KEY is the stable,
-- normalized slug matched against JWT realm roles (e.g. "Pre Assessor" -> the
-- key "pre-assessor"); ROLE_NAME is the human label. IS_SYSTEM marks built-ins
-- that the admin API refuses to delete.
CREATE TABLE IF NOT EXISTS rbac_role (
  ID          INT           NOT NULL AUTO_INCREMENT,
  ROLE_KEY    VARCHAR(64)   NOT NULL,
  ROLE_NAME   VARCHAR(100)  NOT NULL,
  DESCRIPTION VARCHAR(255)  DEFAULT NULL,
  IS_SYSTEM   TINYINT(1)    NOT NULL DEFAULT 0,
  IS_ENABLED  TINYINT(1)    NOT NULL DEFAULT 1,
  SORT_ORDER  INT           NOT NULL DEFAULT 0,
  CREATED_AT  DATETIME      DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT  DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ID),
  UNIQUE KEY uq_rbac_role_key (ROLE_KEY)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Permissions: a single grantable capability. PERMISSION_KEY is the stable code
-- (e.g. "claims.view"); MODULE groups them for the admin UI.
CREATE TABLE IF NOT EXISTS rbac_permission (
  ID              INT           NOT NULL AUTO_INCREMENT,
  PERMISSION_KEY  VARCHAR(100)  NOT NULL,
  PERMISSION_NAME VARCHAR(150)  NOT NULL,
  MODULE          VARCHAR(64)   DEFAULT NULL,
  DESCRIPTION     VARCHAR(255)  DEFAULT NULL,
  IS_ENABLED      TINYINT(1)    NOT NULL DEFAULT 1,
  CREATED_AT      DATETIME      DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT      DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ID),
  UNIQUE KEY uq_rbac_permission_key (PERMISSION_KEY),
  KEY idx_rbac_permission_module (MODULE)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Mapping: which permissions a role has. Its own IS_ENABLED lets an admin
-- suspend a single grant without deleting it. A permission is EFFECTIVE only
-- when the role, the permission, AND the mapping row are all enabled.
CREATE TABLE IF NOT EXISTS rbac_role_permission (
  ROLE_ID       INT          NOT NULL,
  PERMISSION_ID INT          NOT NULL,
  IS_ENABLED    TINYINT(1)   NOT NULL DEFAULT 1,
  CREATED_AT    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  UPDATED_AT    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (ROLE_ID, PERMISSION_ID),
  KEY idx_rrp_permission (PERMISSION_ID),
  CONSTRAINT fk_rrp_role       FOREIGN KEY (ROLE_ID)       REFERENCES rbac_role (ID)       ON DELETE CASCADE,
  CONSTRAINT fk_rrp_permission FOREIGN KEY (PERMISSION_ID) REFERENCES rbac_permission (ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---- seed: roles (idempotent via the ROLE_KEY unique key) --------------------
INSERT INTO rbac_role (ROLE_KEY, ROLE_NAME, DESCRIPTION, IS_SYSTEM, IS_ENABLED, SORT_ORDER) VALUES
  ('superuser',    'Superuser',     'Full platform administrator.',              1, 1, 10),
  ('pre-assessor', 'Pre Assessor',  'Registers and prepares incoming claims.',   1, 1, 20),
  ('assessor',     'Assessor',      'Assesses claims and records decisions.',    1, 1, 30),
  ('verifier',     'Verifier',      'Verifies and approves assessed claims.',    1, 1, 40)
ON DUPLICATE KEY UPDATE ROLE_KEY = ROLE_KEY;

-- ---- seed: permission catalog (idempotent via the PERMISSION_KEY unique key) -
INSERT INTO rbac_permission (PERMISSION_KEY, PERMISSION_NAME, MODULE, DESCRIPTION) VALUES
  ('dashboard.view',      'View dashboard',            'dashboard',    'Access the operational dashboard.'),
  ('registration.view',   'View registration',         'registration', 'Open the claim registration workspace.'),
  ('registration.create', 'Register claim',            'registration', 'Create/intimate a new claim.'),
  ('registration.edit',   'Edit registration',         'registration', 'Edit registration details of a claim.'),
  ('claims.view',         'View claims',               'claims',       'View claim records and details.'),
  ('claims.search',       'Search claims',             'claims',       'Search across claims and history.'),
  ('claims.edit',         'Edit claims',               'claims',       'Modify claim data.'),
  ('assessment.view',     'View assessment',           'assessment',   'View assessment / ADD-CAPS findings.'),
  ('assessment.act',      'Perform assessment',        'assessment',   'Record assessment findings and decisions.'),
  ('pool.view',           'View pool',                 'pool',         'View the case pool.'),
  ('pool.assign',         'Assign from pool',          'pool',         'Pick up / assign cases from the pool.'),
  ('decision.view',       'View decisions',            'decision',     'View system and assessor decisions.'),
  ('decision.act',        'Record decision',           'decision',     'Record or approve a claim decision.'),
  ('documents.view',      'View documents',            'documents',    'View / preview uploaded documents.'),
  ('documents.upload',    'Upload documents',          'documents',    'Upload documents to the DMS.'),
  ('policy.view',         'View policy',               'policy',       'Search and view policy details.'),
  ('fraud.view',          'View fraud prevention',     'fraud',        'View fraud-prevention indicators.'),
  ('audit.view',          'View audit log',            'audit',        'View the audit / activity log.'),
  ('admin.users.manage',  'Manage users',              'admin',        'Create, edit and remove users.'),
  ('admin.config.manage', 'Manage configuration',      'admin',        'Edit runtime application settings.'),
  ('admin.rbac.manage',   'Manage roles & permissions','admin',        'Administer the dynamic RBAC model.')
ON DUPLICATE KEY UPDATE PERMISSION_KEY = PERMISSION_KEY;

-- ---- seed: role -> permission mappings (idempotent via the composite PK) -----

-- Superuser gets every permission. (The service also treats superuser as an
-- implicit all-access role, but seeding the rows keeps the admin matrix honest.)
INSERT INTO rbac_role_permission (ROLE_ID, PERMISSION_ID, IS_ENABLED)
SELECT r.ID, p.ID, 1
  FROM rbac_role r
  CROSS JOIN rbac_permission p
 WHERE r.ROLE_KEY = 'superuser'
ON DUPLICATE KEY UPDATE ROLE_ID = ROLE_ID;

-- Pre Assessor: registration + read-oriented claim work.
INSERT INTO rbac_role_permission (ROLE_ID, PERMISSION_ID, IS_ENABLED)
SELECT r.ID, p.ID, 1
  FROM rbac_role r
  JOIN rbac_permission p
    ON p.PERMISSION_KEY IN (
      'dashboard.view','registration.view','registration.create','registration.edit',
      'claims.view','claims.search','documents.view','documents.upload','policy.view')
 WHERE r.ROLE_KEY = 'pre-assessor'
ON DUPLICATE KEY UPDATE ROLE_ID = ROLE_ID;

-- Assessor: full assessment + decisioning across the pool.
INSERT INTO rbac_role_permission (ROLE_ID, PERMISSION_ID, IS_ENABLED)
SELECT r.ID, p.ID, 1
  FROM rbac_role r
  JOIN rbac_permission p
    ON p.PERMISSION_KEY IN (
      'dashboard.view','claims.view','claims.search','claims.edit',
      'assessment.view','assessment.act','pool.view','pool.assign',
      'decision.view','decision.act','documents.view','documents.upload',
      'policy.view','fraud.view')
 WHERE r.ROLE_KEY = 'assessor'
ON DUPLICATE KEY UPDATE ROLE_ID = ROLE_ID;

-- Verifier: verification + approval of assessed cases.
INSERT INTO rbac_role_permission (ROLE_ID, PERMISSION_ID, IS_ENABLED)
SELECT r.ID, p.ID, 1
  FROM rbac_role r
  JOIN rbac_permission p
    ON p.PERMISSION_KEY IN (
      'dashboard.view','claims.view','claims.search',
      'assessment.view','pool.view','pool.assign',
      'decision.view','decision.act','documents.view','policy.view','fraud.view')
 WHERE r.ROLE_KEY = 'verifier'
ON DUPLICATE KEY UPDATE ROLE_ID = ROLE_ID;

-- @DOWN  ----------------------------------------------------------------------

DROP TABLE IF EXISTS rbac_role_permission;
DROP TABLE IF EXISTS rbac_permission;
DROP TABLE IF EXISTS rbac_role;
