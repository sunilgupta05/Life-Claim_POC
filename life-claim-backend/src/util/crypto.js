// src/util/crypto.js
//
// Application-level field encryption for PII at rest (roadmap 4.6). AES-256-GCM
// (authenticated encryption) for the most sensitive claim fields — Aadhaar, PAN,
// bank account — so they are ciphertext in the database even if the DB is dumped.
//
// The key comes from the secrets provider (PII_ENCRYPTION_KEY): a 32-byte key as
// base64 or hex, or any passphrase (derived to 32 bytes via SHA-256). Rotate by
// introducing a new key id; tokens are self-describing (`enc:v1:<keyId>:...`).
//
// Tokens: `enc:v1:<keyId>:<iv_b64>:<tag_b64>:<ciphertext_b64>`. decrypt() returns
// the plaintext; if encryption is not configured (no key), encrypt() returns the
// plaintext unchanged and decrypt() passes through — so this is safe to adopt
// incrementally and never loses data.

const crypto = require('crypto');
const secrets = require('../config/secrets');
const logger = require('./logger');

const PREFIX = 'enc:v1:';
const ALGO = 'aes-256-gcm';

/** Resolve the 32-byte key + a short key id, or null when unconfigured. */
function resolveKey() {
  const raw = secrets.get('PII_ENCRYPTION_KEY');
  if (!raw) return null;
  let key;
  // Accept base64 (44 chars), hex (64 chars), or derive from a passphrase.
  if (/^[A-Fa-f0-9]{64}$/.test(raw)) key = Buffer.from(raw, 'hex');
  else {
    const b = Buffer.from(raw, 'base64');
    key = b.length === 32 ? b : crypto.createHash('sha256').update(raw).digest();
  }
  const keyId = secrets.get('PII_ENCRYPTION_KEY_ID', 'k1');
  return { key, keyId };
}

function isEnabled() {
  return resolveKey() !== null;
}

function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/** Encrypt a string. No-op (returns input) when no key is configured or value is empty. */
function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') return plaintext;
  if (isEncrypted(plaintext)) return plaintext; // already encrypted
  const k = resolveKey();
  if (!k) return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, k.key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${k.keyId}:${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

/** Decrypt a token produced by encrypt(). Passes through non-tokens. */
function decrypt(token) {
  if (!isEncrypted(token)) return token;
  const k = resolveKey();
  if (!k) {
    logger.error('[crypto] encountered encrypted value but PII_ENCRYPTION_KEY is not set');
    return token;
  }
  // token = enc:v1:<keyId>:<iv>:<tag>:<ct>
  const parts = token.split(':');
  // parts[0]='enc' parts[1]='v1' parts[2]=keyId parts[3]=iv parts[4]=tag parts[5]=ct
  const iv = Buffer.from(parts[3], 'base64');
  const tag = Buffer.from(parts[4], 'base64');
  const ct = Buffer.from(parts[5], 'base64');
  const decipher = crypto.createDecipheriv(ALGO, k.key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}

/** Encrypt named fields on a shallow object (returns a copy). */
function encryptFields(obj, fields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };
  for (const f of fields) if (f in out) out[f] = encrypt(out[f]);
  return out;
}

/** Decrypt named fields on a shallow object (returns a copy). */
function decryptFields(obj, fields = []) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };
  for (const f of fields) if (f in out) out[f] = decrypt(out[f]);
  return out;
}

/** Generate a fresh 32-byte key (base64) — for `openssl rand -base64 32` parity. */
function generateKey() {
  return crypto.randomBytes(32).toString('base64');
}

module.exports = {
  encrypt, decrypt, isEncrypted, isEnabled, encryptFields, decryptFields, generateKey,
};
