#!/usr/bin/env bash
# One-command Kubernetes deploy for Life Claims — same steps as deploy.ps1.
#   ./deploy/k8s/deploy.sh [production|local] [path/to/backend.env]
# Idempotent: re-run after changing .env or bumping image tags in the overlay.
set -euo pipefail

ENVIRONMENT="${1:-production}"
K8S_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$K8S_DIR/../.." && pwd)"
ENV_FILE="${2:-$REPO_ROOT/life-claim-backend/.env}"
NS=life-claim
OVERLAY="$K8S_DIR/overlays/$ENVIRONMENT"

step() { printf '\n==> %s\n' "$*"; }

[[ "$ENVIRONMENT" == production || "$ENVIRONMENT" == local ]] || { echo "usage: $0 [production|local] [env-file]"; exit 2; }
[[ -f "$ENV_FILE" ]] || { echo "Backend env file not found: $ENV_FILE"; exit 1; }

step "Checks"
kubectl get nodes
echo "Context: $(kubectl config current-context)   Overlay: $ENVIRONMENT   Env file: $ENV_FILE"

step "Namespace"
kubectl apply -f "$K8S_DIR/base/namespace.yaml"

step "Secret life-claim-secrets (from .env)"
kubectl -n "$NS" create secret generic life-claim-secrets --from-env-file="$ENV_FILE" \
  --dry-run=client -o yaml | kubectl apply -f -

step "Apply manifests ($OVERLAY)"
kubectl apply -k "$OVERLAY"

step "Roll pods if .env changed"
HASH="$(sha256sum "$ENV_FILE" | cut -c1-16)"
for d in backend worker rules; do
  kubectl -n "$NS" patch deployment "$d" --type merge \
    -p "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"life-claim/env-hash\":\"$HASH\"}}}}}" >/dev/null
done

step "Waiting for rollout (first image pull can take a few minutes)"
for d in rules backend worker frontend; do
  if ! kubectl -n "$NS" rollout status "deployment/$d" --timeout=600s; then
    echo "$d did not become ready. Diagnose with:"
    echo "  kubectl -n $NS get pods; kubectl -n $NS describe deploy/$d; kubectl -n $NS logs deploy/$d"
    exit 1
  fi
done

step "Done"
kubectl -n "$NS" get pods,svc,ingress
if [[ "$ENVIRONMENT" == local ]]; then
  echo "Open the app:  kubectl -n $NS port-forward svc/frontend 8088:80   ->  http://localhost:8088"
else
  echo "Point your domain's DNS at the ingress controller's external IP, then open https://<your-domain>"
fi
