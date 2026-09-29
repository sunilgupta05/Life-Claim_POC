// src/db/migrator.js
//
// The migration engine. Applies ordered .sql migration files to the database
// and records what ran in the `schema_migrations` tracking table, so every
// DEV / UAT / PROD environment knows exactly which schema version it is on.
//
// Design goals (see roadmap item 0.1):
//   - Replace the loose, hand-run scripts/*.sql with one ordered, tracked flow.
//   - `migrate` applies pending migrations in order; `down` rolls them back.
//   - Dialect-agnostic: all DB-specific SQL lives in src/db/dialects/*, so a
//     future Oracle target stays open.
//
// Migration file format (see migrations/.template.sql):
//   - Filename: NNNN_snake_case_name.sql   (NNNN = zero-padded ordering key)
//   - Body split by marker lines:
//         -- @UP     ... statements applied when migrating up
//         -- @DOWN   ... statements applied when rolling back
//   - MySQL DDL is not transactional, so author UP/DOWN idempotently
//     (CREATE TABLE IF NOT EXISTS, guarded ALTERs, etc.).

const logger = require('../util/logger');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDialect } = require('./dialects');

const DEFAULT_MIGRATIONS_DIR = path.join(__dirname, '..', '..', 'migrations');

function loadConfig(overrides = {}) {
  // dotenv is loaded by the CLI entrypoint; read straight from process.env here.
  return {
    dialect: overrides.dialect || process.env.DB_DIALECT || 'mysql',
    migrationsDir:
      overrides.migrationsDir ||
      process.env.DB_MIGRATIONS_DIR ||
      DEFAULT_MIGRATIONS_DIR,
    connection: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    },
  };
}

// ---- migration file parsing ------------------------------------------------

const UP_MARKER = /^--\s*@UP\b.*$/im;
const DOWN_MARKER = /^--\s*@DOWN\b.*$/im;

function versionOf(name) {
  // leading numeric/ordering token: "0001_baseline_schema" -> "0001"
  const m = /^([0-9]+)/.exec(name);
  return m ? m[1] : name;
}

function parseMigration(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const upIdx = raw.search(UP_MARKER);
  if (upIdx === -1) {
    throw new Error(
      `Migration ${path.basename(filePath)} is missing a "-- @UP" section.`
    );
  }
  const downIdx = raw.search(DOWN_MARKER);
  const upEnd = downIdx === -1 ? raw.length : downIdx;

  // strip the marker line itself from the start of each section
  const up = raw
    .slice(upIdx, upEnd)
    .replace(UP_MARKER, '')
    .trim();
  const down =
    downIdx === -1
      ? ''
      : raw.slice(downIdx).replace(DOWN_MARKER, '').trim();

  const checksum = crypto.createHash('sha256').update(raw).digest('hex');
  return { up, down, checksum, raw };
}

function isBlank(sql) {
  // treat a section as empty if it has no non-comment, non-whitespace content
  return sql
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('--'))
    .join('')
    .length === 0;
}

function discoverMigrations(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.sql') && !f.startsWith('.'))
    .sort() // zero-padded filenames sort lexically == numerically
    .map((f) => {
      const name = f.replace(/\.sql$/, '');
      return { name, version: versionOf(name), file: path.join(dir, f) };
    });
}

// ---- engine ----------------------------------------------------------------

class Migrator {
  constructor(overrides = {}) {
    this.config = loadConfig(overrides);
    this.dialect = getDialect(this.config.dialect, this.config.connection);
    this.log = overrides.log || ((msg) => logger.info(msg));
  }

  // Connect only. The tracking table is created lazily, right before the first
  // write, so read-only commands (status, --dry-run) never touch the database.
  async _open() {
    await this.dialect.connect();
  }

  async _close() {
    await this.dialect.close();
  }

  // Applied migrations, tolerant of a not-yet-created tracking table (a fresh
  // database that has never been migrated reads as "nothing applied").
  async _getApplied() {
    try {
      return await this.dialect.getApplied();
    } catch (err) {
      if (this._isMissingMetaTable(err)) return [];
      throw err;
    }
  }

  _isMissingMetaTable(err) {
    const msg = String((err && err.message) || '').toLowerCase();
    return (
      err && (err.code === 'ER_NO_SUCH_TABLE' || err.errno === 1146) ||
      /doesn'?t exist|no such table|unknown table|does not exist/.test(msg)
    );
  }

  async _plan() {
    const all = discoverMigrations(this.config.migrationsDir);
    const appliedRows = await this._getApplied();
    const applied = new Map(appliedRows.map((r) => [r.name, r]));
    return { all, applied };
  }

  /** Apply all pending migrations (optionally up to `toVersion`). */
  async up({ toVersion = null, dryRun = false } = {}) {
    await this._open();
    try {
      const { all, applied } = await this._plan();
      const pending = all.filter(
        (m) =>
          !applied.has(m.name) &&
          (toVersion === null || m.version <= toVersion)
      );

      if (pending.length === 0) {
        this.log('✓ Database is up to date — no pending migrations.');
        return { applied: [] };
      }

      // drift check: warn if an already-applied file changed on disk
      for (const m of all) {
        if (applied.has(m.name)) {
          const parsed = parseMigration(m.file);
          if (parsed.checksum !== applied.get(m.name).checksum) {
            this.log(
              `⚠ WARNING: ${m.name} was modified after it was applied ` +
                `(checksum mismatch). Applied migrations should be immutable.`
            );
          }
        }
      }

      // Only now — with real work to do and not a dry run — create the
      // tracking table. Read-only/preview runs leave the DB untouched.
      if (!dryRun) await this.dialect.ensureMetaTable();

      const done = [];
      for (const m of pending) {
        const parsed = parseMigration(m.file);
        if (isBlank(parsed.up)) {
          this.log(`• ${m.name} — empty UP section, recording as applied.`);
        }
        this.log(`${dryRun ? '[dry-run] would apply' : '→ applying'} ${m.name} ...`);
        if (!dryRun) {
          const started = Date.now();
          try {
            if (!isBlank(parsed.up)) await this.dialect.exec(parsed.up);
          } catch (err) {
            this.log(`✗ FAILED on ${m.name}: ${err.message}`);
            throw err;
          }
          const ms = Date.now() - started;
          await this.dialect.recordApplied(m.name, m.version, parsed.checksum, ms);
          this.log(`  ✓ applied ${m.name} (${ms} ms)`);
        }
        done.push(m.name);
      }
      this.log(
        `\n${dryRun ? '[dry-run] ' : ''}${done.length} migration(s) ` +
          `${dryRun ? 'pending' : 'applied'}.`
      );
      return { applied: done };
    } finally {
      await this._close();
    }
  }

  /** Roll back applied migrations, newest first. */
  async down({ steps = 1, toVersion = null, dryRun = false } = {}) {
    await this._open();
    try {
      const { all, applied } = await this._plan();
      const byName = new Map(all.map((m) => [m.name, m]));

      // applied, newest first
      let target = [...applied.values()]
        .sort((a, b) => (a.name < b.name ? 1 : -1));

      if (toVersion !== null) {
        // roll back everything strictly newer than toVersion
        target = target.filter((r) => versionOf(r.name) > toVersion);
      } else {
        target = target.slice(0, Math.max(0, steps));
      }

      if (target.length === 0) {
        this.log('✓ Nothing to roll back.');
        return { rolledBack: [] };
      }

      const done = [];
      for (const row of target) {
        const m = byName.get(row.name);
        if (!m) {
          this.log(
            `✗ Cannot roll back ${row.name}: file is missing from ` +
              `${this.config.migrationsDir}. Skipping.`
          );
          throw new Error(`Missing migration file for ${row.name}`);
        }
        const parsed = parseMigration(m.file);
        if (isBlank(parsed.down)) {
          this.log(
            `✗ ${m.name} has no @DOWN section — cannot roll back automatically.`
          );
          throw new Error(`Irreversible migration: ${m.name}`);
        }
        this.log(`${dryRun ? '[dry-run] would revert' : '← reverting'} ${m.name} ...`);
        if (!dryRun) {
          await this.dialect.exec(parsed.down);
          await this.dialect.removeApplied(m.name);
          this.log(`  ✓ reverted ${m.name}`);
        }
        done.push(m.name);
      }
      this.log(
        `\n${dryRun ? '[dry-run] ' : ''}${done.length} migration(s) ` +
          `${dryRun ? 'would be reverted' : 'reverted'}.`
      );
      return { rolledBack: done };
    } finally {
      await this._close();
    }
  }

  /** Print applied vs pending and the current schema version. */
  async status() {
    await this._open();
    try {
      const { all, applied } = await this._plan();
      const appliedNames = [...applied.keys()].sort();
      const currentVersion =
        appliedNames.length > 0
          ? versionOf(appliedNames[appliedNames.length - 1])
          : '(none)';

      this.log(`Dialect:         ${this.dialect.name}`);
      this.log(`Database:        ${this.config.connection.database}`);
      this.log(`Migrations dir:  ${this.config.migrationsDir}`);
      this.log(`Schema version:  ${currentVersion}`);
      this.log('');
      this.log('  STATUS    VERSION  MIGRATION');
      this.log('  --------  -------  -----------------------------------------');
      for (const m of all) {
        const row = applied.get(m.name);
        const mark = row ? 'applied ' : 'pending ';
        const when = row
          ? new Date(row.applied_at).toISOString().replace('T', ' ').slice(0, 19)
          : '';
        this.log(`  ${mark}  ${m.version.padEnd(7)}  ${m.name}${when ? '   ' + when : ''}`);
      }
      const pendingCount = all.filter((m) => !applied.has(m.name)).length;
      this.log('');
      this.log(`  ${all.length} total · ${all.length - pendingCount} applied · ${pendingCount} pending`);
      return { all, applied, currentVersion };
    } finally {
      await this._close();
    }
  }

  /** Scaffold a new empty migration file and return its path. */
  create(name) {
    const dir = this.config.migrationsDir;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const existing = discoverMigrations(dir);
    const nextNum = existing.length
      ? Math.max(...existing.map((m) => parseInt(m.version, 10) || 0)) + 1
      : 1;
    const slug = String(name || 'migration')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const id = String(nextNum).padStart(4, '0');
    const fileName = `${id}_${slug}.sql`;
    const filePath = path.join(dir, fileName);
    if (fs.existsSync(filePath)) {
      throw new Error(`Migration ${fileName} already exists.`);
    }
    const templatePath = path.join(dir, '.template.sql');
    let body;
    if (fs.existsSync(templatePath)) {
      body = fs
        .readFileSync(templatePath, 'utf8')
        .replace(/__NAME__/g, `${id}_${slug}`);
    } else {
      body =
        `-- migration: ${id}_${slug}\n` +
        `-- description: TODO\n\n` +
        `-- @UP\n\n\n` +
        `-- @DOWN\n\n`;
    }
    fs.writeFileSync(filePath, body);
    this.log(`Created ${path.relative(process.cwd(), filePath)}`);
    return filePath;
  }
}

module.exports = { Migrator, discoverMigrations, parseMigration, versionOf };
