# Life Claims — Deployment & Operations Runbook (roadmap 4.9)

Everything needed to stand up and operate the Life Claims system in a client
environment. See also: [SERVICE_EXPOSURE.md](SERVICE_EXPOSURE.md),
[OBSERVABILITY.md](OBSERVABILITY.md), [SECRETS.md](SECRETS.md),
[SECURITY_REVIEW.md](SECURITY_REVIEW.md), and the migration guide in
`life-claim-backend/migrations/README.md`.

## 1. Architecture & ports

| Component | Port | Notes |
|-----------|------|-------|
| Backend API | 3010 | Express; HTTP behind proxy, HTTPS standalone |
| Frontend (nginx) | 80 (host `FRONTEND_PORT`, default 8088) | serves SPA + proxies `/api` |
| Notification worker | — | separate process; required for queued notifications |
| MySQL | 3306 | `claims_poc` schema |
| RabbitMQ | 5672 / 15672 | broker / management UI |
| Redis | 6379 | sessions + config bus (optional) |
| Keycloak | 8081 | external IdP |
| Transaction API / Alfresco / WhatsApp / Rules | 3003 / 8080 / 3002 / 8095 | external integrations |

Only the **frontend** and **Keycloak** face users; everything else is internal.

## 2. Deploy (Docker, single host)

```bash
cp .env.example .env                              # compose vars (DB/Rabbit passwords, ports)
# edit life-claim-backend/.env for integration URLs + secrets (or use a vault, see SECRETS.md)
docker compose up -d --build
docker compose exec backend npm run migrate       # apply DB schema (first run + upgrades)
docker compose ps                                 # all healthy?
curl -k http://localhost:8088/api/health          # -> {"status":"ok"}
```

Images are also built in CI (`.github/workflows/docker.yml`) and pushed to GHCR on `v*` tags.

## 3. Deploy (manual / no Docker)

```bash
# backend
cd life-claim-backend && npm ci && npm run migrate && npm start
cd life-claim-backend && npm run start:worker      # separate process
# frontend
cd life-claim-frontend && npm ci && npm run build   # serve build/ via nginx or FRONTEND_BUILD_PATH
```

## 4. First-run checklist

- [ ] `.env` set (DB, `RABBITMQ_URL`, integration URLs); secrets via provider (`SECRETS_PROVIDER`).
- [ ] `npm run migrate` reports all migrations applied.
- [ ] `REQUIRE_HTTPS_AUTH=true`, `EXPOSE_ERROR_DETAIL=false`, `API_DOCS_ENABLED=false`, `CORS_ALLOWED_ORIGINS` set (prod).
- [ ] Default/dev secrets rotated (`RULES_ENGINE_API_KEY`, session/JWT).
- [ ] Worker running (queued notifications) and Prometheus scraping `/api/metrics`.
- [ ] Superuser can reach `/superuser/health` (all integrations) and `/superuser/settings`.

## 5. Health & monitoring

- Liveness: `GET /api/health` · Readiness (DB+config): `GET /api/health/ready`.
- Integrations + breaker state: `GET /api/health/integrations` (superuser) or the **Integration Health** screen.
- Metrics: `GET /api/metrics` (internal-only) → Prometheus; alert rules in [OBSERVABILITY.md](OBSERVABILITY.md).
- Logs: rotate under `LOG_DIR` (default `life-claim-backend/logs`); ship via `LOG_HTTP_HOST`. Filter by `X-Request-Id`.

## 6. Common operations

| Task | Command |
|------|---------|
| Tail backend logs | `docker compose logs -f backend` |
| Restart a service | `docker compose restart backend` |
| Apply a new migration | `docker compose exec backend npm run migrate` |
| Roll back last migration | `docker compose exec backend npm run migrate:down` |
| Scale the worker | `docker compose up -d --scale worker=3` |
| Change a setting at runtime | IT Admin → **System Settings** (`/superuser/settings`) — hot-reloads |
| Change log level live | System Settings → `LOG_LEVEL` |
| Rotate a secret | update vault/`.env`, then `docker compose restart backend worker` |
| Inspect failed notifications | RabbitMQ UI → `notifications.dlq` (3.6) |

## 7. Incident runbook

**Backend down** (`up==0`): `docker compose ps`; `logs backend`; check DB reachable (`/api/health/ready`); restart. If crash-looping, check `.env` + migrations.

**Integration breaker OPEN** (`integration_breaker_state>0`): the dependency is failing — the app fails fast by design. Check that integration's health card + endpoint (System Settings), fix/restart the dependency; the breaker half-opens and closes automatically on recovery.

**Queue backing up / notifications not sent**: ensure the **worker** is running; check RabbitMQ health; inspect `notifications.dlq` for poison messages (they carry `x-error`). Re-drive after fixing the cause.

**DB errors on every request**: check MySQL health/disk; verify `DB_*`; confirm migrations applied.

**Disk filling from logs**: rotation is on by default (`LOG_MAX_SIZE`/`LOG_MAX_FILES`); lower retention or point `LOG_DIR` at a larger volume; ensure the legacy unbounded `application.log` is gone (now rotated, 3.4).

**Suspected data-exposure**: confirm internal services aren't publicly reachable (see SERVICE_EXPOSURE.md); rotate `INTERNAL_API_KEY` + affected secrets; review access logs by `X-Request-Id`.

## 8. Backup & restore

```bash
# backup
docker compose exec mysql mysqldump -u root -p"$DB_ROOT_PASSWORD" claims_poc > backup-$(date +%F).sql
# restore
docker compose exec -T mysql mysql -u root -p"$DB_ROOT_PASSWORD" claims_poc < backup-YYYY-MM-DD.sql
```

Also back up: `life-claim-backend/uploads/` (branding logos), the RabbitMQ + Redis volumes, and your secrets store. Schedule daily DB dumps; test a restore quarterly.

## 9. Rollback

- **App:** `docker compose pull` a previous image tag (or check out the prior release) and `up -d`.
- **Schema:** `npm run migrate:down` reverses the last migration (all Phase 0–3 migrations are reversible). Roll app + schema back together.
