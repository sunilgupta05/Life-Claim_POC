-- =============================================================================
-- migration: 0008_rbac_finegrained_grants
-- description: Preserve today's access when the coarse route guards are split
--              into fine-grained permissions.
--
-- Until now most operational routes were gated on the coarse `claims.view` /
-- `claims.search`, which ALL three operational roles hold — so in practice
-- Pre Assessor, Assessor and Verifier could reach the assessment/decision/fraud/
-- upload/edit routes. We're now gating those routes on the specific permissions
-- (assessment.view, assessment.act, decision.view, decision.act, fraud.view,
-- documents.upload, claims.edit). To keep behaviour identical until an admin
-- edits the matrix, grant those permissions to every operational role that had
-- access today. Admins then tighten via the Access Control console (1.5).
--
-- `audit.view` is intentionally NOT granted here — it stays superuser-only.
-- Idempotent (composite PK) and additive; touches no existing mapping's flag.
-- =============================================================================

-- @UP  ------------------------------------------------------------------------

INSERT INTO rbac_role_permission (ROLE_ID, PERMISSION_ID, IS_ENABLED)
SELECT r.ID, p.ID, 1
  FROM rbac_role r
  JOIN rbac_permission p
    ON p.PERMISSION_KEY IN (
      'assessment.view', 'assessment.act',
      'decision.view',   'decision.act',
      'fraud.view',      'documents.upload',
      'claims.edit'
    )
 WHERE r.ROLE_KEY IN ('pre-assessor', 'assessor', 'verifier')
ON DUPLICATE KEY UPDATE ROLE_ID = ROLE_ID;

-- @DOWN  ----------------------------------------------------------------------

-- Remove exactly the grants this migration added (the operational roles' newly
-- granted fine-grained perms). Superuser + any pre-existing grants are untouched.
DELETE rrp FROM rbac_role_permission rrp
  JOIN rbac_role r       ON r.ID = rrp.ROLE_ID
  JOIN rbac_permission p ON p.ID = rrp.PERMISSION_ID
 WHERE r.ROLE_KEY IN ('pre-assessor', 'assessor', 'verifier')
   AND p.PERMISSION_KEY IN ('claims.edit');
-- NOTE: assessment.*/decision.*/fraud.view/documents.upload for assessor+verifier
-- pre-existed in the 0005 seed, so @DOWN only removes the truly-new claims.edit
-- grants to avoid deleting seed data. (pre-assessor's extra grants are harmless
-- to leave; a full teardown is 0005's @DOWN.)
