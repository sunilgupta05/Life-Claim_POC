-- =============================================================================
-- migration: 0006_rbac_verifier_permission
-- description: Add the one verifier-exclusive permission needed to enforce the
--              Verifier-only route (`POST /api/claim-search/update-ver`) through
--              the dynamic RBAC layer (roadmap 1.2).
--
-- The 0005 seed intentionally gave Verifier no permission that Assessor lacks
-- (every Verifier grant is also an Assessor grant), but the update-ver route is
-- Verifier-only. This adds `claims.verify` and grants it to the `verifier` role
-- ONLY, so replacing `protect('realm:Verifier')` with
-- `requirePermission('claims.verify')` preserves the exact allow/deny outcome.
--
-- Additive and idempotent: it inserts one permission and one mapping and does
-- not touch any existing role/permission/mapping row.
--
-- MySQL note: the `ON DUPLICATE KEY UPDATE col = col` no-op-upsert idiom and the
-- JOIN-based mapping seed are MySQL-specific (same as 0005).
-- =============================================================================

-- @UP  ------------------------------------------------------------------------

INSERT INTO rbac_permission (PERMISSION_KEY, PERMISSION_NAME, MODULE, DESCRIPTION) VALUES
  ('claims.verify', 'Verify claim', 'claims', 'Verify/approve an assessed claim (Verifier stage).')
ON DUPLICATE KEY UPDATE PERMISSION_KEY = PERMISSION_KEY;

INSERT INTO rbac_role_permission (ROLE_ID, PERMISSION_ID, IS_ENABLED)
SELECT r.ID, p.ID, 1
  FROM rbac_role r
  JOIN rbac_permission p ON p.PERMISSION_KEY = 'claims.verify'
 WHERE r.ROLE_KEY = 'verifier'
ON DUPLICATE KEY UPDATE ROLE_ID = ROLE_ID;

-- @DOWN  ----------------------------------------------------------------------

-- Remove the grant then the permission (mapping also cascades on the DELETE).
DELETE rrp FROM rbac_role_permission rrp
  JOIN rbac_permission p ON p.ID = rrp.PERMISSION_ID
 WHERE p.PERMISSION_KEY = 'claims.verify';

DELETE FROM rbac_permission WHERE PERMISSION_KEY = 'claims.verify';
