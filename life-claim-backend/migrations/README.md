# Database migrations

This folder is the **single source of truth for the `claims_poc` schema**. It
replaces the old workflow of running loose `scripts/*.sql` files by hand.

Every DEV / UAT / PROD database records which migrations it has applied in a
`schema_migrations` tracking table, so you always know what version an
environment is on and can bring it up to date with one command.

## Quick start

```bash
cd life-claim-backend

npm run migrate:status     # what's applied vs pending, + current schema version
npm run migrate            # apply all pending migrations (in order)
npm run migrate:down       # roll back the most recent migration
```

Connection settings come from `life-claim-backend/.env`
(`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, optional `DB_PORT`,
optional `DB_DIALECT` — defaults to `mysql`). The same commands run unchanged
against every environment.

## Commands

| Command | What it does |
|---|---|
| `npm run migrate` / `npm run migrate:up` | Apply all pending migrations in order |
| `npm run migrate -- --to 0002` | Apply pending migrations up to (and including) version `0002` |
| `npm run migrate -- --dry-run` | Show what *would* run; change nothing |
| `npm run migrate:status` | List applied vs pending and the current schema version |
| `npm run migrate:down` | Roll back the most recent migration |
| `npm run migrate:down -- --step 2` | Roll back the last 2 migrations |
| `npm run migrate:down -- --to 0001` | Roll back everything applied *after* `0001` |
| `npm run migrate:down -- --dry-run` | Show what *would* be reverted |
| `npm run migrate:create -- add_widget_table` | Scaffold a new migration file from `.template.sql` |

> `--` is required so `npm` forwards the flags to the script rather than
> consuming them itself.

## How it works

- **`src/db/migrator.js`** — the engine: discovers migration files, compares
  them against `schema_migrations`, and applies or reverts them in order.
- **`src/db/dialects/`** — all database-specific SQL. `mysql.js` is the active
  implementation; `oracle.js` is a documented stub that keeps a future Oracle
  target open (`DB_DIALECT=oracle`). The engine never talks to a driver
  directly, only to a dialect.
- **`scripts/migrate.js`** — the CLI the `npm run migrate:*` scripts call.

### The tracking table

The engine creates `schema_migrations` automatically on first run:

| column | meaning |
|---|---|
| `name` | migration filename without `.sql` (e.g. `0001_baseline_schema`) — primary key |
| `version` | the leading ordering token (e.g. `0001`) |
| `checksum` | SHA-256 of the file when it was applied (drift detection) |
| `applied_at` | when it ran |
| `execution_ms` | how long it took |

The **current schema version** is the highest applied `version`.

## Migration file format

Files are named `NNNN_snake_case_name.sql` (zero-padded, so they sort in
apply order) and split into two sections by marker comments:

```sql
-- @UP
CREATE TABLE IF NOT EXISTS widget ( ... );

-- @DOWN
DROP TABLE IF EXISTS widget;
```

- `@UP` runs on `migrate`; `@DOWN` runs on `migrate:down`.
- A migration with an empty `@DOWN` is treated as irreversible — `migrate:down`
  will refuse to revert it.

### Authoring rules

1. **Never edit a migration after it has been applied anywhere.** Add a new
   numbered migration instead. The engine warns on checksum drift.
2. **Author idempotently.** MySQL DDL is *not* transactional — a failed
   migration cannot be auto-rolled-back mid-way, so re-running must be safe.
   Use `CREATE TABLE IF NOT EXISTS`, `DROP ... IF EXISTS`, and for `ALTER`s use
   the information_schema guard pattern (see `0002_...`), since MySQL 8 has no
   `ADD COLUMN IF NOT EXISTS`.
3. **Prefer neutral SQL** (avoid backtick identifiers and MySQL-only functions)
   so a file can also run on a future Oracle target. When you must use
   MySQL-specific SQL, say so in the file header. The `0001` baseline is an
   exception — it is a faithful MySQL dump.

## What's here now

| Version | Migration | Notes |
|---|---|---|
| `0001` | `baseline_schema` | Snapshot of the live `claims_poc` schema (100 tables) when the framework was introduced. Idempotent (`IF NOT EXISTS`), so it's a **no-op on existing databases** and a **full build on a fresh one**. Excludes 7 `backup_*` tables. |
| `0002` | `user_login_audit_logout_reason` | Adds `LOGOUT_REASON` to `user_login_audit`. This is the former `scripts/add-user-login-audit-logout-reason.sql`, which had never been applied — now the first tracked change. |
| `0003` | `org_profile` | Active-organization profile (roadmap 0.2): a single settings row (name, code, logo, locale, enabled modules, colours, contact) seeded from the current branding. Backend loads it at startup and serves it at `GET /api/org-profile`; frontend overlays it onto `companyBrand.js`. Falls back to built-in defaults if absent, so it's non-breaking. |
| `0004` | `app_config` | Centralized config store (roadmap 0.3): key/value table of runtime-editable business settings read via `src/config/configService.js` (resolves DB → `.env` → default, cached + hot-reloaded). Seeded empty, so every lookup still falls back to `.env` until settings are added via `PUT /api/config/:key`. Secrets stay in `.env`. |

## Relationship to the old `scripts/*.sql`

- The DDL from `scripts/acuity-tables.sql` / `scripts/run-acuity-setup.sql` was
  already present in the live database, so it is **folded into the `0001`
  baseline** — do not run those by hand anymore.
- `scripts/add-user-login-audit-logout-reason.sql` is now **migration `0002`**.
- `scripts/admin-overview-crosscheck.sql` is not schema DDL (read-only
  verification `SELECT`s) and is left as-is.

Going forward, **all schema changes go through a numbered migration here** — no
more ad-hoc SQL run by hand.

## Applying the baseline to a brand-new environment

On a fresh, empty database, `npm run migrate` builds the entire schema from
`0001` and then applies everything after it. On an existing database that
already has the tables, `0001` is a no-op that simply registers the baseline in
`schema_migrations`; subsequent migrations then apply normally.
