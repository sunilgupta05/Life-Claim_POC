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

## New machine setup

1. Copy `life-claim-frontend/.env.example` → `.env` and `life-claim-backend/.env.example` → `.env`
2. Paste your DB password, reCAPTCHA keys, and `SERVER_IP` if different
3. Do **not** put the reCAPTCHA **secret** in the frontend file
