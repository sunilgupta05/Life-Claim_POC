# Service Exposure & Network Segmentation (roadmap 3.7)

A review of which services are **external** (must be reachable by end users) vs
**internal** (backend-only dependencies that should never be exposed to the public
internet), plus the segmentation controls in place and recommended.

## Trust-boundary matrix

| Service | Port | Class | Reached by | Auth | Exposure recommendation |
|---------|------|-------|-----------|------|-------------------------|
| **Backend API** (`life-claim-backend`) | 3010 | **External** | Browsers (frontend) | Keycloak/JWT bearer, default-deny `/api` gate | Public via HTTPS. Only this + Keycloak should be internet-facing. |
| **Keycloak** | 8081 | **External** | Browsers (login redirect), backend | Realm auth | Public via HTTPS (IdP). |
| **Frontend** (static build) | 5174 dev | **External** | Browsers | — | Served as static assets (or by the backend via `FRONTEND_BUILD_PATH`). |
| **MySQL** (`claims_poc`) | 3306 | **Internal** | Backend only (`DB_*`) | DB credentials | Bind to private network; never expose publicly. |
| **RabbitMQ** | 5672 / 15672 | **Internal** | Backend + worker (`RABBITMQ_URL`) | broker credentials | Private network only. Management UI (15672) internal-only. |
| **Alfresco DMS** | 8080 | **Internal** | Backend proxy only (`DOCUMENT_VIEWER_IP`) | DMS ticket | Private network. Browser reaches documents **only** through the backend proxy (`/api/upload`, `/api/document`). |
| **Transaction API** (Life Asia) | 3003 | **Internal** | Backend only (`TXN_API_BASE_URL`) | network | Private network / VPN to the Life Asia environment. |
| **WhatsApp gateway** | 3002 | **Internal** | Backend + worker (`WHATSAPP_API_URL`) | gateway | Private network. |
| **Rules engine** (Drools) | 8095 | **Internal** | Backend only (`RULES_ENGINE_URL`) | `X-Internal-Api-Key` | Private network; already requires an internal API key. |
| **Redis** (optional) | 6379 | **Internal** | Backend (`REDIS_URL`) | — | Private network only. |

**Principle:** the browser talks only to the **Backend API** and **Keycloak**.
Everything else is a backend-only dependency and belongs behind the internal
network boundary. The backend acts as the gateway/proxy for Alfresco documents.

## Controls in place

- **Edge hardening** (`app.js`): Helmet (CSP built from the Keycloak + CORS
  origins), strict CORS allow-list (wildcard rejected), HSTS, `noSniff`,
  frameguard, Permissions-Policy, and early **path-traversal** blocking.
- **Default-deny API auth**: every `/api/*` route requires a valid bearer token
  except a small public allow-list (`requireApiAuth`).
- **HTTPS-only auth** in production (`REQUIRE_HTTPS_AUTH`).
- **Rate limiting** on `/api` (`apiLimiter`).
- **Service-to-service auth**: the rules engine call carries `X-Internal-Api-Key`.
- **Internal-only guard** (`middleware/requireInternal.js`): a reusable trust
  boundary for ops/service endpoints — allows loopback + RFC-1918 private ranges
  (configurable via `INTERNAL_ALLOWED_CIDRS`) or a matching `X-Internal-Api-Key`
  (`INTERNAL_API_KEY`), and returns 403 otherwise.
- **Startup exposure audit** (`util/exposureAudit.js`): logs a segmentation review
  at boot — flags any backend-only dependency whose configured host is **not** on
  a private range, and checks the public-facing hardening flags.

## Recommended deployment segmentation

1. Place MySQL, RabbitMQ, Alfresco, the Transaction API, the WhatsApp gateway,
   Redis and the rules engine on a **private subnet**; open their ports only to
   the backend/worker security group.
2. Expose only the **Backend API** and **Keycloak** through the load balancer,
   over HTTPS, with `CORS_ALLOWED_ORIGINS` set to the real public origins.
3. Set `INTERNAL_API_KEY` and use `requireInternal()` on any future ops/automation
   endpoint that must be callable service-to-service but not by end users.
4. Keep the RabbitMQ **management UI** (15672) internal-only.

## Config keys (3.7)

| Key | Default | Meaning |
|-----|---------|---------|
| `INTERNAL_ALLOWED_CIDRS` | loopback + RFC-1918 | Comma-separated CIDRs treated as internal by `requireInternal`. |
| `INTERNAL_API_KEY` | *(unset)* | Shared secret accepted in `X-Internal-Api-Key` for internal endpoints. |
