// src/db/dialects/index.js
//
// Dialect factory. Resolves DB_DIALECT (default: mysql) to a dialect
// implementation. Add new engines by dropping a sibling file here and
// registering it in the map below.

const MySqlDialect = require('./mysql');
const OracleDialect = require('./oracle');

const REGISTRY = {
  mysql: MySqlDialect,
  oracle: OracleDialect,
};

/**
 * @param {string} name   dialect key (mysql | oracle)
 * @param {object} config { host, port, user, password, database }
 */
function getDialect(name, config) {
  const key = String(name || 'mysql').toLowerCase();
  const Dialect = REGISTRY[key];
  if (!Dialect) {
    throw new Error(
      `Unknown DB_DIALECT "${name}". Supported: ${Object.keys(REGISTRY).join(', ')}.`
    );
  }
  return new Dialect(config);
}

module.exports = { getDialect, supported: Object.keys(REGISTRY) };
