-- =============================================================================
-- Admin Overview – SQL cross-check queries
-- Run these against life_claim.claims to verify each number on the dashboard.
-- Replace life_claim with your schema name if different.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) ALL-IN-ONE: One query that returns every Overview metric (like the backend)
-- -----------------------------------------------------------------------------
SELECT
  COUNT(*) AS totalClaims,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%' THEN 1 ELSE 0 END) AS pending,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('approved', 'payout completed') THEN 1 ELSE 0 END) AS approved,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('rejected', 'payout rejected') THEN 1 ELSE 0 END) AS rejected,
  SUM(CASE WHEN DATE(CREATED_AT) >= CURDATE() - INTERVAL 6 DAY THEN 1 ELSE 0 END) AS registeredThisWeek,
  SUM(CASE WHEN DATE(COALESCE(CREATED_AT)) = CURDATE() THEN 1 ELSE 0 END) AS createdToday,
  SUM(CASE WHEN DATE(COALESCE(MODIFIED_AT, CREATED_AT)) = CURDATE()
            AND LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('approved', 'rejected', 'payout rejected', 'payout completed') THEN 1 ELSE 0 END) AS closedToday,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%' THEN 1 ELSE 0 END) AS pipelineRegistered,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('pending assessor action', 'pending assessor allocation') THEN 1 ELSE 0 END) AS pendingAssessor,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('pending verifier action', 'pending verifier allocation') THEN 1 ELSE 0 END) AS pendingVerifier,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('approved', 'payout completed') THEN 1 ELSE 0 END) AS pipelineApproved,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('rejected', 'payout rejected') THEN 1 ELSE 0 END) AS pipelineRejected,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
            AND DATE(COALESCE(MODIFIED_AT, CREATED_AT)) < CURDATE() - INTERVAL 3 DAY THEN 1 ELSE 0 END) AS slaBreached,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
            AND DATE(COALESCE(MODIFIED_AT, CREATED_AT)) BETWEEN CURDATE() - INTERVAL 3 DAY AND CURDATE() THEN 1 ELSE 0 END) AS slaAtRisk,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%' AND role = 'Pre Assessor' THEN 1 ELSE 0 END) AS openPreAssessor,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%' AND role = 'Assessor' THEN 1 ELSE 0 END) AS openAssessor,
  SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%' AND role = 'Verifier' THEN 1 ELSE 0 END) AS openVerifier,
  SUM(CASE WHEN DATE(COALESCE(MODIFIED_AT, CREATED_AT)) >= CURDATE() - INTERVAL 29 DAY THEN 1 ELSE 0 END) AS last30Total,
  SUM(CASE WHEN DATE(COALESCE(MODIFIED_AT, CREATED_AT)) >= CURDATE() - INTERVAL 29 DAY
            AND LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('rejected', 'payout rejected') THEN 1 ELSE 0 END) AS last30Rejected
FROM life_claim.claims;


-- -----------------------------------------------------------------------------
-- 2) PLATFORM OVERVIEW – individual checks
-- -----------------------------------------------------------------------------

-- Total Claims (should match "89" on Overview)
SELECT COUNT(*) AS totalClaims FROM life_claim.claims;

-- Pending (should match "42")
SELECT COUNT(*) AS pending
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%';

-- Approved (should match "30")
SELECT COUNT(*) AS approved
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('approved', 'payout completed');

-- Rejected (should match "17")
SELECT COUNT(*) AS rejected
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('rejected', 'payout rejected');

-- Registered (this week) – last 7 days by creation date
SELECT COUNT(*) AS registeredThisWeek
FROM life_claim.claims
WHERE DATE(CREATED_AT) >= CURDATE() - INTERVAL 6 DAY;

-- Today: New (created today)
SELECT COUNT(*) AS createdToday
FROM life_claim.claims
WHERE DATE(COALESCE(CREATED_AT)) = CURDATE();

-- Today: Closed (last activity today AND status is closed)
SELECT COUNT(*) AS closedToday
FROM life_claim.claims
WHERE DATE(COALESCE(MODIFIED_AT, CREATED_AT)) = CURDATE()
  AND LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('approved', 'rejected', 'payout rejected', 'payout completed');


-- -----------------------------------------------------------------------------
-- 3) CLAIMS PIPELINE – individual checks
-- -----------------------------------------------------------------------------

-- Registered (same as pending)
SELECT COUNT(*) AS pipelineRegistered
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%';

-- Pending Assessor
SELECT COUNT(*) AS pendingAssessor
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('pending assessor action', 'pending assessor allocation');

-- Pending Verifier
SELECT COUNT(*) AS pendingVerifier
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('pending verifier action', 'pending verifier allocation');

-- Approved (pipeline)
SELECT COUNT(*) AS pipelineApproved
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('approved', 'payout completed');

-- Rejected (pipeline) – should match top KPI Rejected (17)
SELECT COUNT(*) AS pipelineRejected
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('rejected', 'payout rejected');


-- -----------------------------------------------------------------------------
-- 4) SLA & WORKLOAD – individual checks
-- -----------------------------------------------------------------------------

-- SLA Breaches (open/pending and last activity &gt; 3 days ago)
SELECT COUNT(*) AS slaBreached
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
  AND DATE(COALESCE(MODIFIED_AT, CREATED_AT)) < CURDATE() - INTERVAL 3 DAY;

-- At Risk (pending, last activity 1–3 days ago)
SELECT COUNT(*) AS slaAtRisk
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%'
  AND DATE(COALESCE(MODIFIED_AT, CREATED_AT)) BETWEEN CURDATE() - INTERVAL 3 DAY AND CURDATE();

-- Open by role: Pre-assessor
SELECT COUNT(*) AS openPreAssessor
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%' AND role = 'Pre Assessor';

-- Open by role: Assessor
SELECT COUNT(*) AS openAssessor
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%' AND role = 'Assessor';

-- Open by role: Verifier
SELECT COUNT(*) AS openVerifier
FROM life_claim.claims
WHERE LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%' AND role = 'Verifier';

-- Rejection rate (last 30 days): denominator
SELECT COUNT(*) AS last30Total
FROM life_claim.claims
WHERE DATE(COALESCE(MODIFIED_AT, CREATED_AT)) >= CURDATE() - INTERVAL 29 DAY;

-- Rejection rate (last 30 days): rejected count
SELECT COUNT(*) AS last30Rejected
FROM life_claim.claims
WHERE DATE(COALESCE(MODIFIED_AT, CREATED_AT)) >= CURDATE() - INTERVAL 29 DAY
  AND LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('rejected', 'payout rejected');

-- Rejection rate % = last30Rejected / last30Total (e.g. 2/23 ≈ 9%)


-- -----------------------------------------------------------------------------
-- 5) RECENT CLAIMS LIST – same as Overview "Recent Claims" (first 20)
-- -----------------------------------------------------------------------------
SELECT
  CLAIM_NUMBER,
  POLICY_ID AS POLICY_NUMBER,
  COALESCE(status, CLAIM_STATUS) AS STATUS,
  CREATED_BY,
  DATE_FORMAT(COALESCE(MODIFIED_AT, CREATED_AT), '%Y-%m-%d %H:%i:%s') AS lastActivity
FROM life_claim.claims
ORDER BY COALESCE(MODIFIED_AT, CREATED_AT) DESC
LIMIT 20;
