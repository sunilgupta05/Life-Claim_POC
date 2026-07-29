# Life Claims POC — Development Reference

Single-file reference for the full state of this repository: architecture, modules, APIs, database mapping, current functionality, and open items. Written to let anyone (human or AI) continue development without needing prior conversation context.

Companion docs (not duplicated here, cross-referenced where relevant):
- **[docs/INTEGRATIONS.md](./INTEGRATIONS.md)** (Section K) — external system integration map (Keycloak, MySQL, Transaction API, Alfresco, WhatsApp, RabbitMQ, Email) + config checklist.
- **[docs/LEGACY_ROUTES.md](./LEGACY_ROUTES.md)** (Section L) — active vs dormant v1/v2 routes, what's intentionally unrouted.
- **[../ENV.md](../ENV.md)** — frontend/backend `.env` variable pairing table.
- **[../README.md](../README.md)** — quick start, demo accounts, page list.
- **life-claim-backend/EXCLUSION_RULES_IMPLEMENTATION.md** — CAPS ADD exclusion-rules feature writeup.
- **life-claim-backend/CONNECTION_TROUBLESHOOTING.md** — ECONNREFUSED diagnostic runbook for the Transaction API dependency.

---

## 1. What this system is

A life-insurance **death-claim processing** platform (ICICI-style "Life Claim"), covering:
- Claim **registration** (Pre Assessor intake from a Life Asia policy lookup).
- Claim **assessment** (Assessor workspace: demographics, requirements/documents, IIB enquiry, telecalling, remarks, fraud/EAGLE screening, trap score).
- Claim **decision** (system-generated decision via a rules/BRE engine, Assessor decision, Verifier decision, payout).
- A parallel **CAPS/ADD** module (Accidental Death/Disability) with its own Excel-ingestion → exclusion-rules → assessor pool → decision pipeline, backed by a separate Java Drools microservice.
- Supporting admin/ops surfaces: superuser dashboard, audit log, pool selection, my-task queues, document upload/preview (Alfresco DMS), notifications (WhatsApp + email via RabbitMQ worker).

This is a **v2 POC rewrite** running alongside a legacy v1 stack (v1 backend on port 3008). The v2 UI intentionally has far fewer routes than v1 — see `docs/LEGACY_ROUTES.md` for what was deliberately dropped or left unrouted.

## 2. Repository layout

```
Life-Claim_POC-main/
├── life-claim-backend/     # Node.js + Express + Sequelize + MySQL API (port 3010/3012)
├── life-claim-frontend/    # React 19 + Vite SPA (dev port 5174)
├── life-claim-rules/       # Java Spring Boot + Drools microservice (port 8095)
├── docs/                   # INTEGRATIONS.md, LEGACY_ROUTES.md, this file
├── ENV.md, README.md
```

## 3. Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite 8, React Router v7, Tailwind v4, Recharts, Lucide icons, Axios, react-hook-form, jspdf |
| Backend | Node.js, Express 4, Sequelize 6 (MySQL dialect) **+** raw `mysql2` pool used directly by most DAOs, Keycloak-connect, JWT, express-session (Redis-backed w/ in-memory fallback), Multer, Winston, amqplib (RabbitMQ), nodemailer/imap+mailparser |
| Rules engine | Java, Spring Boot, Drools (KIE), Maven |
| Auth | Keycloak (realm `life-claims`, client `life-claims-frontend`) is primary; a legacy HS256-JWT path (`authService.js`) still exists and both are checked by `protect()`/`authenticate` middleware |
| DB | MySQL, database `claims_poc` — **no migrations directory in use** (empty `migrations/`); schema is ad hoc SQL scripts in `life-claim-backend/scripts/` + Sequelize models as the closest thing to a schema source of truth (`sequelize.sync()` is commented out, not run) |

## 4. Ports & processes to run locally

| Process | Command | Port |
|---|---|---|
| Backend API | `cd life-claim-backend && npm start` | 3010 (or `PORT` env; `server.js` defaults to 3012 if unset) |
| Frontend dev | `cd life-claim-frontend && npm run dev` | 5174, proxies `/api` → `VITE_PROXY_TARGET` |
| Rules engine | `cd life-claim-rules && start-rules.bat` (or `java -jar target\life-claim-rules-0.0.1-SNAPSHOT.jar`) | 8095 |
| Notification worker | `cd life-claim-backend && npm run start:worker` | — (consumes RabbitMQ `notifications` queue; without it, assignment/decision/payout notifications never deliver — registration notify can still fire directly) |

`npm run dev:full` in the backend runs backend + frontend concurrently. See `docs/INTEGRATIONS.md` K10/K12 for the full dependency checklist (Keycloak, MySQL, Transaction API, Alfresco, WhatsApp, RabbitMQ).

---

## 5. Backend (`life-claim-backend/`)

### 5.1 App bootstrap

- **`src/server.js`** — starts HTTP(S) server. Reads `PORT` (default 3012), `HOST` (default `0.0.0.0`), `USE_HTTPS` (default true, loads `cert.pem`/`key.pem`, falls back to HTTP if missing).
- **`src/app.js`** — Express assembly, in mount order:
  1. `httpMethodFilter` (blocks TRACE/TRACK/CONNECT).
  2. `trust proxy` if `TRUST_PROXY=true`.
  3. Helmet: custom CSP (`connectSrc` built dynamically from CORS allowlist + Keycloak origin; reCAPTCHA domains allowed in `scriptSrc`/`frameSrc`), `frameguard(sameorigin)`, `hsts`, `referrerPolicy`.
  4. Strips `X-Powered-By`/`Server`; forces `Cache-Control: no-store`.
  5. Path-traversal guard on `req.originalUrl` (rejects `../`, `..\`, double-encoded `%2e%2e`).
  6. `REQUIRE_HTTPS_AUTH` — rejects insecure transport on login/token endpoints in prod.
  7. CORS allowlist from `CORS_ALLOWED_ORIGINS` (wildcard explicitly rejected); dev fallback list includes 3000/3011/3012/3015/5174.
  8. `Permissions-Policy` header (denies geolocation/camera/mic/payment/usb).
  9. `bodyParser`, `cookieParser`, XSRF cookie hardening (forces httpOnly/secure/sameSite=strict).
  10. `apiLimiter` rate limiter mounted at `/api`.
  11. `express-session` (Redis store if `REDIS_URL` set, else in-memory — config in `middleware/keycloak.js`).
  12. `injectBearerFromSession` — mirrors session token into `Authorization` header.
  13. `/api/auth` mounted (public, before Keycloak middleware).
  14. `keycloak.middleware()` at `/api`.
  15. `requireApiAuth` — default-deny gate for all `/api/*` except `PUBLIC_API_ROUTES` whitelist.
  16. All feature routers (§5.2).
  17. Centralized error handler (hides 5xx detail unless `EXPOSE_ERROR_DETAIL=true`).
  18. Periodic job (`AUDIT_RECONCILE_MS`, default 5 min) → `auditLogService.closeAllStaleSessions()`.
  19. Test-only routes gated by `ENABLE_TEST_ROUTES`.
  20. Static-serves built frontend (`life-claim-frontend/build` or `FRONTEND_BUILD_PATH`) + SPA catch-all.

### 5.2 Routes → controllers (by feature area)

| Area | Mount | Endpoints | Controller(s) |
|---|---|---|---|
| Auth | `/api/auth` (public) | `POST /keycloak/token`, `/keycloak/refresh`, `/authenticate`, `/logout-audit`, `/clear-token-cookie`, `GET /session-check` | inline in `authRoutes.js` + `authService`, `auditLogService` |
| Users/Roles | `/api/user`, `/api/role` | legacy `POST /login`, CRUD `/user`, `GET/POST /role*` | `userController`, `roleController` |
| Mail/Attachments (dormant UI) | `/api/mail`, `/api/attachment` | list/count/get, patch | `mailsController`, `attachmentsController` |
| Policy / master data | `/api/policy`, `/api/countries`, `/api/states`, `/api/cause-event`, `/api/case-reasons` | policy detail, countries, states/place/portfolio/requirement master, cause-event, case reasons | `policyController`, `countriesController`, `statesController`, `placeOfDeathController`, `requirementController`, `systemRequirementController`, `portfolioController`, `causeEventController`, `caseReasonsController` |
| Search / history | `/api/history-search`, `/api/claim-search`, `/api/assessor-fetch` | search, assessor/verifier decision update, workspace tab fetch (demogs/require/assess/decision/calcAmt) | `historySearchController`, `claimSearchController`, `assessorController` |
| **Claim registration/lifecycle** | `/api/register-claim`, `/api/claims`, `/api/pool-selection`, `/api/trap-score`, `/api/calculate-amount`, `/api/agentRepudiation`, `/api/systemDec`, `/api/assessment-questions` | `POST /` (Joi-validated, Pre Assessor only), `POST /update`, assign/status-change, pool select, trap score, payout calc, system decision generation | `registerClaimController`, `updateClaimController`, `claimsController`, `poolSelectionController`, `trapScoreController`, `calculateAmountController`, `policyController`, `systemDecisionController`, `assessmentQuestionsController` |
| CAPS/ADD | `/api/capsAddDetails`, `/api/case-search`, `/api/Assessment`, `/api/caseassignment`, `/api/case-assignment` | Excel ingest, decision master/save, findings, search, pool, exclusion rules, refresh from Life Asia, bulk assign | `controllers/add/*` (6 controllers, see §5.3) |
| Fraud prevention (EAGLE) | `/api/fraudprevention` | safe-city/pincode check, bank-details check, agent-trend check, mobile check, eagle rule remarks/decisions CRUD | `fraudPreventionController` |
| Documents | `/api/documents`, `/api/uploaded`, `/api/upload`, `/api/document` | document checklist, uploaded-doc CRUD, `POST /uploadFile` (Multer, whitelist ext, 10MB, magic-byte check), `GET /preview/:nodeId` | `documentListController`, `uploadedDocumentController`, `documentUploadController` (Alfresco DMS) |
| Transaction/IIB (Life Asia) | `/api/txn` | `POST /txnDetails`, `/transactionApiDBDetails`, `/txnSave` | `txnDetailsController` |
| Admin | `/api/superuser` (superuser-gated) | summary, recent claims, reports, audit + tracked users, force-logout, claim assign/unassign | `adminController` |
| Dashboard | `/api/dashboard` | `GET /activities` | `dashboardActivityController` |
| Common | `/api/app` | hospital contact CRUD, general-info | `email_fax_contactController`, `generalInfoController` |

### 5.3 Controllers reference

**Root (`src/controllers/`)**: `adminController`, `assessmentQuestionsController`, `assessorController` (workspace tab fetches), `attachmentsController`, `calculateAmountController`, `caseReasonsController`, `causeEventController`, `claimSearchController`, `claimsController`, `countriesController`/`statesController`/`placeOfDeathController`/`requirementController`/`systemRequirementController`/`portfolioController` (master data), `dashboardActivityController`, `documentListController`, `documentUploadController`, `email_fax_contactController`/`email_fax_mobile_SearchController`/`generalInfoController` (hospital master, dormant UI), `fraudPreventionController`, `historySearchController`, `mailsController`, `policyController`, `poolSelectionController`, **`registerClaimController`** (~960 lines — full registration transaction, see §7), **`updateClaimController`** (~540 lines — mirrors registration shape for edits), `roleController`, `systemDecisionController`, `trapScoreController`, `txnDetailsController`, `uploadedDocumentController`, `userController`.

**`controllers/add/`** (CAPS ADD): `assessorPoolCasesController`, `capsAddDecisionController`, `capsAddDetailsController` (Excel ingest, bulk assignment), `capsAddFindingsController`, `capsAssessmentPoolController`, `caseSearchController`, `exclusionRulesController` (calls Drools or JS fallback).

### 5.4 Services reference

Notable services (`src/services/`, ~35 files): `adminService`, `auditLogService` (login/logout audit + stale-session reconciliation), `authService` (legacy JWT + bcrypt + reCAPTCHA hook), `claimRegistrationNotifyService` (**notifyClaimRegistered** → publishes to RabbitMQ + directly calls `whatsappService`/`outgoingEmailService`), `claimSearchService`/`claimsService`, `dashboardActivityService`, `emailService` (IMAP inbox polling, dormant), `intimationService`, `keycloakLoginLockout`, `loginCrypto` (decrypts client-encrypted login password), `notificationQueueService` (general assignment/decision notification publisher), `outgoingEmailService` (SMTP/nodemailer), `policyMapper` (Life Asia response → internal shape), `poolSelectionService`, `recaptchaService`, **`rulesEngineClient`** (Drools HTTP client — see §9), **`systemDecisionService`** (~3500 lines — BRE-style claim-decision engine: lapsed-rule/event/rider/trap-score/requirement-status/other-insurance/payee-claimant-count facts), `transactionApiClient` (Life Asia `policySearch`), `trapScoreService` (~1100 lines, fraud scoring), `uploadedDocumentsService`, `whatsappService` (registration/payout/status notifications, normalizes mobile to `91XXXXXXXXXX`).

**`services/add/`**: `capsAddDetailsService`, `dataEnrichmentService` (raw Excel batch → `CapsAddDetails`/contract/life-assured rows → exclusion check → assessor-pool upsert → Life Asia refresh → notify), `exclusionRulesService` (Drools call + JS fallback, see §9).

### 5.5 Data access pattern (important — hybrid, not uniform)

The codebase mixes **two persistence patterns**:
1. **Sequelize ORM models** (`src/models/*`) — used for the big multi-table registration/update transactions (`registerClaimController`, `updateClaimController` wrap everything in one `sequelize.transaction()`).
2. **Raw parameterized SQL via `mysql2` pool** (`src/dataAccess/*`, config in `src/config/dbConfig.js`) — used by most search/read/simple-write endpoints, even for tables that also have a Sequelize model (e.g. `claimSearchDao.js` queries `claims` with raw SQL while `models/Claim.js` exists separately).

`dataAccess/` subfolders mirror feature areas: `dataAccess/add/*` (CAPS DAOs), `dataAccess/FraudPrevention/*`. **When adding a new field to a claim sub-table, check both whether a Sequelize model needs a new column AND whether any raw-SQL DAO reads/writes that same table with an explicit column list that also needs updating.**

### 5.6 Middleware (`src/middleware/`)

- `keycloak.js` — Keycloak-connect instance + session config; `protect(roleSpec)` tries legacy JWT first, falls back to Keycloak RS256; `hasAnyRole()`.
- `authMiddleware.js` — `authenticate`, same dual-mode pattern, populates `req.user`/`req.kauth`.
- `requireApiAuth.js` — default-deny gate, `PUBLIC_API_ROUTES` whitelist.
- `authorize.js` — role-based route gate, superuser-aware.
- `selfOrAdminUserRead.js` — IDOR guard on `/user/:id`.
- `claimAccessMiddleware.js` — claim-level authorization (role/assignment linkage check) — `authorizeClaimBodyAccess`, `authorizeClaimParamAccess`, `authorizeHistorySearchAccess`, `authorizePoolAssignAccess`, `authorizeAssignClaimsBodyAccess`, `authorizePolicyOrClaimBodyAccess`.
- `addCaseAccessMiddleware.js` — same for ADD/CAPS cases.
- `assertBodyUsername.js` — prevents spoofing another user's username in body.
- `assessorFetchBody.js` — promotes POST-body `claimNo` into `req.params` for legacy GET-shaped controllers.
- `rateLimiters.js` — `authTokenLimiter`, `legacyLoginLimiter`, `logoutAuditLimiter`, `apiLimiter`.
- `httpMethodFilter.js`, `validateJoi.js`, `requestValidation.js` (large hand-rolled validator collection — most non-registration endpoints validate here, not via Joi).

### 5.7 Validation

Only **one** dedicated Joi schema file: `src/validation/registerClaimSchemas.js` (`registerClaimBodySchema`, `updateClaimBodySchema`). Deliberately structural not exhaustive: nested objects use `looseObject` (`Joi.object().unknown(true).max(200)`), table-like arrays use a `tableField` helper tolerant of array / `{data:[...]}` / empty string / null (mirrors frontend's `asArray()` tolerance). Root schema is also `.unknown(true)` — required top-level fields are only `policyID`, `createdBy`. Everything else (including all 9 `iib*` scalar fields) is explicitly declared with type/length constraints. Most other endpoints validate inline via `middleware/requestValidation.js` instead of Joi.

### 5.8 Queues & workers

- `src/queues/rabbitmq.js` — `amqplib` wrapper: `resolveRabbitAmqpUrl()`, `getChannel()` (singleton, reconnect-on-error), `publishToQueue()`, `consumeQueue()` (manual ack/nack).
- `src/workers/notificationWorker.js` — standalone process (`npm run start:worker`), consumes `notifications` queue, dispatches by `msg.type`: `whatsapp-claim-registration`, `whatsapp-payout-completed`, `email`, `assessor-assignment`, `verifier-assignment`, `assessor-decision`, `verifier-decision`.

### 5.9 Config (`src/config/`)

- `dbConfig.js` — `mysql2` pool (`connectionLimit: 10`), used by raw-SQL DAOs.
- `sequelize.js` — Sequelize instance, same DB env vars, used by all models.
- `logConfig.js` — Winston, IST timestamps, JSON, console + `logs/application.log`.
- Keycloak config lives in `middleware/keycloak.js`, not here.

### 5.10 Schema / migrations

**`migrations/` is empty — no formal migration chain.** Schema evolution lives in ad hoc scripts under `life-claim-backend/scripts/`: `acuity-tables.sql`, `add-user-login-audit-logout-reason.sql`, `admin-overview-crosscheck.sql`, `run-acuity-setup.sql`/`.js`, `verify-acuity-setup.js`, `verify-drools-e2e.js`, `dashboard-crosscheck.js`/`-extra.js`, `security-e2e.js`/`-fixtures.js`, `test-admin-apis.js`/`test-admin-db.js`, `generate-login-keys.js`. `sequelize.sync()` is commented out in `app.js` — **Sequelize models are the closest thing to a live schema source of truth**, but they can silently drift from the real DB since nothing enforces sync.

---

## 6. Database — model → table map

All models in `src/models/` (Sequelize, MySQL, DB `claims_poc`). Column names are generally UPPER_SNAKE_CASE.

| Model | Table | Purpose |
|---|---|---|
| `Claim` | `claims` | Central claim record (claim number, policy, status, assignment) |
| `ClaimSequence` | `claim_sequence` | Claim-number sequence generator |
| `ClaimsQuestions` | `claim_questions` | Assessment Q&A answers |
| `IntimationDetail` | `intimation_details` | Claim intimation info |
| `CauseEvent` | `cause_event` | Cause/event of death |
| `EstablishedCause` | `established_cause` | Established cause of death |
| `LifeAssuredDetail` | `life_assured_details` | Life-assured personal details |
| `ClaimantDetail` | `claimant_details` | Claimant personal details |
| `PayeeDetail` | `payee_details` | Payee/beneficiary details |
| `ContactDetail` | `contact_details` | Contact info |
| `Requirement` | `Requirements` | Legacy single-row requirement flags |
| `RequirementTable` | `requirement_table` | Per-document requirement/checklist rows |
| `ReqCommonDetails`, `ReqRiderDetails` | `common_and_rider_details` | Requirement rider/common detail rows |
| `ReqEmail`, `ReqLetter` | `letters_and_emails` | Two models sharing one table (email vs letter comms) |
| `RiderDetail` | `rider_details` | Rider details |
| `RiderDetailsTable` | `rider_details_table` | Rider detail rows |
| `DecisionAccessor` | `decision_accessor` | Assessor decision |
| `DecisionSystem` | `decision_system` | System-generated decision |
| `DecisionVerificationAndSummary` | `decision_verification_and_summary` | Verifier decision + summary |
| **`IibEnquiry`** | **`iib_enquiry`** | **IIB (Insurance Information Bureau) manual enquiry — one row per claim** (see §7.3) |
| `Telecalling` | `telecalling` | Telecalling outreach log |
| `SystemRemark`, `SystemAssessorRemark` | `system_remark`, `system_assessor_remark` | System/assessor remark logs |
| `StatusHistory` | `STATUS_HISTORY` | Claim status-change audit trail (feeds dashboard activity + admin) |
| `EagleScreen` | `eagle_screen` | Fraud/EAGLE screening data |
| `TrapScore` | `trap_score` | Fraud trap score |
| `CaseTrigger` | `case_trigger` | — |
| `PriorityFlag` | `caps_priority_master` | — |
| `ParallelPolicy` | `parallel_policies` | — |
| `AgentRepudiationHistory` | `agent_repudiation_history` | — |
| `HospitalDetails`, `DoctorDetails`, `WitnessDetails`, `IncomeDetails` | respective tables | Eagle-screen supporting evidence |
| `ProofDetails`, `InsuranceProofDetails` | `proof_details` (shared) | Proof-of-death/insurance evidence |
| `SmsScript` | `sms_script` | — |
| `CapsEmailCommMaster` | `caps_email_comm_master` | Email-comm templates |
| `Role`, `User` | roles, `users` | Auth |
| `UploadedDocuments`, `documentList.js`→`DocumentList` | `UploadedDocuments`, `DocumentList` | Document metadata |

**`models/add/`** (CAPS ADD): `CapsAddRawData`→`caps_add_raw_data` (raw ingested batch), `CapsAddDetails`→`caps_add_details` (main ADD case, incl. `exclusion_type_rule`), `CapsAddContractDetails`→`caps_add_contract_details`, `CapsAddLifeAssuredDetails`→`caps_add_life_assured_details`, `CapsAddExclusionMaster`→`caps_add_exclusion_master`, `CapsAddAssessorPoolCases`→`caps_add_assessor_pool_cases`, `CapsAddDecision`→`caps_add_decision`, `CapsAddDecisionMaster`→`caps_add_decision_master`, `CapsAddFindings`→`caps_add_findings`.

**`models/fraudPrevention/`**: `safeCity.js`, `safePincode.js`→`safe_pincode`.

---

## 7. Frontend (`life-claim-frontend/`)

### 7.1 Routing (`src/App.jsx`)

All pages lazy-loaded; wrapped `AuthProvider > ThemeProvider > ToastProvider > BrowserRouter`. `ProtectedRoute` checks auth + optional required role; `blockSuperUserOnly` redirects superuser-only accounts away from normal pages.

| Path | Component | Role |
|---|---|---|
| `/login` | `Login.jsx` | public |
| `/dashboard` | `Dashboard.jsx` | any authenticated |
| `/policy-search` | `PolicySearch.jsx` | Pre Assessor |
| `/claim-search` | `ClaimSearch.jsx` | any |
| `/registration`, `/registration/:claimId`→redirect | `Registration/index.jsx` | Pre Assessor |
| `/registration-fetch`, `/registration-fetch/:claimId`→redirect, `/claim-view/:claimId`→redirect | `ClaimView.jsx` | any |
| `/pool-selection` | `PoolSelection.jsx` | Assessor, Verifier |
| `/my-task` | `MyTask.jsx` | Assessor, Verifier |
| `/add-screen` | `AddScreen.jsx` | Assessor, Verifier |
| `/add-case`, `/case/:id`→redirect | `CaseDetails.jsx` | Assessor, Verifier |
| `/audit-log` | `AdminAuditLog.jsx` | superuser roles |
| `/superuser` | `AdminOverview.jsx` | superuser |
| `/superuser/claim-search` | `AdminClaimSearch.jsx` | superuser |
| `/superuser/workload` | `AdminWorkloadList.jsx` | superuser |
| `/profile` | `Profile.jsx` | any |
| `/admin*`, `/user-management`, `/user-manager`, `/admin-reports`, `/assessor-pool` | pure `<Navigate>` legacy aliases | — |

**Two distinct claim-registration URL families** (both live, non-PII — claim id passed via router `state`, not URL path):
- `/registration` — **new-claim wizard**, gated behind `RegisterFormGate` (policy lookup), 4 tabs: Demographics → Requirements → Assessment → Decision.
- `/registration-fetch` — **existing-claim workspace** (`ClaimView.jsx`), tabs backed by `components/claim/workspace/tabs/*`.

### 7.2 Pages (`src/pages/`)

Routed: `AddScreen`, `AdminAuditLog`, `AdminClaimSearch`, `AdminOverview`, `AdminWorkloadList`, `CaseDetails`, `ClaimSearch`, `ClaimView`, `Dashboard`, `Login`, `MyTask`, `PolicySearch`, `PoolSelection`, `Profile`, `Registration/*`.

**Dormant/orphaned (not in `App.jsx`, tracked in `src/config/legacyRoutes.js` → `DORMANT_FRONTEND_PAGES`)**: `InwardMail.jsx` (IMAP inbox, backend ingestion commented out), `HospitalContacts.jsx` (superseded by Eagle hospital table in workspace), `AdminReports.jsx` (route redirects to `/superuser` without rendering it), `UserManagement.jsx` (orphaned; `/user-management`/`/user-manager` redirect to `/superuser`), `components/DocumentUpload.jsx` (superseded by `DocumentSideSlider.jsx`).

### 7.3 Component groups (`src/components/`)

- Top-level shared UI: `AskMeChat`, `BrandLogo`, `Breadcrumbs`, `GlobalLoadingBar`, `HelpLink`, `RecaptchaField`, `Toast`.
- `components/add/` — CAPS/ADD screen (`AddCaseDetailPanel`, `AddUi`, `CapsDecisionPanel`, `DecisionQueueTab`, `ExcelAssignmentTab`, `addCaseMappers.js`) + `tabs/` (`ApproverPoolTab`, `AssessmentPoolTab`, `CaseAssignmentTab`, `CaseSearchTab`, `DataEntryUploaderTab`).
- `components/admin/` — `IntegrationsPanel.jsx`, `LegacyRoutesPanel.jsx` (render `config/integrations.js`/`config/legacyRoutes.js` for ops visibility).
- `components/claim/` — `ClaimAssignModal`, `ClaimFraudPreventionModal`, `ClaimHoverPreview`, `ClaimSuccessModal`, `FraudRuleManagerModal`, `TransactionDetailsModal`.
- `components/claim/workspace/` — `AcuityDecisionPanel`, `CaseSummaryPanel`, `DocumentSideSlider`, `EagleScreenSection`, `QuickAccessModal`, `workspaceUi.jsx` + `tabs/` (`DemographicsWorkspaceTab`, `RequirementsWorkspaceTab`, `AssessmentWorkspaceTab`, `DecisionWorkspaceTab`).

### 7.4 Registration wizard (`src/pages/Registration/`)

- `index.jsx` — orchestrator; owns flat `policyData` state, `activeTab`/`completedTabs`, `update(partial)` merge fn, tab-lock logic, `RegisterFormGate` pre-check.
- `DemographicsTab.jsx` (1336 lines) — Step 1.
- `RequirementsTab.jsx` (406 lines) — Step 2.
- `AssessmentTab.jsx` (304 lines) — Step 3, sub-tabs via `SubTabNav`: **Questions, IIB Enquiry, Telecalling, Remarks** (+ Fraud Remarks / Assessor Remarks shown only when `isAssessorPlus`).
- `DecisionTab.jsx` (359 lines) — Step 4, builds payload and submits (`buildRegistrationPayload` → `registerClaim`).
- `RegisterFormGate.jsx` (160 lines) — pre-wizard policy-number search/prefill.
- `shared.jsx` — shared styled inputs (`Field`, `Input`, `Select`, `Textarea`, `SubTabNav`, `Grid`, `Btn`, `InfoCard`, `useRegTokens`).

### 7.5 Services (`src/services/`, one file per feature area)

Use `util/ApiWrapper.js`'s `fetchWithToken` (or raw `fetch`/axios) against `${API_URL}/api/...`. Key ones: `adminService`, `api.js` (shared axios instance), `assessmentQuestionsService`, `assessorFetchService`, `authService` (Keycloak login/logout/session-check), `calculateAmountService`, `caseReasonsService`, `causeEventService`, `claimSearchService`, `claimsService`/`claimsServices` (near-duplicate names — both used, worth consolidating), `countriesService`, `dashboardService`, `documentPreviewService`, `documentService`, `fraudPreventionService`, `generalInfoService`, `historySearchService`, `hospitalContactService`, `mailService`, `masterService`, `mockServices`, `placeOfDeathService`, `policyService`, `poolSelectionService`, `registerPolicyService` (registration submit — 2 call sites), `roleService`, `statesService`, `systemDecisionAndReasonService`, `transactionDetailsLAService`, `trapScoreAdminService`/`trapScoreService`, `updatePolicyService` (workspace edits/submits), `userService`.

`src/services/add/`: `AssessmentPool.js`, `DataEntryUploadService.js`, `caseAssignmentService.js`, `decisionService.js`, `exclusionRulesService.js`, `searchCaseData.js`.

### 7.6 Context (`src/context/`)

- `AuthContext.jsx` — hydrates `user` from Keycloak session via `authService.authenticate()`; idle-timeout logout (`IDLE_TIMEOUT_MINUTES`, default 5, with 60s warning banner), cross-tab logout (`BroadcastChannel`), periodic session-check (`SESSION_CHECK_INTERVAL_MS`, default 90s) for concurrent-login detection, `login`/`logout`/`extendSession`, `hasRole()`.
- `ThemeContext.jsx` — light/dark, persisted to `localStorage`, drives `ui/pageTokens.js` design tokens used pervasively.

### 7.7 Config (`src/config/`)

`appEnv.js`, `askMeKnowledge.js`, `companyBrand.js`, `integrations.js` (feeds `docs/INTEGRATIONS.md` + `IntegrationsPanel`), `legacyRoutes.js` (feeds `docs/LEGACY_ROUTES.md` + `LegacyRoutesPanel` — canonical route table, aliases, dormant pages list), `recaptchaSiteKey.js`, `registrationCatalog.js` (static assessment-questions/requirements catalogs), `registrationNotificationDefaults.js`.

### 7.8 Notable util (`src/util/`, 43 files)

Registration/payload: `buildRegistrationPayload.js` (flat wizard state → backend payload — spreads all top-level scalar fields through untouched, only overrides specific nested sub-objects), `buildPolicyData.js`, `prefillRegistrationFromPolicy.js`, `registrationValidation.js`, `normalizeCauseEvent.js`, `normalizePolicyResponse.js`, `buildSystemDecision.js`. Auth/session: `authUser.js`, `authBroadcast.js`, `loginCrypto.js`, `loginHelpers.js`, `keycloakRoles.js`, `superuserRole.js`, `workflowRole(s).js`. Formatting: `formatProductName.js`, `formatRelativeTime.js`, `statusBadgeTone.js`, `claimDaysOpen.js`, `dashboardMetrics.js`, `eagleTableMappers.js`, etc. Docs/PDF: `downloadCaseSummaryPdf.js`, `downloadScnNoticePdf.js`, `pdfBranding.js`, `validateUploadFile.js`. Infra: `ApiWrapper.js`, `env.js`/`config.js`, `navigation.js` (`openClaimWorkspace` — canonical way to open `/registration-fetch` with claim id in router state).

---

## 8. Claim registration — full data flow (reference pattern)

Traced end-to-end using the **IIB Enquiry** sub-tab as the worked example (same pattern applies to Telecalling, Remarks, Questions, Requirements):

1. **UI state** (`pages/Registration/AssessmentTab.jsx`) — IIB Enquiry inputs are bound as **flat top-level keys** on the shared wizard state via inline `update({ [key]: value })`:

   | Field | State key |
   |---|---|
   | IIB Reference Number | `iibRefNo` |
   | Enquiry Date | `iibEnquiryDate` |
   | Enquiry Status | `iibStatus` |
   | No. of Policies Found | `iibPoliciesFound` |
   | Total Sum Assured (₹) | `iibTotalSA` |
   | Fraud Flag | `iibFraudFlag` |
   | Multiple Policy Detected | `iibMultiplePolicy` |
   | Non-Disclosure Detected | `iibNonDisclosure` |
   | IIB Remarks | `iibRemarks` |

2. **Merge** — `update()` (prop from `Registration/index.jsx`) merges each field into the single `policyData` object held by the wizard root.
3. **Payload build** — `DecisionTab.jsx`'s `handleSubmit` calls `buildRegistrationPayload({...data}, policy)` (`src/util/buildRegistrationPayload.js`), which spreads the whole flat wizard state through and only overrides specific nested sub-objects — the 9 `iib*` keys ride through untouched as top-level payload properties.
4. **Submit** — `services/claimsService.js` (or `registerPolicyService.js`) → `POST /api/register-claim`.
5. **Validation** — `registerClaimBodySchema` (`src/validation/registerClaimSchemas.js:73-82`) explicitly declares all 9 `iib*` fields with type/length constraints; root schema is `.unknown(true)` so nothing is silently stripped.
6. **Controller** — `registerClaimController.js:179-187` destructures all 9 fields from `req.body`.
7. **Persistence** — inside the single `sequelize.transaction()`, `registerClaimController.js:513-534` calls `IibEnquiry.create({ CLAIM_ID: String(claim.CLAIM_ID), IIB_REF_NO, IIB_ENQUIRY_DATE (via `sanitizeDbDate`), IIB_STATUS, IIB_POLICIES_FOUND (parsed int), IIB_TOTAL_SA (parsed float), IIB_FRAUD_FLAG, IIB_MULTIPLE_POLICY, IIB_NON_DISCLOSURE, IIB_REMARKS, CREATED_BY, MODIFIED_BY }, { transaction })`, linked to the just-created `claim.CLAIM_ID`.
8. **Model** — `src/models/IibEnquiry.js` → table `iib_enquiry`, columns match exactly.

**Status: this path is fully wired in the current codebase** — frontend state → payload → Joi schema → controller → Sequelize create, all under the one registration transaction, with `CLAIM_ID` correctly linked. If IIB rows are still observed missing in a running environment, the next things to check are *not* the code path above but: (a) whether the deployed frontend build (`life-claim-frontend/build/`) is stale relative to `src/`, (b) whether the transaction is rolling back on a *later* statement in the same `registerClaimController` flow (an error after line 534 would roll back the IIB insert along with everything else — check server logs for the actual thrown error on a failed registration), (c) whether `iib_enquiry` really is the table being queried in the environment where "no rows" was observed (vs. a stale replica/reporting DB).

**Note — shape inconsistency between wizard and workspace**: the *claim workspace* editor (`components/claim/workspace/tabs/AssessmentWorkspaceTab.jsx`) stores the same 9 fields **nested inside an array**, `assessment.iibEnquiryTable[0]`, patched via `onPatch({ iibEnquiryTable: [{ ...iibRow, [key]: val }] })`. Same key names, different container shape between the "register" (flat scalars) and "view/edit" (array-of-row) flows — worth normalizing if this becomes a maintenance pain point, but each side's own read/write path is internally consistent today.

---

## 9. Rules engine (`life-claim-rules/`) — ADD exclusion rules

Standalone Java Spring Boot + Drools microservice, port **8095**. Evaluates whether a CAPS ADD case should be excluded from assessment, replacing/paralleling an equivalent JS implementation kept in the Node backend as a fallback.

**Endpoints**:
- `GET /api/health` — unauthenticated liveness check (excluded from API-key check for ops monitoring).
- `POST /api/rules/add-exclusion` — sole business endpoint. Request (`AddExclusionRequest.java`): `caseId`, `contractPresent`/`lifeAssuredPresent` (bool), `claimType`, `policyStatus`, `rcdYears`, `annualPremium`/`premiumAmount`/`premiumFrequency`, `productCode`, `residentialStatus`, `advisorCode`, `partnerName`, `ageInYears`, plus 6 `List<String>` master-list fields carried over from the DB each call (engine itself is stateless). Response: `{ excluded, exclusionType, reasons[], engineVersion }` (`engineVersion` hardcoded `"1.0.0-add-exclusion-all"`).

**Security**: `config/ApiKeyInterceptor.java` requires header `X-Internal-Api-Key` == `RULES_ENGINE_API_KEY` env (default `dev-only-change-me`), enforced only on `/api/rules/**`. Added in the VAPT remediation commit — this endpoint is meant to be reachable only server-to-server from the Node backend.

**Backend integration**: `src/services/rulesEngineClient.js` (axios client, `RULES_ENGINE_URL`/`RULES_ENGINE_ENABLED`/`RULES_ENGINE_TIMEOUT_MS`/`RULES_ENGINE_API_KEY` env-driven) → `src/services/add/exclusionRulesService.js`'s `checkForExclusionRule(caseId)`: pulls case/contract/life-assured rows, computes `rcdYears`/`annualPremium`/`ageInYears`, loads 6 master lists from `CapsAddExclusionMaster`, calls Drools **if enabled**. **JS fallback** (`applyExclusionRulesJs`, same file) duplicates the identical rule logic — used automatically if the Drools call throws, or unconditionally if `RULES_ENGINE_ENABLED=false`. Result written back to `caps_add_details.exclusion_type_rule`.

**Rule logic** (`src/main/resources/rules/add-exclusion.drl`, all rules share `activation-group "add-exclusion"` — only the first match wins; ordered by `salience`):

| Salience | Rule | Condition | Exclusion type |
|---|---|---|---|
| 100 | Claim received | `claimType` in `claimReceivedValues` | "Claim Received" |
| 90 | Inactive policy | `policyStatus` in `inactivePolicyStatusValues` | "In-active policy status" |
| 80 | RCD > 3yr | `contractPresent && rcdYears >= 3` | "RCD more than 3 years" |
| 70 | Premium > 5L savings | `contractPresent`, premium fields > 0, product code starts E/U, `annualPremium >= 500000` | "Annual Premium > 5 lakh saving cases" |
| 60 | NRI | `lifeAssuredPresent && residentialStatus == "N"` | "NRI customer" |
| 50 | Top advisor | `advisorCode` in `topAdvisorValues` | "Top advisor" |
| 40 | Partner exclusion | `partnerName` in `partnerExclusionValues` | "Partner Exclusion" |
| 30 | Product norms | code in `productNormsValues` or starts G/I | "Product Norms" |
| 20 | Minor life assured | `lifeAssuredPresent && 0 < ageInYears <= 18` | "Minor Life Assured" |
| 10 | ULIP | code in `ulipPolicyValues` | "ULIP Policy" |

All list matches case-insensitive/trimmed. No rule firing → `excluded=false`, case proceeds normally. See `life-claim-backend/EXCLUSION_RULES_IMPLEMENTATION.md` for the originating feature writeup (models, DAO, controller, routes for the surrounding CAPS ingestion pipeline).

**Verification harness**: `life-claim-backend/scripts/verify-drools-e2e.js` — checks JS-fallback/Drools parity across 6 scenarios + a live DB spot-check against the 3 most recent `caps_add_details` rows; calls `/api/health` first and aborts if unreachable. Run via `npm run test:e2e-drools`.

---

## 10. Security posture (VAPT remediation — current HEAD)

The repo's current head commit (`c16c63f`, "Remediate remaining 12 VAPT findings") fixed:
- **High**: removed hardcoded reCAPTCHA secret from the frontend bundle (replaced with hash-based misconfig detection); added the shared-secret `X-Internal-Api-Key` requirement on the Java rules-engine endpoints.
- **Medium**: input validation added to `roleController`/`commonRoutes`/`mailsController`; standardized error-detail exposure across controllers behind `EXPOSE_ERROR_DETAIL` (prevents stack-trace/internal-IP leakage); randomized default password for newly created users; added HSTS + Referrer-Policy headers; added Redis-backed session store with automatic in-memory fallback.
- **Low**: show actual previous-login time on Profile; fail closed if `ALLOW_CAPTCHA_BYPASS=true` alongside `NODE_ENV=production`; removed two unused dead-code files.

`life-claim-backend/scripts/security-e2e.js` is the regression suite guarding these fixes (`npm run test:e2e-security`) — a live-server VAPT check hitting a running backend over http(s), supporting legacy login, Keycloak login, or pre-minted bearer tokens (`E2E_ASSESSOR_TOKEN`/`E2E_SUPERUSER_TOKEN`/`E2E_SKIP_LOGIN=true`).

**Note on git history**: the repo currently has only 2 commits (`d0604b7` bulk checkpoint import of the pre-existing POC, then `c16c63f` the VAPT fix). There is no deeper commit-by-commit history to mine for feature evolution — everything before the VAPT fix is one squash-imported snapshot. If a fuller history is needed, it may exist in an upstream/origin repo not present in this working copy — don't assume it's unrecoverable without checking with the team.

---

## 11. Known gaps / things to verify before relying on them

- **No `.env.example` anywhere** (frontend, backend, or repo root) despite `ENV.md`'s own "New machine setup" section instructing to copy one — a fresh clone has no documented way to bootstrap env config. Needs either creating the example files or fixing the doc.
- **`RULES_ENGINE_API_KEY`** is referenced by `ENV.md` and required by both `rulesEngineClient.js` and the Java `application.properties`, but is **not set** in `life-claim-backend/.env` — both sides are silently running on the `dev-only-change-me` default rather than a real shared secret.
- Env vars present in `.env` but undocumented in `ENV.md`/`docs/INTEGRATIONS.md`: `ENVIRONMENT1`, `AUDIT_TRACKED_USERS`, `PROD_DOCUMENT_STORAGE_LOCATION`, `TXN_PORT`, and the VAPT-added security vars `KEYCLOAK_LOCKOUT_*`, `ACCOUNT_LOCKOUT_*`, `RATE_LIMIT_AUTH_MAX`, `AUDIT_SESSION_TTL_MINUTES`, `JWT_SECRET`.
- `migrations/` directory exists but is empty — schema is not tracked as migrations; Sequelize models can drift from the real DB silently (`sequelize.sync()` is commented out).
- Two near-duplicate frontend services: `services/claimsService.js` vs `services/claimsServices.js`, and two registration-submit call sites (`registerPolicyService.js` and calls inside `claimsService.js`) — worth consolidating if touched again.
- `services/claimDetailService.js` / `services/claimWorkspaceService.js` had no direct fetch calls found in a quick pass — likely thin re-export wrappers; confirm before assuming they're dead code.
- No TODO/FIXME/HACK/XXX markers exist anywhere in `life-claim-backend/src` or `life-claim-frontend/src` — either genuinely clean or stripped during the squash-import; don't rely on grepping for these to find pending work.
- `sequelize` and `mysql2` raw-pool are both live against the same tables in different code paths (§5.5) — when changing a column, grep both the Sequelize model **and** any raw-SQL DAO touching that table.

---

## 12. Demo accounts (dev/SIT)

Password for all: `password123`.

| Username | Role |
|---|---|
| `preassessor` | Pre Assessor |
| `assessor` | Assessor |
| `verifier` | Verifier |
| `admin` | Admin/superuser |
