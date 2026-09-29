#!/usr/bin/env bash
# Seed Life Claims secrets into the dev Vault (roadmap 4.5).
# Usage: ./deploy/vault/seed.sh   (with the vault overlay running)
set -euo pipefail

export VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"
export VAULT_TOKEN="${VAULT_TOKEN:-root}"
SECRET_PATH="${VAULT_SECRET_PATH:-life-claim}"

# Generate a PII encryption key if not supplied.
PII_KEY="${PII_ENCRYPTION_KEY:-$(openssl rand -base64 32)}"

vault kv put "secret/${SECRET_PATH}" \
  DB_PASSWORD="${DB_PASSWORD:-change-me}" \
  JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}" \
  SESSION_SECRET="${SESSION_SECRET:-$(openssl rand -hex 32)}" \
  RULES_ENGINE_API_KEY="${RULES_ENGINE_API_KEY:-$(openssl rand -hex 24)}" \
  INTERNAL_API_KEY="${INTERNAL_API_KEY:-$(openssl rand -hex 24)}" \
  PII_ENCRYPTION_KEY="${PII_KEY}"

echo "Seeded secret/${SECRET_PATH}. Verify: vault kv get secret/${SECRET_PATH}"
