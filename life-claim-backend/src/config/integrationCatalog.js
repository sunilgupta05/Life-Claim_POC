// src/config/integrationCatalog.js
//
// Single source of truth for the external integrations the system depends on
// (roadmap 3.2). Each entry ties together:
//   - the human label + what it's used for,
//   - the circuit-breaker name registered by the resilience layer (3.1),
//   - how to resolve its current endpoint from the config service (DB→env→default),
//   - which config keys are runtime-editable (surfaced by the IT Admin console, 3.5),
//   - its timeout config key.
//
// The /health/integrations endpoint joins this catalog with live breaker state;
// the IT Admin settings screen edits the `urlKeys`/`timeoutKey` at runtime.

const appConfig = require('./configService');

/** Resolve a URL-ish endpoint for display from the first non-empty key. */
function resolveEndpoint(keys, fallback) {
  for (const k of keys) {
    const v = appConfig.get(k);
    if (v) return v;
  }
  return fallback;
}

const CATALOG = [
  {
    id: 'transaction-api',
    breaker: 'transaction-api',
    label: 'Transaction API (Life Asia)',
    usedFor: 'Policy search, registration & CAPS enrichment',
    urlKeys: ['TXN_API_BASE_URL'],
    timeoutKey: 'TRANSACTION_API_TIMEOUT_MS',
    fallback: 'http://localhost:3003',
    critical: true,
  },
  {
    id: 'alfresco',
    breaker: 'alfresco',
    label: 'Alfresco DMS',
    usedFor: 'Document upload & preview (via backend proxy)',
    urlKeys: ['DOCUMENT_VIEWER_IP'],
    timeoutKey: 'ALFRESCO_TIMEOUT_MS',
    fallback: '192.168.60.63:8080',
    critical: false,
  },
  {
    id: 'whatsapp',
    breaker: 'whatsapp',
    label: 'WhatsApp gateway',
    usedFor: 'Registration / status / payout notifications',
    urlKeys: ['WHATSAPP_API_URL'],
    timeoutKey: 'WHATSAPP_TIMEOUT_MS',
    fallback: 'http://192.168.60.62:3002/api/v1/',
    critical: false,
  },
  {
    id: 'rabbitmq',
    breaker: 'rabbitmq',
    label: 'RabbitMQ + worker',
    usedFor: 'Queued notifications (assign, decisions, payout)',
    urlKeys: ['RABBITMQ_URL'],
    timeoutKey: 'RABBITMQ_TIMEOUT_MS',
    fallback: 'amqp://192.168.60.62:5672',
    critical: false,
  },
  {
    id: 'rules-engine',
    breaker: 'rules-engine',
    label: 'Rules engine (Drools)',
    usedFor: 'ADD accidental-death exclusion evaluation',
    urlKeys: ['RULES_ENGINE_URL'],
    timeoutKey: 'RULES_ENGINE_TIMEOUT_MS',
    fallback: 'http://localhost:8095',
    critical: false,
  },
  {
    id: 'keycloak',
    breaker: null, // auth path is not wrapped by the resilience layer
    label: 'Keycloak',
    usedFor: 'Login, realm roles, API bearer protection',
    urlKeys: ['KEYCLOAK_URL'],
    timeoutKey: null,
    fallback: 'http://localhost:8081',
    critical: true,
  },
];

/** Catalog joined with the current resolved endpoint + timeout for display. */
function describe() {
  return CATALOG.map((c) => ({
    id: c.id,
    breaker: c.breaker,
    label: c.label,
    usedFor: c.usedFor,
    critical: c.critical,
    endpoint: resolveEndpoint(c.urlKeys, c.fallback),
    urlKeys: c.urlKeys,
    timeoutKey: c.timeoutKey,
    timeoutMs: c.timeoutKey ? appConfig.getNumber(c.timeoutKey, undefined) : undefined,
  }));
}

module.exports = { CATALOG, describe, resolveEndpoint };
