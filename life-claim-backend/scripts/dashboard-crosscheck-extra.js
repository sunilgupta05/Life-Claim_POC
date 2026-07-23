require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/dbConfig');
const S = process.env.DB_DATABASE || 'claims_poc';

(async () => {
  const [sla] = await db.execute(`
    SELECT
      SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) NOT IN (
        'rejected','payout rejected','assessor rejected','verifier rejected','approved','payout completed'
      ) AND DATE(COALESCE(MODIFIED_AT, CREATED_AT)) < CURDATE() - INTERVAL 3 DAY THEN 1 ELSE 0 END) AS breached,
      SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) NOT IN (
        'rejected','payout rejected','assessor rejected','verifier rejected','approved','payout completed'
      ) AND DATE(COALESCE(MODIFIED_AT, CREATED_AT)) BETWEEN CURDATE() - INTERVAL 3 DAY AND CURDATE() THEN 1 ELSE 0 END) AS atRisk,
      SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%' AND role = 'Assessor' THEN 1 ELSE 0 END) AS assessorOpen,
      SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) LIKE 'pending%' AND role = 'Verifier' THEN 1 ELSE 0 END) AS verifierOpen,
      SUM(CASE WHEN LOWER(COALESCE(status, CLAIM_STATUS, '')) NOT IN (
        'rejected','payout rejected','assessor rejected','verifier rejected','approved','payout completed'
      ) THEN 1 ELSE 0 END) AS pending
    FROM ${S}.claims`);
  console.log('Superuser SLA + workload:', sla[0]);

  const [sim] = await db.execute(`
    SELECT DATE_FORMAT(CREATED_AT, '%b') AS m, COUNT(*) AS c
    FROM ${S}.claims
    WHERE APPROVER_USERNAME = 'simran' OR ASSIGNED_TO = 'simran' OR MODIFIED_BY = 'simran'
       OR ASSESSMENT_USERNAME = 'simran' OR CREATED_BY = 'simran'
    GROUP BY YEAR(CREATED_AT), MONTH(CREATED_AT)
    ORDER BY MIN(CREATED_AT)`);
  console.log('Simran claims by registration month:', sim);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
