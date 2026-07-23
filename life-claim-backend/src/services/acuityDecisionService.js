const pool = require('../config/dbConfig');

const FLAGGED = 'FLAGGED';
const NOT_FLAGGED = 'NOT FLAGGED';

const norm = (v) => String(v || '').trim().toLowerCase();

const normDate = (v) => {
  if (!v) return '';
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, '0');
    const d = String(v.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const partyMatchesWatchlist = (party, row) => {
  const partyName = norm(party.name);
  const partyDob = normDate(party.dob);
  const partyCountry = norm(party.country);

  const watchName = norm(row.FULL_NAME);
  const watchDob = normDate(row.DOB);
  const watchCountry = norm(row.COUNTRY);

  if (partyName && watchName && partyName === watchName) return true;
  if (partyDob && watchDob && partyDob === watchDob) return true;
  if (partyCountry && watchCountry && partyCountry === watchCountry) return true;
  return false;
};

const isPartyFlagged = (party, watchlist) =>
  watchlist.some((row) => partyMatchesWatchlist(party, row));

const toClaimantParty = (c) => ({
  name: c.name || c.NAME || '',
  dob: c.dob || c.DOB || '',
  country: c.country || c.COUNTRY || '',
});

const toPayeeParty = (p) => ({
  name: [p.name || p.NAME, p.lastName || p.LAST_NAME].filter(Boolean).join(' '),
  dob: p.dob || p.DOB || '',
  country: p.country || p.COUNTRY || '',
});

const evaluateParties = (parties, watchlist) => {
  const list = parties.filter((p) => p.name || p.dob || p.country);
  if (!list.length || !watchlist.length) return NOT_FLAGGED;
  return list.some((p) => isPartyFlagged(p, watchlist)) ? FLAGGED : NOT_FLAGGED;
};

/**
 * Match claimants/payees against acuity_watchlist.
 * Any single field match (name OR dob OR country) → FLAGGED for that party.
 */
const evaluateAcuity = async ({ claimantDetails = [], payeeDetails = [] }) => {
  let watchlist = [];
  try {
    const [rows] = await pool.execute(
      'SELECT FULL_NAME, DOB, COUNTRY FROM acuity_watchlist'
    );
    watchlist = rows || [];
  } catch (err) {
    console.warn('acuityDecisionService >> watchlist unavailable:', err.message);
    return {
      claimantAcuityDecision: NOT_FLAGGED,
      payeeAcuityDecision: NOT_FLAGGED,
      finalAcuityDecision: NOT_FLAGGED,
    };
  }

  const claimants = (claimantDetails || []).map(toClaimantParty);
  const payees = (payeeDetails || []).map(toPayeeParty);

  const claimantAcuityDecision = evaluateParties(claimants, watchlist);
  const payeeAcuityDecision = evaluateParties(payees, watchlist);
  const finalAcuityDecision =
    claimantAcuityDecision === FLAGGED || payeeAcuityDecision === FLAGGED
      ? FLAGGED
      : NOT_FLAGGED;

  return { claimantAcuityDecision, payeeAcuityDecision, finalAcuityDecision };
};

module.exports = {
  evaluateAcuity,
  FLAGGED,
  NOT_FLAGGED,
};
