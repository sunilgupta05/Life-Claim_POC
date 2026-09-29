# Security Review, PII Handling & Retention (roadmap 4.6)

A security pass for the Life Claims system, the PII inventory, and data-retention
policy. Claims data is highly sensitive; treat every field below as confidential.

## Controls in place

| Area | Control | Where |
|------|---------|-------|
| Transport | HTTPS default; HSTS; HTTPS-only auth in prod (`REQUIRE_HTTPS_AUTH`) | `app.js`, `server.js` |
| AuthN | Keycloak/JWT, default-deny `/api` gate, pluggable providers (1.4) | `requireApiAuth`, `authMiddleware` |
| AuthZ | Dynamic RBAC + `requirePermission` on every route (1.1/1.2) | `middleware/requirePermission` |
| Headers | Helmet CSP (Keycloak+CORS origins), noSniff, frameguard, Permissions-Policy | `app.js` |
| CORS | Strict allow-list, wildcard rejected | `app.js` |
| Injection | Parameterized SQL (mysql2 placeholders), path-traversal blocker | DAOs, `app.js` |
| Rate limiting | `apiLimiter` on `/api` | `middleware/rateLimiters` |
| Uploads | Content-signature validation, MIME allow-list, size cap (Alfresco) | `documentUploadController` |
| Secrets | Provider abstraction (env/file/vault/KMS), never in the DB config store (4.5) | `config/secrets.js` |
| Segmentation | Internal-only guard + exposure audit (3.7) | `requireInternal`, `exposureAudit` |
| Errors | Central handler hides 5xx internals; correlation ids (3.3) | `middleware/errorHandler` |
| Observability | Metrics internal-only; logs rotate; PII must be masked in logs | 4.3 / 4.6 |

## PII inventory

| Category | Example fields (wizard data keys) | Masker |
|----------|-----------------------------------|--------|
| Name | `claimantName`, `laName`, nominee/payee names | `maskName` |
| Contact | `email`/`laEmailId`, `mobileNo`/`laMobileNo` | `maskEmail`, `maskMobile` |
| Government ID | Aadhaar, `panNo`, `laIdNumber` | `maskAadhaar`, `maskPan` |
| Financial | bank account, payout amounts | `maskAccount` |
| Health/cause | cause of death, medical/PM/FIR docs | treat as confidential; don't log |

## Masking usage (4.6)

Use `src/util/pii.js` whenever PII could leak into a lower-trust sink:

```js
const pii = require('./util/pii');
logger.info('registration payload', pii.redact(payload));   // masks name/email/mobile/pan/account
maskMobile(mobileNo);                                        // e.g. WhatsApp logs
```

`redact(obj)` deep-copies and masks by key name; extend with `{ extraKeys }` for
domain-specific fields. **Never** log full request bodies or claim payloads unmasked.

## Data retention (4.6)

`src/services/dataRetentionService.js` purges rows past a retention window from a
vetted table allow-list. **Off and dry-run by default** — enable per deployment:

| Key | Default | Meaning |
|-----|---------|---------|
| `RETENTION_ENABLED` | `false` | Master switch. |
| `RETENTION_DRY_RUN` | `true` | Count + log only; no deletes. Flip to `false` to purge. |
| `DATA_RETENTION_DAYS` | `365` | Global default window. |
| `AUDIT_LOG_RETENTION_DAYS` | (global) | Per-table override for `user_login_audit`. |
| `RETENTION_INTERVAL_MS` | `86400000` | Scheduler cadence (daily). |

Add tables to `POLICIES` (with their date column) as retention requirements are
finalized with the client. Only allow-listed tables are ever touched.

## Review checklist / recommendations

- [ ] Rotate all default/dev secrets (`RULES_ENGINE_API_KEY=dev-only-change-me`, session/JWT secrets) before go-live; move to a vault (4.5).
- [ ] Set `CORS_ALLOWED_ORIGINS`, `REQUIRE_HTTPS_AUTH=true`, `API_DOCS_ENABLED=false`, `EXPOSE_ERROR_DETAIL=false` in production.
- [ ] Confirm MySQL/RabbitMQ/Alfresco/Redis are on a private network (see [SERVICE_EXPOSURE.md](SERVICE_EXPOSURE.md)); set `INTERNAL_API_KEY`.
- [ ] Enable retention with the client's agreed windows; verify dry-run counts first.
- [ ] Audit that no controller logs unmasked PII (search `logger.*(.*payload|.*data\b)` and wrap with `pii.redact`).
- [ ] Run `npm run test:e2e-security`; schedule dependency scanning (`npm audit`) in CI.
- [ ] Encrypt PII at rest — **application-level column encryption is available** (`src/util/crypto.js`, AES-256-GCM). Set `PII_ENCRYPTION_KEY` (32-byte, `openssl rand -base64 32`) via the secrets provider and wrap Aadhaar/PAN/account fields with `encryptFields()` on write / `decryptFields()` on read. Complement with DB-level TDE per compliance.

## PII encryption at rest (4.6)

`src/util/crypto.js` provides authenticated field encryption (AES-256-GCM):

```js
const { encryptFields, decryptFields } = require('./util/crypto');
// on write to the DAO:
row = encryptFields(row, ['aadhaar', 'panNo', 'bankAccount']);
// on read:
row = decryptFields(row, ['aadhaar', 'panNo', 'bankAccount']);
```

- Key from the secrets provider: `PII_ENCRYPTION_KEY` (base64/hex/passphrase), optional `PII_ENCRYPTION_KEY_ID` for rotation. Generate one with `require('./util/crypto').generateKey()` or `openssl rand -base64 32`.
- Tokens are self-describing (`enc:v1:<keyId>:…`) and tamper-evident (GCM auth tag).
- **Safe to adopt incrementally:** with no key configured, encrypt/decrypt are pass-throughs — no data loss; already-encrypted values aren't double-encrypted.

