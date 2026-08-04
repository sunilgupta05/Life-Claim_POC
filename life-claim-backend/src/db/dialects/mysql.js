// src/db/dialects/mysql.js
//
// MySQL implementation of the migration dialect contract.
//
// A "dialect" isolates every database-specific concern the migration engine
// touches — connection handling, the shape of the schema_migrations tracking
// table, and the CRUD SQL used to record applied migrations. The engine
// (src/db/migrator.js) talks only to this contract, never to mysql2 directly,
// so a future Oracle (or Postgres) target is a matter of adding a sibling file
// under this folder — no changes to the engine or the migration files.

const mysql = require('mysql2/promise');

const META_TABLE = 'schema_migrations';

class MySqlDialect {
  constructor(config) {
    this.name = 'mysql';
    this.config = config;
    this.metaTable = META_TABLE;
    this.conn = null;
  }

  async connect() {
    this.conn = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port || 3306,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      // required so a whole migration file (many DDL/DML statements) can be
      // sent in one round-trip via exec()
      multipleStatements: true,
      connectTimeout: 15000,
    });
    return this;
  }

  async close() {
    if (this.conn) {
      await this.conn.end();
      this.conn = null;
    }
  }

  // Parameterized query returning rows. Uses `?` placeholders.
  async query(sql, params = []) {
    const [rows] = await this.conn.query(sql, params);
    return rows;
  }

  // Run an arbitrary block of one-or-more statements (a migration's UP/DOWN).
  // MySQL DDL is not transactional (each DDL auto-commits), so the engine
  // relies on idempotent, guarded SQL rather than a rollback of the block.
  async exec(sqlBlock) {
    // FK checks are toggled off around the block so tables can be created or
    // dropped regardless of declaration order.
    await this.conn.query('SET FOREIGN_KEY_CHECKS = 0');
    try {
      await this.conn.query(sqlBlock);
    } finally {
      await this.conn.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  }

  // Create the tracking table if absent. Types are deliberately conservative
  // (VARCHAR / DATETIME / INT) so the concept ports cleanly to other engines.
  async ensureMetaTable() {
    await this.conn.query(
      `CREATE TABLE IF NOT EXISTS \`${this.metaTable}\` (
         name          VARCHAR(255) NOT NULL,
         version       VARCHAR(64)  NOT NULL,
         checksum      VARCHAR(64)  NOT NULL,
         applied_at    DATETIME     NOT NULL,
         execution_ms  INT          NOT NULL DEFAULT 0,
         PRIMARY KEY (name)
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
    );
  }

  // Applied migrations, oldest first.
  async getApplied() {
    return this.query(
      `SELECT name, version, checksum, applied_at, execution_ms
         FROM \`${this.metaTable}\` ORDER BY name ASC`
    );
  }

  async recordApplied(name, version, checksum, executionMs) {
    await this.query(
      `INSERT INTO \`${this.metaTable}\` (name, version, checksum, applied_at, execution_ms)
       VALUES (?, ?, ?, NOW(), ?)`,
      [name, version, checksum, executionMs]
    );
  }

  async removeApplied(name) {
    await this.query(`DELETE FROM \`${this.metaTable}\` WHERE name = ?`, [name]);
  }
}

module.exports = MySqlDialect;
