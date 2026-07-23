# Section K — Integrations (v2 POC)

How the Life Claims **v2** stack talks to external systems. v1 used backend **3008**; this POC uses **3010** and Vite dev on **5174**.

## K1 — Integration map

| System | Typical host | Used for |
|--------|--------------|----------|
| **Keycloak** | `http://localhost:8081` | Login, realm roles, API protection |
| **MySQL** | `localhost` / `claims_poc` | Claims, users, audit, CAPS, document metadata |
| **Transaction API** | `http://localhost:3003` | Life Asia `policySearch` |
| **Alfresco** | `192.168.60.63:8080` | Upload, preview (backend proxy) |
| **WhatsApp** | `192.168.60.62:3002/api/v1/` | Registration + queued notifications |
| **RabbitMQ** | `192.168.60.62:5672` | Async notification queue |
| **Gmail SMTP** | `EMAIL_ID` / `EMAIL_PASS` | Outbound email |

Browser (Vite **5174**) → `/api` proxy → Backend (**3010**) → dependencies above.

## K2 — Configuration

### Frontend (`life-claim-frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_PROXY_TARGET` / `REACT_APP_PROXY_TARGET` | Dev proxy target (e.g. `https://192.168.60.62:3010`) |
| `VITE_API_URL` | Empty in dev (proxy); set in production if UI is on another host |
| `VITE_KEYCLOAK_URL` | Informational; login uses backend token proxy |
| `VITE_IDLE_TIMEOUT_MINUTES` | Align with `SESSION_IDLE_TIMEOUT_MINUTES` |
| `VITE_RECAPTCHA_SITE_KEY` | Login widget (not the backend secret) |
| `VITE_CAPTCHA_OPTIONAL` | SIT bypass when Google is blocked |
| `VITE_SESSION_CHECK_INTERVAL_MS` | Poll when `SINGLE_SESSION_ENFORCED=true` |

Code: `src/util/env.js`, `src/util/config.js`, `vite.config.js` (`envPrefix: VITE_, REACT_APP_`).

### Backend (`life-claim-backend/.env`)

See `.env.example` for the full list. Integration-critical:

| Variable | Purpose |
|----------|---------|
| `PORT=3010` | v2 API listen port |
| `KEYCLOAK_*` | Realm `life-claims`, client `life-claims-frontend` |
| `DB_*` | MySQL `claims_poc` |
| `TXN_API_BASE_URL` | Transaction API (port 3003) |
| `DOCUMENT_VIEWER_IP` | Alfresco for upload/preview |
| `DEV_DOCUMENT_STORAGE_LOCATION` | Alfresco parent folder **UUID** (unchanged when only IP moves) |
| `DMS_USER_ID` / `DMS_PASSWORD` | Alfresco auth |
| `WHATSAPP_API_URL` | WhatsApp gateway |
| `RABBITMQ_URL` | Management URL; AMQP on same host :5672 |
| `NOTIFICATION_USE_QUEUE` | Duplicate registration messages to queue when `true` |
| `EMAIL_ID` / `EMAIL_PASS` | Gmail SMTP |
| `AUDIT_*` | Login audit behavior |

**Do not commit real passwords** — use `.env` locally or secret injection in production.

## K3 — Keycloak

1. Frontend `POST /api/auth/keycloak/token` (password grant).
2. Token in `sessionStorage.token`; roles from JWT `realm_access.roles` (`admin`, `Pre Assessor`, `Assessor`, `Verifier`, …).
3. `app.use('/api', keycloak.middleware())` + route `protect()` / `authorize('admin')`.

Admin-only users (no operational roles) land on **`/admin`** after login.

## K4 — MySQL

- **mysql2** pool + **Sequelize** on same `DB_*` env.
- Schemas: `claims`, `users`, `user_login_audit`, `UploadedDocuments`, CAPS tables, `caps_eagle_rule_details`, etc.

## K5 — Transaction API

- `transactionApiClient.js` → `GET {base}/api/policy/policySearch/{policyNo}` (8-digit pad).
- Callers: `GET /api/policy/:id`, CAPS `dataEnrichmentService`, `refreshLifeAsiaData`.
- Down → policy search, registration pre-fill, CAPS enrichment fail.

## K6 — Alfresco

- Upload: `POST /api/upload/uploadFile` → ticket → folder per `claimNo` → `UploadedDocuments`.
- Preview: `GET /api/document/preview/:nodeId` — v2 UI uses **authenticated fetch + blob** (`documentPreviewService.js`), not raw `<a href>` without JWT.
- IP in `DOCUMENT_VIEWER_IP`; folder id in `DEV_DOCUMENT_STORAGE_LOCATION`.

## K7 — WhatsApp

- Registration: **direct** from `registerClaimController` / CAPS enrichment.
- Pool / decisions: **RabbitMQ** → `notificationWorker.js` (separate process).

## K8 — RabbitMQ worker

```bash
cd life-claim-backend
npm run start:worker
```

Without the worker, queued assignment/decision/payout notifications do not deliver.

## K9 — Email

- Active: `outgoingEmailService.js` (nodemailer + Gmail).
- Legacy IMAP `emailService` is **not** started from `app.js` unless re-enabled.

## K10 — Dev proxy

| Piece | Port |
|-------|------|
| Vite dev | **5174** |
| Backend v2 | **3010** |
| v1 backend (legacy doc) | 3008 |

```bash
cd life-claim-backend && npm start
cd life-claim-frontend && npm run dev
```

Open http://localhost:5174 — API calls go to `/api` → `VITE_PROXY_TARGET`.

## K11 — CSP

v2 `index.html` has **no** legacy CRA CSP meta (avoids stale `192.168.60.16` blocks). When serving the UI from the backend build, Helmet CSP on the API host applies (`app.js` `connectSrc` includes Keycloak + CORS origins).

## K12 — Operational checklist

1. Keycloak + realm roles correct.
2. MySQL `claims_poc` up.
3. Transaction API on `TXN_API_BASE_URL`.
4. Alfresco at `DOCUMENT_VIEWER_IP`; DMS credentials; storage UUID valid.
5. WhatsApp gateway reachable.
6. RabbitMQ + **notification worker** for non-registration notifies.
7. Gmail credentials if email required.
8. Frontend `VITE_PROXY_TARGET` matches backend URL/TLS.
9. Registration notify can work without Rabbit; do not assume the same for pool/decision events.

## K13 — UI reference

**Admin → Overview** includes an **Integration dependencies** panel (client config + failure modes). Source: `src/config/integrations.js`, `src/components/admin/IntegrationsPanel.jsx`.
