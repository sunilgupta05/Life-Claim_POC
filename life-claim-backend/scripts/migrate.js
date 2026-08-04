#!/usr/bin/env node
// scripts/migrate.js
//
// CLI for the database migration engine (src/db/migrator.js).
//
// Usage:
//   npm run migrate                 apply all pending migrations
//   npm run migrate -- --to 0002    apply pending up to version 0002
//   npm run migrate -- --dry-run    show what would run, change nothing
//   npm run migrate:status          list applied vs pending + schema version
//   npm run migrate:down            roll back the most recent migration
//   npm run migrate:down -- --step 2      roll back the last 2
//   npm run migrate:down -- --to 0001     roll back everything after 0001
//   npm run migrate:create -- add_widgets scaffold a new migration file
//
// Connection comes from the backend .env (DB_HOST/DB_USER/DB_PASSWORD/
// DB_DATABASE, optional DB_PORT/DB_DIALECT). Nothing here is environment-
// specific — the same command runs against DEV, UAT and PROD.

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Migrator } = require('../src/db/migrator');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--to') args.to = argv[++i];
    else if (a === '--step') args.step = parseInt(argv[++i], 10);
    else if (a.startsWith('--to=')) args.to = a.slice(5);
    else if (a.startsWith('--step=')) args.step = parseInt(a.slice(7), 10);
    else args._.push(a);
  }
  return args;
}

function assertDbConfig() {
  const missing = ['DB_HOST', 'DB_USER', 'DB_DATABASE'].filter(
    (k) => !process.env[k]
  );
  if (missing.length) {
    console.error(
      `Missing required env var(s): ${missing.join(', ')}.\n` +
        `Set them in life-claim-backend/.env before running migrations.`
    );
    process.exit(1);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const command = args._[0] || 'up';

  if (command === 'create') {
    const name = args._.slice(1).join(' ') || args._[1];
    if (!name) {
      console.error('Usage: npm run migrate:create -- <name>');
      process.exit(1);
    }
    // create is filesystem-only; no DB connection needed
    new Migrator().create(name);
    return;
  }

  assertDbConfig();
  const migrator = new Migrator();

  switch (command) {
    case 'up':
    case 'migrate':
      await migrator.up({ toVersion: args.to || null, dryRun: !!args.dryRun });
      break;
    case 'down':
    case 'rollback':
      await migrator.down({
        steps: Number.isFinite(args.step) ? args.step : 1,
        toVersion: args.to || null,
        dryRun: !!args.dryRun,
      });
      break;
    case 'status':
      await migrator.status();
      break;
    default:
      console.error(
        `Unknown command "${command}".\n` +
          `Commands: up (default), down, status, create.`
      );
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nMigration command failed:');
  console.error('  ' + (err && err.message ? err.message : err));
  process.exit(1);
});
