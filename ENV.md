# Environment configuration (v2 POC)

Both apps read **`.env` in their own folder** (already committed locally for this workspace). Restart after any change.

## Pairing checklist

| Purpose | Frontend (`life-claim-frontend/.env`) | Backend (`life-claim-backend/.env`) |
|--------|----------------------------------------|----------------------------------------|
| API / proxy | `VITE_PROXY_TARGET=https://192.168.60.62:3010` | `PORT=3010`, `USE_HTTPS=true` |
| Drools rules | — | `RULES_ENGINE_URL=http://localhost:8095`, `RULES_ENGINE_ENABLED=true`, `RULES_ENGINE_API_KEY=…` (must match `life-claim-rules`'s `RULES_ENGINE_API_KEY`; defaults to a dev-only value on both sides if unset — set a real shared secret in production) |
| Idle logout | `VITE_IDLE_TIMEOUT_MINUTES=5` | `SESSION_IDLE_TIMEOUT_MINUTES=5` |
| Session store + config bus | — | `REDIS_URL=redis://localhost:6379` (multi-instance PROD: Redis-backed session store **and** cross-instance config hot-reload bus; falls back to in-memory sessions + TTL-only config refresh if unset) |
| reCAPTCHA | `VITE_RECAPTCHA_SITE_KEY=…La0QUjc…` (site) | `RECAPTCHA_SECRET_KEY=…RyWFweBE` (secret) |
| Keycloak | `VITE_KEYCLOAK_URL=http://localhost:8081` | `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID` |
| SIT bypass | `VITE_ENVIRONMENT=SIT`, `VITE_CAPTCHA_OPTIONAL=true` | `ENVIRONMENT=SIT` |
| Single session | `VITE_SESSION_CHECK_INTERVAL_MS=90000` | `SINGLE_SESSION_ENFORCED=false` (set `true` to enforce) |
| CORS | (dev uses Vite proxy) | `CORS_ALLOWED_ORIGINS` includes `:5174` and `:3010` |
| Auth method | — | `AUTH_METHOD` (default `hybrid`) — see below |

## Pluggable authentication (`AUTH_METHOD` — roadmap 1.4)

`AUTH_METHOD` (backend, via the config service → DB/`.env`/default) selects the login method without
code changes. **Default `hybrid` = the existing behaviour** (Keycloak password-grant login + per-request
auto-detect of a Keycloak token or local JWT); leaving it unset changes nothing. Per-request
verification is unchanged for every method — external IdPs validate at login and the server mints a
local JWT.

| `AUTH_METHOD` | Login | Extra config |
|---|---|---|
| `hybrid` *(default)* | Keycloak proxy + local JWT auto-detect | `KEYCLOAK_URL`, … (as today) |
| `keycloak` | Keycloak only | `KEYCLOAK_URL` |
| `local` | `users` table (bcrypt) → local JWT | `JWT_SECRET`, `JWT_EXPIRES_IN` |
| `ldap` | LDAP bind+search → local JWT | `LDAP_URL`, `LDAP_SEARCH_BASE`, `LDAP_SEARCH_FILTER`, `LDAP_BIND_DN`, `LDAP_BIND_PASSWORD` (secret), `LDAP_ROLE_ATTRIBUTE`, `LDAP_ROLE_MAP` (JSON), `LDAP_DEFAULT_ROLES` (JSON); needs `npm i ldapts` |
| `oidc` | OIDC resource-owner-password → local JWT | `OIDC_ISSUER` or `OIDC_TOKEN_ENDPOINT`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` (secret), `OIDC_SCOPE`, `OIDC_USERNAME_CLAIM`, `OIDC_ROLE_CLAIM`, `OIDC_ROLE_MAP` (JSON), `OIDC_DEFAULT_ROLES` (JSON) |
| `saml` | Browser SSO (redirect + ACS) | `SAML_ENABLED=true`, `SAML_ENTRY_POINT`, `SAML_ISSUER`, `SAML_CALLBACK_URL`, `SAML_IDP_CERT` (secret), `SAML_ROLE_ATTRIBUTE`, `SAML_ROLE_MAP`/`SAML_DEFAULT_ROLES`; needs `npm i @node-saml/node-saml` |

- Secrets (`*_PASSWORD`, `*_SECRET`, `SAML_IDP_CERT`, `JWT_SECRET`) stay in `.env`, never the DB.
- `ldap`/`oidc`/`saml` map an IdP group/claim → app roles via the `*_ROLE_MAP` JSON (`{ "idpGroup": ["AppRole"] }`) with an optional `*_DEFAULT_ROLES`.
- **Status:** all methods are implemented and unit-tested (LDAP/OIDC/SAML providers are driven through success + failure + misconfig paths with their IdP libraries mocked). `ldapts` and `@node-saml/node-saml` are now regular dependencies (install by default); OIDC uses `axios`. SAML stays behind `SAML_ENABLED=true` as a safety gate. **Per-IdP config must still be validated against the target directory/IdP** — see the deploy checklist below.
- Endpoints: `GET /api/auth/methods` (reports `{ method, redirect, formLogin }`), `GET /api/auth/sso/login` (IdP redirect), `POST /api/auth/sso/callback` (assertion consumer). The frontend login page reads `/methods` and shows a **Single Sign-On** button automatically when a redirect method is active; the password form is unchanged for the default `hybrid` and other form methods.

### Deploy checklist for an external method (validate in the target environment)
1. Set `AUTH_METHOD` and the per-method keys above; put secrets in `.env`, not the DB.
2. **LDAP:** confirm `LDAP_SEARCH_FILTER` matches the directory's username attribute (`uid` vs `sAMAccountName`), that `LDAP_ROLE_ATTRIBUTE` (`memberOf`) returns the expected group DNs, and fill `LDAP_ROLE_MAP` with those exact DNs. Test a real bind for one user per role.
3. **OIDC:** verify discovery at `${OIDC_ISSUER}/.well-known/openid-configuration`, that the provider allows the resource-owner-password grant for the client, and that `OIDC_ROLE_CLAIM` (e.g. `groups` or `realm_access.roles`) is present in the issued token; map those values in `OIDC_ROLE_MAP`.
4. **SAML:** register the SP (`SAML_ISSUER`, ACS = `SAML_CALLBACK_URL`) with the IdP, load the IdP signing cert into `SAML_IDP_CERT`, set `SAML_ROLE_ATTRIBUTE` to the assertion attribute carrying groups, then `SAML_ENABLED=true`. Test the full redirect round-trip.
5. Confirm a logged-in external user resolves the intended app roles (`GET /api/rbac/my-permissions`) and that the RBAC guards (1.2) behave as expected.

## Section B (navigation)

- v2 uses **one shell** (`AppLayout`) — not a separate v1 `AdminLayout`.
- Admin-only login lands on **`/admin`**; operational users on **`/dashboard`**.
- v1 aliases: `/admin-reports`, `/assessor-pool`, `/user-manager` → v2 routes.

## Section K (integrations)

See **`docs/INTEGRATIONS.md`** for Keycloak, MySQL, Transaction API, Alfresco, WhatsApp, RabbitMQ, and worker checklist. Admin overview UI shows a short dependency table.

### Integration resilience (roadmap 3.1)

Every outbound integration (Transaction API, WhatsApp, Alfresco/DMS, RabbitMQ, rules engine) is fronted by a shared wrapper — **timeout + retry/backoff + circuit breaker** (`src/util/resilience.js`, using `opossum`). A dead dependency now **fails fast** instead of hanging a request/worker, and repeated failures trip the breaker until it recovers. Happy-path behaviour is unchanged.

Config keys are read via the config service (**DB → `.env` → default**), so they hot-reload without a restart. Global defaults apply to all integrations; add a `<NAME>_` prefix to override one (names: `TRANSACTION_API`, `WHATSAPP`, `ALFRESCO`, `RABBITMQ`, `RULES_ENGINE`).

| Key | Default | Meaning |
|-----|---------|---------|
| `INTEGRATION_TIMEOUT_MS` | `10000` | Per-call timeout (ms) before the call is aborted. |
| `INTEGRATION_RETRIES` | `2` | Retry attempts on **transient** failures (network/timeout/5xx). 4xx and open-breaker are never retried. |
| `INTEGRATION_RETRY_BASE_MS` | `300` | Exponential-backoff base: `300, 600, 1200…`. |
| `INTEGRATION_BREAKER_ERROR_PCT` | `50` | Failure % (over the rolling window) that opens the breaker. |
| `INTEGRATION_BREAKER_RESET_MS` | `30000` | How long the breaker stays open before probing (half-open). |
| `INTEGRATION_BREAKER_VOLUME` | `5` | Minimum calls in the window before the breaker can open. |

Per-integration override examples: `TRANSACTION_API_TIMEOUT_MS`, `WHATSAPP_TIMEOUT_MS`, `ALFRESCO_TIMEOUT_MS` (default `15000`), `RABBITMQ_TIMEOUT_MS`, `RULES_ENGINE_TIMEOUT_MS`. The Alfresco document **upload** POST runs with retries disabled (it streams a body / creates a resource — not safe to replay).

### Integration health & IT Admin console (roadmap 3.2 / 3.5)

- **Health probes** (public, no auth, before the rate limiter): `GET /api/health` (liveness), `GET /api/health/ready` (DB + config readiness). For load balancers / uptime checks.
- **Integration dashboard** (superuser): `GET /api/health/integrations` — per-integration endpoint + circuit-breaker state/stats. Frontend screen: **Integration Health** (`/superuser/health`), auto-refreshing.
- **System Settings** (superuser): `GET/PUT/DELETE /api/settings` — a curated, grouped view over the config service for **integration URLs, timeouts/resilience and the log level**. Frontend screen: **System Settings** (`/superuser/settings`). Edits hot-reload immediately (no restart). Editable URL keys: `TXN_API_BASE_URL`, `DOCUMENT_VIEWER_IP`, `WHATSAPP_API_URL`, `RABBITMQ_URL`, `RULES_ENGINE_URL`, `KEYCLOAK_URL`. Both screens are registered as toggleable modules by migration `0011`.

### Correlation IDs & centralized errors (roadmap 3.3)

Every request gets a correlation id (honouring an inbound `X-Request-Id` / `X-Correlation-Id`), echoed back in the `X-Request-Id` response header and stamped on every log line for that request. Errors flow through one handler returning a stable shape `{ message, code, requestId }`; 5xx internals are hidden unless `EXPOSE_ERROR_DETAIL=true`. Unknown `/api/*` routes return a JSON 404.

### Logging (roadmap 3.4)

Centralized logger (`src/util/logger.js`, winston) replaces scattered `console.*`. Levels: `fatal > error > warn > info > http > debug > trace`. Logs rotate by size/time (no more unbounded `application.log`). `LOG_LEVEL` is also editable live from the IT Admin console.

| Key | Default | Meaning |
|-----|---------|---------|
| `LOG_LEVEL` | `info` (prod) / `debug` (dev) | Minimum severity written. Editable at runtime. |
| `LOG_DIR` | `life-claim-backend/logs` | Directory for rotated log files. |
| `LOG_TO_FILE` | `true` | Set `false` to log to console only (e.g. tests). |
| `LOG_MAX_SIZE` | `20m` | Rotate a file when it reaches this size. |
| `LOG_MAX_FILES` | `14d` | Retention (age like `14d`, or a file count). |
| `LOG_DATE_PATTERN` | `YYYY-MM-DD` | Rotation period. |
| `LOG_ZIP` | `true` | Gzip rotated files. |
| `LOG_HTTP_HOST` | *(unset)* | Optional: forward logs to an ELK/Loki/HTTP collector (`LOG_HTTP_PORT`, `LOG_HTTP_PATH`, `LOG_HTTP_SSL`). |

### RabbitMQ hardening (roadmap 3.6)

Queued notifications are now **reliable** rather than best-effort. The queue layer (`src/queues/rabbitmq.js`) uses **publisher confirms** (a publish resolves `true` only once the broker persists the message) and a **retry + dead-letter** topology: for a base queue `q` it also declares `q.retry` (a TTL holding queue that dead-letters back to `q` after a backoff) and `q.dlq` (a parking lot). A failed handler is retried up to `RABBITMQ_MAX_RETRIES` (tracked in an `x-retry-count` header); once exhausted the message is parked on `q.dlq` with error metadata — **never silently dropped**. The main queue is declared with no custom args, so it stays compatible with any existing `notifications` queue.

| Key | Default | Meaning |
|-----|---------|---------|
| `RABBITMQ_MAX_RETRIES` | `3` | Max handler attempts before dead-lettering. |
| `RABBITMQ_RETRY_DELAY_MS` | `10000` | Backoff (TTL) a message waits in `q.retry` before re-delivery. |
| `RABBITMQ_PREFETCH` | `10` | Unacked messages a consumer holds at once. |
| `RABBITMQ_TIMEOUT_MS` | `10000` | Broker connect timeout (also 3.1). |

Inspect `notifications.dlq` in the RabbitMQ management UI to triage messages that failed all retries.

### Service exposure & segmentation (roadmap 3.7)

Full internal/external service matrix and segmentation guidance: **`docs/SERVICE_EXPOSURE.md`**. Only the **Backend API** + **Keycloak** should be internet-facing; MySQL, RabbitMQ, Alfresco, the Transaction API, WhatsApp, Redis and the rules engine are backend-only and belong on a private network. A reusable internal-only guard (`middleware/requireInternal.js`) and a boot-time **exposure self-audit** (`util/exposureAudit.js`, logs findings) are included.

| Key | Default | Meaning |
|-----|---------|---------|
| `INTERNAL_ALLOWED_CIDRS` | loopback + RFC-1918 | Comma-separated CIDRs treated as internal by `requireInternal`. |
| `INTERNAL_API_KEY` | *(unset)* | Shared secret accepted in `X-Internal-Api-Key` for internal-only endpoints. |

### Production hardening (roadmap 4.x)

Full guides: **`docs/OBSERVABILITY.md`** (4.3), **`docs/SECRETS.md`** (4.5), **`docs/SECURITY_REVIEW.md`** (4.6), **`docs/RUNBOOK.md`** (4.9), **`docs/PWA_RESPONSIVE.md`** (4.7).

- **API docs (4.4):** Swagger UI at `/api/docs`, spec at `/api/docs/openapi.json`. `API_DOCS_ENABLED` (default: on in dev, **off in prod**).
- **Metrics (4.3):** Prometheus at `/api/metrics` (**internal-only** via `requireInternal`). Optional tracing: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME` (needs the OTEL SDK installed).
- **Secrets (4.5):** `SECRETS_PROVIDER` = `env` (default) / `file` (`SECRETS_DIR` or `SECRETS_FILE`) / `vault` (`VAULT_ADDR`,`VAULT_TOKEN`,`VAULT_SECRET_PATH`) / `aws` (`AWS_REGION`,`AWS_SECRET_ID`). All fall back to `.env`.
- **Retention (4.6):** `RETENTION_ENABLED` (default `false`), `RETENTION_DRY_RUN` (default `true`), `DATA_RETENTION_DAYS` (365), `AUDIT_LOG_RETENTION_DAYS`, `RETENTION_INTERVAL_MS`.
- **Docker (4.2):** `docker compose up -d --build` (root `docker-compose.yml`); compose vars in root `.env` (see `.env.example`), app config in `life-claim-backend/.env`.

## Section L (legacy / dormant)

See **`docs/LEGACY_ROUTES.md`**. v2 has no v1 `App.js` comment block; unrouted files: `InwardMail.jsx`, `HospitalContacts.jsx`. Registration is one wizard + one workspace URL.

## Commands

```bash
# Terminal 1 — backend
cd life-claim-backend
npm start

# Terminal 2 — frontend
cd life-claim-frontend
npm run dev

# Terminal 3 — Drools rules engine (ADD exclusion rules)
cd life-claim-rules
start-rules.bat
# Or: java -jar target\life-claim-rules-0.0.1-SNAPSHOT.jar
```

Open: http://localhost:5174

## Production UI from backend

```bash
cd life-claim-frontend && npm run build
# Uncomment FRONTEND_BUILD_PATH in backend .env, restart backend
# Open https://192.168.60.62:3010
```

## Google reCAPTCHA domains

In [reCAPTCHA Admin](https://www.google.com/recaptcha/admin), add: `localhost`, `127.0.0.1`, `192.168.60.62`.

## Branding (roadmap 2.1)

Per-deployment name, colours and logo are **config, not code** — stored in `org_profile` and edited by
a superuser at **`/superuser/branding`**. Colours apply at runtime via CSS variables
(`src/config/brandTheme.js`); the built-in `companyBrand.js` values are only the fallback. Logo uploads
(reusing the multer path) save to `life-claim-backend/uploads/branding/` and are served at `/branding/…`
(gitignore the uploads folder in prod backups if needed). API: public `GET /api/org-profile`;
superuser `PUT /api/org-profile` + `POST /api/org-profile/logo`.

## New machine setup

1. Copy `life-claim-frontend/.env.example` → `.env` and `life-claim-backend/.env.example` → `.env`
2. Paste your DB password, reCAPTCHA keys, and `SERVER_IP` if different
3. Do **not** put the reCAPTCHA **secret** in the frontend file
