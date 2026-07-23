# Section L — Legacy / dormant routes (v2 POC)

What is **not** in the v2 router, what **superseded** v1 patterns, and what IT must restore before re-enabling features.

## L1 — Three eras (v2 view)

| Era | Status in this repo |
|-----|---------------------|
| **A — Active life-claims UI** | `App.jsx` routes only (see `src/config/legacyRoutes.js`) |
| **B — Dual claim flows (both live)** | Pre Assessor **wizard** `/registration` vs workspace **`/registration-fetch/:claimNo`** |
| **C — Hospital / inward / provider** | **No v2 routes**; some pages kept for IT re-enable |

v2 **does not** copy v1’s commented `App.js` block at file bottom — dormant list is documentation + unrouted files.

## L2 — Active v2 routes

| Path | Page | Notes |
|------|------|--------|
| `/dashboard` | Dashboard | |
| `/policy-search` | Policy Search | Pre Assessor |
| `/registration` | Registration wizard | Tabs in one shell (not `/claimant-details`, …) |
| `/claim-search` | Claim Search | |
| `/registration-fetch/:claimId` | ClaimView | Replaces v1 `RegistrationDuplicate` + `*-fetch` tabs |
| `/pool-selection` | PoolSelection | v1 `/assessor-pool` redirects here |
| `/my-task` | MyTask | |
| `/add-screen` | ADD / CAPS | |
| `/case/:id` | CAPS case detail | |
| `/admin`, `/admin/claim-search` | Admin | |
| `/audit-log`, `/user-management` | Sessions / user CRUD | |
| `/login`, `/profile` | Auth / profile | |

Aliases: `/claim-view/:id` → workspace, `/user-manager` → user-management, `/admin/*` redirects.

## L3 — v1 comment-block routes (not in v2)

v1 `App.js` listed these **after** `export default` in a comment — components mostly **deleted** from repo:

`/home`, `/event`, `/loanCalculator`, `/hospitalSearch`, `/case-init`, `/provider-master`, `/health-checkup`, `/MainDetails`, `/HospitalCI`, `/Infrastructure`, `/GeneralInfo`, `/ClientCI`, `/Surgery`, `/PackageTarrif`, `/RoomTarrif`, `/Financial`, …

**Do not document these as user menu items.**

## L4 — Inward mail (dormant UI, partial API)

| Piece | Status |
|-------|--------|
| `pages/InwardMail.jsx` | Built (v2 UI), **not routed** |
| `GET /api/mail`, `/api/attachment` | Mounted; **legacy `authMiddleware`** (HS256 JWT) |
| `emailService.handleNewMail()` | **Commented** in `app.js` |

Re-enable: add route + sidebar; migrate mail routes to Keycloak `protect()` or dual-token support.

## L5 — Hospital / provider (dormant UI)

| Piece | Status |
|-------|--------|
| `pages/HospitalContacts.jsx` | **Not routed** — CRM email/fax/contact via `/api/app` |
| `commonRoutes.js` | `general-info/*` **mounted** under `/api/app` |
| Eagle **hospital table** | **Active** in claim workspace (`EagleScreenSection`) — claim data, not hospital master search |

v2 removed `HospitalProvider` wrapper (v1 only).

## L6 — Registration architecture (v2 simplified)

### Pre Assessor — new claim

- **One route:** `/registration` (+ optional `/registration/:claimId` view)
- **Tabs inside page:** Demographics → Requirements → Assessment → Decision
- **Entry:** Policy Search → navigate with policy state

### Existing claim — workspace

- **One route:** `/registration-fetch/:claimNo` → `ClaimView.jsx`
- **Tabs inside page:** Demographics, Requirements, Assessment, Decision & Summary
- **Entry:** Claim Search, My Task, Pool

v1’s many URLs (`/eagle-screen-fetch`, `/assessment-fetch`, …) are **gone** — do not train users on them in v2.

## L7 — Other stubs in v2 shell

| Item | Status |
|------|--------|
| **Ask Me** (`AskMeChat.jsx`) | Floating preview; canned replies; labeled “no backend” |
| **`DocumentUpload.jsx`** | Orphaned; use `DocumentSideSlider` on workspace |
| **`AdminReports.jsx`** | Not routed; `/admin-reports` → `/admin` |
| **`/components` demo** | **Removed** from v2 `App.jsx` |

## L8 — Backend with little/no v2 UI

| API | Notes |
|-----|--------|
| `/api/mail`, `/api/attachment` | Inward |
| `/api/app/*` | Hospital contacts; legacy JWT |
| `/api/claims/assignClaim` | Stub; admin uses `/api/admin/claims/assign` |
| CAPS `case-assignment/add` | **Added** in v2 POC (Section I) |

## L9 — User manual: include vs exclude

**Include:** Sections B–K active routes and two URL families (`/registration` vs `/registration-fetch`).

**Exclude / IT only:** Inward, hospital master modules, v1 comment-block menus, Ask Me as AI product.

**Hospital on claims:** Eagle tab in workspace only.

## L10 — Admin reference

**Admin → Overview** includes a **Legacy & dormant routes** panel. Source: `src/config/legacyRoutes.js`.
