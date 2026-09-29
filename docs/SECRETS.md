# Secrets Management (roadmap 4.5)

Move secrets out of `.env` for production without changing application code.

## How it works

All sensitive values are read through **one accessor** — `secrets.get('NAME')`
(`src/config/secrets.js`) — instead of `process.env.NAME`. A pluggable provider,
selected by `SECRETS_PROVIDER`, decides where the value comes from. Every provider
falls back to `process.env`, so the default behaviour is identical to today.

| `SECRETS_PROVIDER` | Source | Extra config |
|--------------------|--------|--------------|
| `env` (default) | `.env` / process env | — |
| `file` | Docker/K8s secrets mounted as files | `SECRETS_DIR` (one file per secret) **or** `SECRETS_FILE` (a JSON file) |
| `vault` | HashiCorp Vault KV v2 | `VAULT_ADDR`, `VAULT_TOKEN`, `VAULT_KV_MOUNT` (default `secret`), `VAULT_SECRET_PATH` (default `life-claim`) — needs `npm i node-vault` |
| `aws` | AWS Secrets Manager | `AWS_REGION`, `AWS_SECRET_ID` (default `life-claim`) — needs `@aws-sdk/client-secrets-manager` |

`secrets.init()` runs at startup (best-effort — a misconfigured vault never takes
the app down; it logs and falls back to `.env`).

## Known secrets (seed these in your vault)

`DB_PASSWORD`, `JWT_SECRET`, `SESSION_SECRET`, `RULES_ENGINE_API_KEY`,
`INTERNAL_API_KEY`, `DMS_USER_ID`, `DMS_PASSWORD`, `EMAIL_ID`, `EMAIL_PASS`,
`RECAPTCHA_SECRET`, `KEYCLOAK_CLIENT_SECRET`, `RABBITMQ_PASS`, `REDIS_PASSWORD`.

## Examples

**Docker / Kubernetes secrets (file provider):**
```bash
SECRETS_PROVIDER=file
SECRETS_DIR=/run/secrets        # each file named after the secret, e.g. /run/secrets/DB_PASSWORD
```

**HashiCorp Vault:**
```bash
npm i node-vault
SECRETS_PROVIDER=vault
VAULT_ADDR=https://vault.internal:8200
VAULT_TOKEN=<token or use an agent>
VAULT_SECRET_PATH=life-claim
# vault kv put secret/life-claim DB_PASSWORD=... JWT_SECRET=...
```

## Migration checklist

1. Seed the secrets into your vault/KMS (keys above).
2. Set `SECRETS_PROVIDER` + provider config; remove the secret lines from `.env`.
3. Restart. `GET /api/health/ready` and a login confirm the app resolved them.
4. Rotate: because reads are at call-time, most secrets refresh on the next
   `secrets.init()` (restart or scheduled reload) without a code change.

> Secrets are **never** stored in the `app_config` DB table (that's for non-secret
> runtime settings, 0.3). The two stores are deliberately separate.
