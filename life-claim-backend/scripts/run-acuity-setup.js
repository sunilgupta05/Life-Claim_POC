/**
 * One-time setup: acuity_watchlist table + claims columns + seed rows.
 * Run: node scripts/run-acuity-setup.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

async function columnExists(conn, table, column) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.DB_DATABASE, table, column]
  );
  return rows[0].n > 0;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'claims_poc',
    multipleStatements: true,
  });

  console.log('Connected to', process.env.DB_DATABASE);

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS acuity_watchlist (
      ID          INT AUTO_INCREMENT PRIMARY KEY,
      FULL_NAME   VARCHAR(200) NOT NULL,
      DOB         DATE NULL,
      COUNTRY     VARCHAR(100) NULL
    )
  `);
  console.log('OK: acuity_watchlist table');

  for (const col of [
    'CLAIMANT_ACUITY_DECISION',
    'PAYEE_ACUITY_DECISION',
    'FINAL_ACUITY_DECISION',
  ]) {
    if (!(await columnExists(conn, 'claims', col))) {
      await conn.execute(
        `ALTER TABLE claims ADD COLUMN ${col} VARCHAR(20) NULL DEFAULT 'NOT FLAGGED'`
      );
      console.log('OK: added claims.' + col);
    } else {
      console.log('SKIP: claims.' + col + ' already exists');
    }
  }

  const seeds = [
    ['Atharva', '1990-05-15', 'Monaco'],
    ['Mohit', '1985-01-01', 'Maldives'],
    ['Om', '1992-03-20', 'Malta'],
  ];

  for (const [name, dob, country] of seeds) {
    const [existing] = await conn.execute(
      'SELECT ID FROM acuity_watchlist WHERE FULL_NAME = ? AND DOB = ? LIMIT 1',
      [name, dob]
    );
    if (existing.length) {
      console.log('SKIP seed:', name);
    } else {
      await conn.execute(
        'INSERT INTO acuity_watchlist (FULL_NAME, DOB, COUNTRY) VALUES (?, ?, ?)',
        [name, dob, country]
      );
      console.log('OK seed:', name);
    }
  }

  const [watchlist] = await conn.execute('SELECT * FROM acuity_watchlist');
  console.log('\nacuity_watchlist rows:', watchlist.length);
  watchlist.forEach((r) => console.log(' -', r.ID, r.FULL_NAME, r.DOB, r.COUNTRY));

  const [cols] = await conn.execute(
    `SHOW COLUMNS FROM claims WHERE Field LIKE '%ACUITY%'`
  );
  console.log('\nclaims acuity columns:');
  cols.forEach((c) => console.log(' -', c.Field, c.Type, c.Default));

  await conn.end();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
