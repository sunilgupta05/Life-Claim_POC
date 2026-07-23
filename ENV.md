# Environment configuration (v2 POC)

Both apps read **`.env` in their own folder** (already committed locally for this workspace). Restart after any change.

## Pairing checklist

| Purpose | Frontend (`life-claim-frontend/.env`) | Backend (`life-claim-backend/.env`) |
|--------|----------------------------------------|----------------------------------------|
| API / proxy | `VITE_PROXY_TARGET=https://192.168.60.62:3010` | `PORT=3010`, `USE_HTTPS=true` |
| Drools rules | — | `RULES_ENGINE_URL=http://localhost:8095`, `RULES_ENGINE_ENABLED=true` |
| Idle logout | `VITE_IDLE_TIMEOUT_MINUTES=5` | `SESSION_IDLE_TIMEOUT_MINUTES=5` |
| reCAPTCHA | `VITE_RECAPTCHA_SITE_KEY=…La0QUjc…` (site) | `RECAPTCHA_SECRET_KEY=…RyWFweBE` (secret) |
| Keycloak | `VITE_KEYCLOAK_URL=http://localhost:8081` | `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID` |
| SIT bypass | `VITE_ENVIRONMENT=SIT`, `VITE_CAPTCHA_OPTIONAL=true` | `ENVIRONMENT=SIT` |
| Single session | `VITE_SESSION_CHECK_INTERVAL_MS=90000` | `SINGLE_SESSION_ENFORCED=false` (set `true` to enforce) |
| CORS | (dev uses Vite proxy) | `CORS_ALLOWED_ORIGINS` includes `:5174` and `:3010` |

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
