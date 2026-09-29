// src/config/settingsCatalog.js
//
// Curated catalog of the runtime-editable settings the IT Admin console (3.5)
// exposes as a friendly grouped form — integration URLs, timeouts/resilience,
// and logging. Each entry has a stable config key (edited via the config service,
// DB→env→default, hot-reload), a label/help, a type, and a default.
//
// This is an allow-list: only these keys are editable through the IT Admin
// settings screen. The raw /api/config endpoint (superuser) still exists for
// anything outside the catalog.

const SETTINGS = [
  // ---- Integration endpoints (also drives 3.2 runtime-editable URLs) --------
  { key: 'TXN_API_BASE_URL', group: 'Integration URLs', label: 'Transaction API base URL', type: 'string', default: 'http://localhost:3003', help: 'Life Asia policy search service.' },
  { key: 'DOCUMENT_VIEWER_IP', group: 'Integration URLs', label: 'Alfresco DMS host', type: 'string', default: '192.168.60.63:8080', help: 'host:port of the Alfresco document store.' },
  { key: 'WHATSAPP_API_URL', group: 'Integration URLs', label: 'WhatsApp gateway URL', type: 'string', default: 'http://192.168.60.62:3002/api/v1/', help: 'Outbound WhatsApp notification gateway.' },
  { key: 'RABBITMQ_URL', group: 'Integration URLs', label: 'RabbitMQ URL', type: 'string', default: '', help: 'amqp(s)://… broker, or the management URL.' },
  { key: 'RULES_ENGINE_URL', group: 'Integration URLs', label: 'Rules engine URL', type: 'string', default: 'http://localhost:8095', help: 'Drools ADD-exclusion service.' },
  { key: 'RULES_ENGINE_ENABLED', group: 'Integration URLs', label: 'Rules engine enabled', type: 'boolean', default: 'true', help: 'Call the Drools engine during ADD assessment.' },
  { key: 'KEYCLOAK_URL', group: 'Integration URLs', label: 'Keycloak URL', type: 'string', default: 'http://localhost:8081', help: 'Identity provider base URL.' },

  // ---- Timeouts & resilience (3.1) -----------------------------------------
  { key: 'INTEGRATION_TIMEOUT_MS', group: 'Timeouts & Resilience', label: 'Default timeout (ms)', type: 'number', default: '10000', help: 'Applies to every integration unless overridden.' },
  { key: 'INTEGRATION_RETRIES', group: 'Timeouts & Resilience', label: 'Retry attempts', type: 'number', default: '2', help: 'Retries on transient failures (network/timeout/5xx).' },
  { key: 'INTEGRATION_RETRY_BASE_MS', group: 'Timeouts & Resilience', label: 'Retry backoff base (ms)', type: 'number', default: '300', help: 'Exponential backoff base: 300, 600, 1200…' },
  { key: 'INTEGRATION_BREAKER_ERROR_PCT', group: 'Timeouts & Resilience', label: 'Breaker error threshold (%)', type: 'number', default: '50', help: 'Failure % over the window that opens the breaker.' },
  { key: 'INTEGRATION_BREAKER_RESET_MS', group: 'Timeouts & Resilience', label: 'Breaker reset (ms)', type: 'number', default: '30000', help: 'How long the breaker stays open before probing.' },
  { key: 'ALFRESCO_TIMEOUT_MS', group: 'Timeouts & Resilience', label: 'Alfresco timeout (ms)', type: 'number', default: '15000', help: 'Per-call timeout override for Alfresco.' },
  { key: 'TRANSACTION_API_TIMEOUT_MS', group: 'Timeouts & Resilience', label: 'Transaction API timeout (ms)', type: 'number', default: '10000', help: 'Per-call timeout override for the Transaction API.' },

  // ---- Logging (3.4) --------------------------------------------------------
  { key: 'LOG_LEVEL', group: 'Logging', label: 'Log level', type: 'enum', options: ['fatal', 'error', 'warn', 'info', 'http', 'debug', 'trace'], default: 'info', help: 'Minimum severity written. Applies live.' },
  { key: 'LOG_MAX_SIZE', group: 'Logging', label: 'Log file max size', type: 'string', default: '20m', help: 'Rotate when a file reaches this size (e.g. 20m).' },
  { key: 'LOG_MAX_FILES', group: 'Logging', label: 'Log retention', type: 'string', default: '14d', help: 'Keep rotated logs for this long (e.g. 14d) or count.' },
];

const BY_KEY = Object.fromEntries(SETTINGS.map((s) => [s.key, s]));

module.exports = { SETTINGS, BY_KEY };
