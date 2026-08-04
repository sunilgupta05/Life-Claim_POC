// src/db/dialects/oracle.js
//
// Oracle dialect — INTENTIONAL STUB.
//
// This file exists to document the seam the migration engine leaves open for a
// future Oracle target (see the "DB portability" note in the modernization
// roadmap). It is NOT implemented: DB_DIALECT=oracle will throw a clear error
// until someone fills it in. Keeping the shape here makes the cost of that work
// visible and keeps the engine honest about being dialect-agnostic.
//
// To implement:
//   1. npm install oracledb
//   2. Mirror the method contract in ./mysql.js:
//        connect(), close(), query(sql, params), exec(sqlBlock),
//        ensureMetaTable(), getApplied(), recordApplied(), removeApplied()
//   3. Translate the specifics:
//        - placeholders `?`            -> `:1, :2, ...`
//        - NOW()                       -> SYSTIMESTAMP
//        - CREATE TABLE IF NOT EXISTS  -> PL/SQL EXISTS guard or catch ORA-00955
//        - SET FOREIGN_KEY_CHECKS      -> ALTER TABLE ... DISABLE CONSTRAINT
//        - multi-statement exec        -> split on `;` / `/` and loop
//   4. Author future migration files in neutral SQL (avoid backtick idents and
//      MySQL-only constructs) so the same .sql runs on both engines. The
//      0001 baseline is a faithful MySQL dump and would need an Oracle variant.

class OracleDialect {
  constructor(config) {
    this.name = 'oracle';
    this.config = config;
    this.metaTable = 'schema_migrations';
  }

  _notImplemented() {
    throw new Error(
      "Oracle dialect is not implemented yet. Set DB_DIALECT=mysql, or implement " +
      "src/db/dialects/oracle.js following the contract in mysql.js."
    );
  }

  async connect() { this._notImplemented(); }
  async close() {}
  async query() { this._notImplemented(); }
  async exec() { this._notImplemented(); }
  async ensureMetaTable() { this._notImplemented(); }
  async getApplied() { this._notImplemented(); }
  async recordApplied() { this._notImplemented(); }
  async removeApplied() { this._notImplemented(); }
}

module.exports = OracleDialect;
