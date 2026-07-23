/**
 * Cross-check dashboard math for each role vs superuser platform totals.
 * Run: node scripts/dashboard-crosscheck.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/dbConfig');
const DB_SCHEMA = process.env.DB_DATABASE || 'claims_poc';

const REJECTED = new Set(['rejected', 'assessor rejected', 'verifier rejected', 'payout rejected']);
const APPROVED_TERMINAL = new Set(['approved', 'payout completed']);

function workflowStatus(row) {
  const s = String(row.status || row.STATUS || '').trim().toLowerCase();
  if (s) return s;
  const legacy = String(row.CLAIM_STATUS || '').trim().toLowerCase();
  const policyOnly = new Set(['in force', 'inforce', 'lapsed', 'paid-up', 'paid up', 'foreclosed']);
  if (legacy && !policyOnly.has(legacy)) return legacy;
  return '';
}

function classify(status, workflowRole) {
  if (REJECTED.has(status)) return 'rejected';
  if (APPROVED_TERMINAL.has(status)) return 'approved';
  if (workflowRole === 'assessor' && (status === 'pending verifier allocation' || status === 'pending verifier action')) {
    return 'approved';
  }
  return 'pending';
}

function normalizeType(raw) {
  const lower = String(raw || '').trim().toLowerCase();
  if (lower === 'death' || lower === 'death claim') return 'Death';
  if (lower === 'rider' || lower === 'rider claim') return 'Rider';
  return raw || 'Other';
}

async function userClaims(username) {
  const q = `
    SELECT c.CLAIM_NUMBER, c.CLAIM_TYPE, c.status, c.CLAIM_STATUS,
           c.CREATED_AT, c.MODIFIED_AT, c.CREATED_BY,
           COALESCE(cd.CURRENT_SA, cd.ORIGINAL_SA, 0) AS amount
    FROM ${DB_SCHEMA}.claims c
    LEFT JOIN ${DB_SCHEMA}.contact_details cd ON cd.CLAIM_ID = CAST(c.CLAIM_ID AS CHAR)
    WHERE c.ASSIGNED_TO = ? OR c.MODIFIED_BY = ? OR c.ASSESSMENT_USERNAME = ?
       OR c.APPROVER_USERNAME = ? OR c.CREATED_BY = ?
    ORDER BY COALESCE(c.MODIFIED_AT, c.CREATED_AT) DESC
  `;
  const [rows] = await db.execute(q, [username, username, username, username, username]);
  return rows;
}

function summarize(rows, workflowRole) {
  const buckets = { pending: 0, approved: 0, rejected: 0 };
  const types = {};
  const months = {};
  let pipelineValue = 0;
  let overdue = 0;
  let daysSum = 0;
  let daysCount = 0;

  for (const row of rows) {
    const status = workflowStatus(row);
    const bucket = classify(status, workflowRole);
    buckets[bucket]++;

    const t = normalizeType(row.CLAIM_TYPE);
    types[t] = (types[t] || 0) + 1;

    if (bucket === 'pending') {
      const amt = Number(row.amount) || 0;
      pipelineValue += amt;
      const created = new Date(row.CREATED_AT || 0);
      const days = Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000));
      daysSum += days;
      daysCount++;
      if (days > 3) overdue++;
    }

    if (row.CREATED_AT) {
      const d = new Date(row.CREATED_AT);
      const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
      if (!months[m]) months[m] = { approved: 0, pending: 0, rejected: 0 };
      months[m][bucket]++;
    }
  }

  const total = rows.length;
  const typeSum = Object.values(types).reduce((a, b) => a + b, 0);
  const statusSum = buckets.pending + buckets.approved + buckets.rejected;
  const trendSum = Object.values(months).reduce(
    (s, m) => s + m.approved + m.pending + m.rejected,
    0
  );

  return {
    total,
    ...buckets,
    statusSum,
    statusOk: statusSum === total,
    types,
    typeSum,
    typeOk: typeSum === total,
    slaPct: total ? Math.round((buckets.approved / total) * 100) : 0,
    pipelineValue,
    overdue,
    avgDays: daysCount ? Math.round((daysSum / daysCount) * 10) / 10 : 0,
    trendMonths: Object.keys(months).length,
    trendSum,
    trendOk: trendSum <= total,
  };
}

async function platformSummary() {
  const q = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('rejected','payout rejected','assessor rejected','verifier rejected') THEN 1 ELSE 0 END) AS rejected,
      SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) IN ('approved','payout completed') THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) NOT IN ('rejected','payout rejected','assessor rejected','verifier rejected','approved','payout completed') THEN 1 ELSE 0 END) AS pending
    FROM ${DB_SCHEMA}.claims
  `;
  const [rows] = await db.execute(q);
  const r = rows[0];
  const typeQ = `
    SELECT
      CASE
        WHEN LOWER(TRIM(COALESCE(CLAIM_TYPE, ''))) IN ('death', 'death claim') THEN 'Death'
        WHEN LOWER(TRIM(COALESCE(CLAIM_TYPE, ''))) IN ('rider', 'rider claim') THEN 'Rider'
        ELSE COALESCE(NULLIF(TRIM(CLAIM_TYPE), ''), 'Other')
      END AS t, COUNT(*) AS cnt
    FROM ${DB_SCHEMA}.claims GROUP BY 1
  `;
  const [typeRows] = await db.execute(typeQ);
  const types = Object.fromEntries(typeRows.map((x) => [x.t, Number(x.cnt)]));
  const typeSum = Object.values(types).reduce((a, b) => a + b, 0);
  return {
    total: Number(r.total),
    pending: Number(r.pending),
    approved: Number(r.approved),
    rejected: Number(r.rejected),
    statusSum: Number(r.pending) + Number(r.approved) + Number(r.rejected),
    types,
    typeSum,
  };
}

const USERS = [
  { username: 'sujal', role: 'pre assessor', screenshot: { total: 111, pending: 52, approved: 38, rejected: 21, death: 108, rider: 3 } },
  { username: 'kishor', role: 'assessor', screenshot: { total: 73, pending: 13, approved: 45, rejected: 15, death: 72, rider: 1 } },
  { username: 'simran', role: 'verifier', screenshot: { total: 31, pending: 9, approved: 21, rejected: 1, death: 31, rider: 0 } },
];

async function main() {
  console.log('=== PLATFORM (Superuser) ===');
  const plat = await platformSummary();
  console.log(JSON.stringify(plat, null, 2));
  console.log(`Status sum OK: ${plat.statusSum === plat.total} (${plat.statusSum}/${plat.total})`);
  console.log(`Type sum OK: ${plat.typeSum === plat.total} (${plat.typeSum}/${plat.total})`);
  console.log(`Screenshot expects: total=141, pending=70, approved=46, rejected=25, death=138, rider=3`);
  console.log('');

  for (const u of USERS) {
    console.log(`=== ${u.username.toUpperCase()} (${u.role}) ===`);
    const rows = await userClaims(u.username);
    const s = summarize(rows, u.role);
    console.log('DB computed:', JSON.stringify(s, null, 2));
    const sc = u.screenshot;
    console.log('Screenshot:', sc);
    console.log('Match total:', s.total === sc.total ? 'YES' : `NO (db=${s.total})`);
    console.log('Match pending:', s.pending === sc.pending ? 'YES' : `NO (db=${s.pending})`);
    console.log('Match approved:', s.approved === sc.approved ? 'YES' : `NO (db=${s.approved})`);
    console.log('Match rejected:', s.rejected === sc.rejected ? 'YES' : `NO (db=${s.rejected})`);
    console.log('Match death:', (s.types.Death || 0) === sc.death ? 'YES' : `NO (db=${s.types.Death || 0})`);
    console.log('Match rider:', (s.types.Rider || 0) === sc.rider ? 'YES' : `NO (db=${s.types.Rider || 0})`);
    console.log('');
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
