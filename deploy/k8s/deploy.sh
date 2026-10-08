#!/usr/bin/env bash
# One-command Kubernetes deploy for Life Claims — same steps as deploy.ps1.
#   ./deploy/k8s/deploy.sh [production|server|local] [path/to/backend.env]
# Idempotent: re-run after changing .env or bumping image tags in the overlay.
# HOST_ADDRESS=<ip> overrides where .env "localhost" services live (server/local).
set -euo pipefail

ENVIRONMENT="${1:-production}"
K8S_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$K8S_DIR/../.." && pwd)"
ENV_FILE="${2:-$REPO_ROOT/life-claim-backend/.env}"
NS=life-claim
OVERLAY="$K8S_DIR/overlays/$ENVIRONMENT"

step() { printf '\n==> %s\n' "$*"; }

[[ "$ENVIRONMENT" =~ ^(production|server|local)$ ]] || { echo "usage: $0 [production|server|local] [env-file]"; exit 2; }
[[ -f "$ENV_FILE" ]] || { echo "Backend env file not found: $ENV_FILE"; exit 1; }

# Inside a pod `localhost` is the pod itself: point .env localhost hosts at the real host.
case "$ENVIRONMENT" in
  server) HOST_ADDR="${HOST_ADDRESS:-192.168.60.62}" ;;
  local)  HOST_ADDR="${HOST_ADDRESS:-host.minikube.internal}" ;;
  *)      HOST_ADDR="${HOST_ADDRESS:-}" ;;
esac

step "Checks"
kubectl get nodes
echo "Context: $(kubectl config current-context)   Overlay: $ENVIRONMENT   Env file: $ENV_FILE"

step "Namespace"
kubectl apply -f "$K8S_DIR/base/namespace.yaml"

step "Secret life-claim-secrets (from .env)"
SECRET_ENV="$ENV_FILE"
if [[ -n "$HOST_ADDR" ]]; then
  SECRET_ENV="$(mktemp)"
  sed -E "s#([=/@])(localhost|127\.0\.0\.1)([:/,[:space:]]|\$)#\1${HOST_ADDR}\3#g" "$ENV_FILE" > "$SECRET_ENV"
fi
kubectl -n "$NS" create secret generic life-claim-secrets --from-env-file="$SECRET_ENV" \
  --dry-run=client -o yaml | kubectl apply -f -

step "Apply manifests ($OVERLAY)"
kubectl apply -k "$OVERLAY"

step "Roll pods if .env or the ConfigMap changed"
# Pods read both at start-up only, so fold both into one hash on the pod template.
HASH="$( { cat "$SECRET_ENV"; kubectl -n "$NS" get configmap life-claim-config -o jsonpath='{.data}'; } | sha256sum | cut -c1-16)"
[[ "$SECRET_ENV" != "$ENV_FILE" ]] && rm -f "$SECRET_ENV"
for d in backend worker rules; do
  kubectl -n "$NS" patch deployment "$d" --type merge \
    -p "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"life-claim/env-hash\":\"$HASH\"}}}}}" >/dev/null
done

step "Waiting for rollout (first image pull can take a few minutes)"
# Broker first (the worker needs it), then the app tier.
for d in rabbitmq rules backend worker frontend; do
  kubectl -n "$NS" get deployment "$d" >/dev/null 2>&1 || continue
  if ! kubectl -n "$NS" rollout status "deployment/$d" --timeout=600s; then
    echo "$d did not become ready. Diagnose with:"
    echo "  kubectl -n $NS get pods; kubectl -n $NS describe deploy/$d; kubectl -n $NS logs deploy/$d"
    exit 1
  fi
done

step "Done"
kubectl -n "$NS" get pods,svc,ingress
if [[ "$ENVIRONMENT" == server ]]; then
  echo "Publish on the LAN:  kubectl -n $NS port-forward --address 0.0.0.0 svc/frontend 8088:80   ->  http://$HOST_ADDR:8088"
elif [[ "$ENVIRONMENT" == local ]]; then
  echo "Open the app:  kubectl -n $NS port-forward svc/frontend 8088:80   ->  http://localhost:8088"
else
  echo "Point your domain's DNS at the ingress controller's external IP, then open https://<your-domain>"
fi
