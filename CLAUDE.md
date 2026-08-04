# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

DH Digital **Life Claims** — a life-insurance claims management system (a "v2" POC; the Java package namespace is `com.icici.lifeclaim`). It manages the full claim lifecycle: **Registration → Assessment → Decision → Approval**, with role-based access (Pre-Assessor, Assessor, Verifier, Admin). See `README.md`, `ENV.md`, and `docs/INTEGRATIONS.md` for detail.

The repo contains **three independently-built applications**:

| Dir | Stack | Dev port | Role |
|-----|-------|----------|------|
| `life-claim-backend/` | Node.js, Express, Sequelize + raw `mysql2`, Keycloak/JWT | 3010 | REST API under `/api/*` |
| `life-claim-frontend/` | React 19, Vite, Tailwind v4, React Router v6, Recharts, Axios | 5174 | Operator + admin UI |
| `life-claim-rules/` | Java 17, Spring Boot 3.2, Drools 8.44 | 8095 | ADD accidental-death exclusion rules engine |

## Commands

Each app has its own `.env` (in its own folder) and must be restarted after `.env` edits. See `ENV.md` for the full frontend↔backend variable pairing.

**Backend** (`cd life-claim-backend`)
```bash
npm install
npm start                 # nodemon ./src/server.js  (HTTPS by default, port from .env)
npm run start:worker      # notificationWorker.js — SEPARATE process, required for queued notifications
npm run generate-cert     # create self-signed cert.pem/key.pem for local HTTPS
npm run dev:full          # concurrently runs backend + frontend
npm run test:e2e-security # scripts/security-e2e.js
npm run test:e2e-drools   # scripts/verify-drools-e2e.js
```

**Frontend** (`cd life-claim-frontend`)
```bash
npm install
npm run dev      # vite dev server on :5174, proxies /api → VITE_PROXY_TARGET
npm run build    # vite build (output can be served by backend via FRONTEND_BUILD_PATH)
npm run lint     # eslint .
```

**Rules engine** (`cd life-claim-rules`)
```bash
start-rules.bat                                    # Windows launcher
mvn spring-boot:run                                # or run directly
mvn test                                           # all tests
mvn test -Dtest=ExclusionRuleHelperTest            # single test class
mvn test -Dtest=ExclusionRuleHelperTest#methodName # single test method
```

**Testing note (roadmap 0.5 — harness now in place):**
- **Backend** — Jest + Supertest. `npm test` (also `test:watch`, `test:coverage`) runs specs under `life-claim-backend/tests/`. Config in `jest.config.js`. The two `test:e2e-*` scripts remain standalone Node runners, excluded from Jest.
- **Frontend** — Vitest + React Testing Library (jsdom). `npm test` / `test:watch` / `test:coverage`; config lives in `vite.config.js`'s `test` block, global setup in `src/test/setup.js`, specs co-located as `*.test.{js,jsx}`.
- **Rules** — the Java module keeps its JUnit tests (`mvn test`).
- **CI** — `.github/workflows/ci.yml` lints + tests all three apps on every push/PR. Frontend `npm run lint` is currently **non-blocking** (`continue-on-error`) due to ~1400 pre-existing eslint errors; tests are blocking.
- Coverage so far is a **skeleton** (pure utils, one DB-free middleware via Supertest, one RTL component smoke test) — meant to be extended, not comprehensive.

## Backend architecture

**Layered request flow:** `routes/*` → `controllers/*` → `services/*` → `dataAccess/*` (DAOs) and/or `models/*` (Sequelize). Route groups mount under `/api` in `src/app.js` (see the long `app.use('/api/...')` block).

**Middleware order in `src/app.js` is load-bearing** — do not reorder casually:
1. Helmet (CSP built from Keycloak origin + CORS origins) → CORS → rate limiter (`apiLimiter`)
2. `app.use('/api/auth', authRoutes)` — auth endpoints mounted **before** the auth gate
3. `session(sessionConfig)` → `keycloak.middleware()` → `requireApiAuth` → all protected routes.
   Keycloak must run before `requireApiAuth` so Bearer tokens populate `req.kauth`.

**Auth is hybrid Keycloak + local JWT**, auto-detected by token format. Frontend gets a token via `POST /api/auth/keycloak/token` (password grant proxied by the backend); roles come from the JWT `realm_access.roles`. Route protection uses `protect()` / role checks. Admin-only users land on `/admin`, operational users on `/dashboard`.

**Two parallel DB access paths share the same `DB_*` env** — be aware which a file uses:
- `src/config/sequelize.js` — Sequelize ORM (dialect hardcoded `mysql`); backs `models/*`.
- `src/config/dbConfig.js` — a raw `mysql2` promise **pool** used directly by some DAOs.
- Data access is **raw-SQL-heavy**: ~180 `sequelize.query(...)` calls + ~70 raw pool queries. The ORM is present but not the primary query mechanism. Assume vendor-specific SQL when editing queries.

**Schema is managed by hand** — loose `.sql` files in `life-claim-backend/scripts/` run manually; there is **no migration framework**, and `sequelize.sync()` is commented out in `app.js`. Models match existing tables in the `claims_poc` MySQL database; treat the DB as read/write against a fixed external schema.

**Async / integrations:**
- RabbitMQ (`src/queues/rabbitmq.js`) + `src/workers/notificationWorker.js`. Registration notifications fire **directly**; pool/decision/payout notifications go through the queue and **only deliver if the worker process is running**.
- External systems (all via backend): Transaction API (Life Asia policy search), Alfresco DMS (document upload/preview proxy), WhatsApp gateway, Gmail SMTP, and the Drools rules engine via `services/rulesEngineClient.js` (called only when `RULES_ENGINE_ENABLED=true`). Full map in `docs/INTEGRATIONS.md`.

**Server (`src/server.js`):** same code for local and deployed — environment (`.env`) decides HTTP vs HTTPS, host, and port; do not switch by commenting code. HTTPS is the default and needs `cert.pem`/`key.pem` (generate via `npm run generate-cert`). Optionally serves the built frontend when `FRONTEND_BUILD_PATH` is set.

**The `add/` subfolders** (in `controllers/`, `routes/`, `services/`, `models/`, `dataAccess/`) implement the **ADD (Accidental Death & Disablement)** assessment feature — CAPS findings/decisions and the exclusion-rule flow that calls the Drools engine.

## Frontend architecture

- Single shell `layouts/AppLayout` (v2 uses one layout, not a separate admin layout). Routes and role gating live in `src/App.jsx`; nav in a `NAV_ITEMS` structure. Pages in `src/pages/` (Registration is a multi-tab wizard under `src/pages/Registration/`).
- Env is read through `src/util/env.js` / `src/util/config.js`; `vite.config.js` accepts **both** `VITE_*` and `REACT_APP_*` prefixes. In dev, leave `VITE_API_URL` empty and rely on the Vite proxy to `VITE_PROXY_TARGET`.
- Branding is currently hardcoded in `src/config/companyBrand.js`.
- Some files are present but unrouted/legacy (`InwardMail.jsx`, `HospitalContacts.jsx`); see `docs/LEGACY_ROUTES.md`.

## Rules engine architecture

Spring Boot service exposing `AddExclusionRulesController`; Drools rules in `src/main/resources/rules/add-exclusion.drl` evaluate `AddExclusionFacts` → `AddExclusionResult`. The backend is the only client (`rulesEngineClient.js`), gated by `RULES_ENGINE_ENABLED`. See `life-claim-backend/EXCLUSION_RULES_IMPLEMENTATION.md`.

## Repository hygiene (important)

- **Stray log files:** `life-claim-backend/` contains three accidental capture files — `Life Claim Backend`, `Life-Claim-Backend`, and `Life-Claim-Backend1` (~98 MB of console/error output). They are not source; do not read or ship them, and they should be deleted.
- **Duplicate tree:** `claude-poc-main/` is a full ~103 MB duplicate of the entire project (backend/frontend/rules/docs). Work in the **root** copies, not inside `claude-poc-main/`.

## Ports & environment quick reference

Backend v2 **3010** (v1 legacy 3008) · Frontend dev **5174** · Rules **8095** · Keycloak **8081** · Transaction API **3003** · Alfresco **8080**. Demo accounts (`preassessor`/`assessor`/`verifier`/`admin`) use password `password123`. Do not put the reCAPTCHA **secret** in the frontend `.env`.
