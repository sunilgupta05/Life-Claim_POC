require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const { evaluateAcuity } = require('../src/services/acuityDecisionService');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  console.log('=== DB CHECK ===');
  const [tables] = await conn.execute(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'acuity_watchlist'`,
    [process.env.DB_DATABASE]
  );
  console.log('acuity_watchlist exists:', tables.length === 1);

  const [watchlist] = await conn.execute('SELECT ID, FULL_NAME, DOB, COUNTRY FROM acuity_watchlist');
  console.log('watchlist rows:', watchlist.length);
  watchlist.forEach((r) => console.log(' ', r));

  const [cols] = await conn.execute(
    `SHOW COLUMNS FROM claims WHERE Field LIKE '%ACUITY%'`
  );
  console.log('claims acuity columns:', cols.map((c) => c.Field).join(', ') || 'NONE');

  await conn.end();

  console.log('\n=== LOGIC CHECK (no DB) ===');
  const mockWatchlist = [
    { FULL_NAME: 'Atharva', DOB: '1990-05-15', COUNTRY: 'Monaco' },
  ];

  // Patch pool for unit tests - call internal logic via evaluateAcuity with mocked data
  // We test matching by temporarily using evaluateAcuity which hits DB

  console.log('\n=== LIVE SERVICE CHECK ===');
  const hit = await evaluateAcuity({
    claimantDetails: [{ name: 'Atharva', dob: '', country: '' }],
    payeeDetails: [],
  });
  console.log('Claimant name Atharva:', hit);

  const miss = await evaluateAcuity({
    claimantDetails: [{ name: 'Nobody', dob: '2000-01-01', country: 'India' }],
    payeeDetails: [{ name: 'Random', lastName: 'Person', dob: '2000-01-01', country: 'India' }],
  });
  console.log('No match:', miss);

  const countryHit = await evaluateAcuity({
    claimantDetails: [],
    payeeDetails: [{ name: 'X', dob: '', country: 'Malta' }],
  });
  console.log('Payee country Malta:', countryHit);

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
