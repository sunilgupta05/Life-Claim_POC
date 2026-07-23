const db = require('../config/dbConfig');

/**
 * Life Asia decisionDetails API reads claims_poc.decision_details
 * (CLAIM_ID = claim number string, e.g. CL10750).
 * Registration historically only wrote decision_system; older claims were backfilled.
 */

/** POC section weights aligned with existing BackfillScript rows (e.g. CL10750). */
function buildSectionsFromBase(baseSa) {
  const base = Number(baseSa);
  const safeBase = Number.isFinite(base) && base > 0 ? base : 0;
  const pct = (p) => Number((safeBase * p).toFixed(2));
  return {
    BASE_SEC: Number(safeBase.toFixed(2)),
    FUND_SEC: pct(0.29),
    INTERIM_SEC: pct(0.02),
    GA_SEC: 0,
    LOAN_SCHEDULE_SEC: pct(0.1),
    PREMIUM_OTS_SEC: pct(0.07),
    EXCESS_PREMIUM_SEC: pct(0.02),
    REV_BONUS_SEC: pct(0.02),
    OTS_LOAN_SEC: pct(0.1),
    TERMINAL_BONUS_SEC: pct(0.03),
  };
}

async function findByClaimNumber(claimNumber) {
  const [rows] = await db.query(
    'SELECT * FROM decision_details WHERE CLAIM_ID = ? LIMIT 1',
    [String(claimNumber || '').trim()],
  );
  return rows[0] || null;
}

/**
 * Ensure a decision_details row exists for this claim number.
 * No-op if already present (keeps BackfillScript / existing rows unchanged).
 */
async function ensureDecisionDetailsForClaim(claimNumber, baseSa, modifiedBy = 'Registration') {
  const claimId = String(claimNumber || '').trim();
  if (!claimId) {
    throw new Error('claimNumber is required for decision_details');
  }

  const existing = await findByClaimNumber(claimId);
  if (existing) return existing;

  const sections = buildSectionsFromBase(baseSa);
  await db.query(
    `INSERT INTO decision_details
      (CLAIM_ID, BASE_SEC, FUND_SEC, INTERIM_SEC, GA_SEC, LOAN_SCHEDULE_SEC, PREMIUM_OTS_SEC,
       EXCESS_PREMIUM_SEC, REV_BONUS_SEC, OTS_LOAN_SEC, TERMINAL_BONUS_SEC, MODIFIED_BY, MODIFIED_ON)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      claimId,
      sections.BASE_SEC,
      sections.FUND_SEC,
      sections.INTERIM_SEC,
      sections.GA_SEC,
      sections.LOAN_SCHEDULE_SEC,
      sections.PREMIUM_OTS_SEC,
      sections.EXCESS_PREMIUM_SEC,
      sections.REV_BONUS_SEC,
      sections.OTS_LOAN_SEC,
      sections.TERMINAL_BONUS_SEC,
      String(modifiedBy || 'Registration').slice(0, 100),
    ],
  );

  return findByClaimNumber(claimId);
}

module.exports = {
  findByClaimNumber,
  ensureDecisionDetailsForClaim,
  buildSectionsFromBase,
};
