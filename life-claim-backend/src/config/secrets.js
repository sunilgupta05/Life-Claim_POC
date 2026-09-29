// src/config/secrets.js
//
// Secrets provider abstraction (roadmap 4.5). One accessor — secrets.get(name) —
// backed by a pluggable provider selected by SECRETS_PROVIDER:
//
//   env   (default) — read process.env (i.e. .env). Behaviour identical to today.
//   file            — read Docker/Kubernetes secrets mounted as files: either a
//                     directory of one-file-per-secret (SECRETS_DIR) or a single
//                     JSON file (SECRETS_FILE).
//   vault           — HashiCorp Vault KV v2 (lazy-requires `node-vault`).
//   aws             — AWS Secrets Manager (lazy-requires @aws-sdk/client-secrets-manager).
//
// The point: production moves secrets OUT of .env into a vault/KMS without any code
// change — call sites read `secrets.get('DB_PASSWORD')` instead of
// `process.env.DB_PASSWORD`, and the provider decides where it comes from.
//
// get() is synchronous and always falls back to process.env then the default, so
// it works before init() (env provider needs no init). init() pre-warms the cache
// for the file/vault/aws providers; it is best-effort and never throws.

const fs = require('fs');
const path = require('path');
const logger = require('../util/logger');

const cache = new Map(); // name -> value
let provider = (process.env.SECRETS_PROVIDER || 'env').toLowerCase();
let ready = provider === 'env';

/** Sensitive keys the app uses — documented for auditing / vault seeding. */
const KNOWN_SECRETS = [
  'DB_PASSWORD', 'JWT_SECRET', 'SESSION_SECRET', 'RULES_ENGINE_API_KEY', 'INTERNAL_API_KEY',
  'DMS_USER_ID', 'DMS_PASSWORD', 'EMAIL_ID', 'EMAIL_PASS', 'RECAPTCHA_SECRET',
  'KEYCLOAK_CLIENT_SECRET', 'RABBITMQ_PASS', 'REDIS_PASSWORD',
];

/** Read one secret: cache (file/vault/aws) → process.env → default. */
function get(name, defaultValue = undefined) {
  if (cache.has(name)) {
    const v = cache.get(name);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  const env = process.env[name];
  if (env !== undefined && env !== '') return env;
  return defaultValue;
}

function has(name) {
  return get(name) !== undefined;
}

// ---- providers -------------------------------------------------------------

function loadFromDir(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    try {
      if (fs.statSync(full).isFile()) cache.set(f, fs.readFileSync(full, 'utf8').trim());
    } catch { /* skip */ }
  }
}

function loadFromFile(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const [k, v] of Object.entries(raw)) cache.set(k, String(v));
}

async function loadFromVault() {
  // eslint-disable-next-line global-require, import/no-unresolved
  const vault = require('node-vault')({
    endpoint: process.env.VAULT_ADDR,
    token: process.env.VAULT_TOKEN,
  });
  const mount = process.env.VAULT_KV_MOUNT || 'secret';
  const p = process.env.VAULT_SECRET_PATH || 'life-claim';
  const res = await vault.read(`${mount}/data/${p}`); // KV v2
  const data = res?.data?.data || {};
  for (const [k, v] of Object.entries(data)) cache.set(k, String(v));
}

async function loadFromAws() {
  // eslint-disable-next-line global-require, import/no-unresolved
  const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const id = process.env.AWS_SECRET_ID || 'life-claim';
  const out = await client.send(new GetSecretValueCommand({ SecretId: id }));
  const data = JSON.parse(out.SecretString || '{}');
  for (const [k, v] of Object.entries(data)) cache.set(k, String(v));
}

/**
 * Pre-warm the cache for non-env providers. Best-effort: on any failure we log and
 * fall back to process.env, so a misconfigured vault never takes the app down.
 */
async function init() {
  try {
    if (provider === 'file') {
      if (process.env.SECRETS_DIR && fs.existsSync(process.env.SECRETS_DIR)) loadFromDir(process.env.SECRETS_DIR);
      else if (process.env.SECRETS_FILE && fs.existsSync(process.env.SECRETS_FILE)) loadFromFile(process.env.SECRETS_FILE);
      else throw new Error('SECRETS_DIR or SECRETS_FILE must point at an existing path');
    } else if (provider === 'vault') {
      await loadFromVault();
    } else if (provider === 'aws') {
      await loadFromAws();
    }
    ready = true;
    if (provider !== 'env') logger.info(`[secrets] provider "${provider}" loaded ${cache.size} secret(s)`);
    return cache.size;
  } catch (err) {
    ready = true; // env fallback still works
    logger.error(`[secrets] provider "${provider}" init failed, falling back to .env: ${err?.message}`);
    return 0;
  }
}

function status() {
  return { provider, ready, loaded: cache.size, knownSecrets: KNOWN_SECRETS.length };
}

module.exports = { get, has, init, status, provider: () => provider, KNOWN_SECRETS };
