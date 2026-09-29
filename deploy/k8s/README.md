# Life Claims — Kubernetes Deployment

Deploy the whole project (backend API + notification worker + rules engine +
frontend + MySQL/RabbitMQ/Redis) to Kubernetes. Works on Docker Desktop
Kubernetes, minikube, or any real cluster.

## Files

| File | What it contains |
|------|------------------|
| `app.yaml` | Namespace, ConfigMap, Secret, and the app tier: **backend**, **worker**, **rules**, **frontend** (+ Services, Ingress, HPA) |
| `data.yaml` | In-cluster **MySQL** (PVC) + **RabbitMQ** + **Redis** (skip if you use managed DB/queue) |
| `kustomization.yaml` | Ties both together so `kubectl apply -k` deploys everything at once |

---

## Step 1 — Build the 3 images and push to Docker Hub

Replace `DOCKERHUB_USER` with your Docker Hub username everywhere below.

```bash
# build
docker build -t DOCKERHUB_USER/life-claim-backend:latest  ./life-claim-backend
docker build -t DOCKERHUB_USER/life-claim-frontend:latest ./life-claim-frontend
docker build -t DOCKERHUB_USER/life-claim-rules:latest    ./life-claim-rules

# push (docker login first)
docker login
docker push DOCKERHUB_USER/life-claim-backend:latest
docker push DOCKERHUB_USER/life-claim-frontend:latest
docker push DOCKERHUB_USER/life-claim-rules:latest
```

Then set the same username in `kustomization.yaml` → `images:` (replace
`DOCKERHUB_USER`). Now the cluster pulls the images from Docker Hub — you do NOT
need Docker on the server, only `kubectl`.

> Tip: use a version tag (`:v2.0.0`) instead of `:latest` for deterministic rollouts.

## Step 2 — Set the secrets

Edit `app.yaml` → the `Secret` named `life-claim-secrets` and replace every
`change-me`:

```yaml
stringData:
  DB_PASSWORD: "<strong-password>"
  JWT_SECRET: "<random-long-string>"
  SESSION_SECRET: "<random-long-string>"
  RULES_ENGINE_API_KEY: "<random-string>"     # backend + rules must match (they read the same key)
  INTERNAL_API_KEY: "<random-string>"
  PII_ENCRYPTION_KEY: "<`openssl rand -base64 32`>"
```

> For real production, don't commit secrets — use Sealed Secrets / External
> Secrets / a vault (`SECRETS_PROVIDER=vault`, see `docs/SECRETS.md`).

## Step 3 — Deploy everything (one command)

```bash
kubectl apply -k deploy/k8s
```

*(Prefer plain `-f`? `kubectl apply -f deploy/k8s/data.yaml -f deploy/k8s/app.yaml`)*

Watch pods come up:

```bash
kubectl -n life-claim get pods -w
```

Wait until backend, worker, rules, frontend, mysql, rabbitmq, redis are all
`Running` / `READY 1/1`.

## Step 4 — Initialize the database (first deploy only)

```bash
kubectl -n life-claim exec deploy/backend -- npm run migrate
```

## Step 5 — Open the app

```bash
kubectl -n life-claim port-forward svc/frontend 8088:80
# browser → http://localhost:8088
```

For a real cluster, use the Ingress instead (Step 7).

---

## Important config choices

### Login (Keycloak) — pick ONE

Keycloak is **not** deployed in-cluster. In `app.yaml` → ConfigMap:

- **Use your existing Keycloak:** set `KEYCLOAK_URL` to a host the pods can reach.
- **Skip Keycloak (local DB login):** add `AUTH_METHOD: "local"` to the ConfigMap.
  Then the demo users (`admin` / `assessor` / `verifier` / `preassessor`,
  password `password123`) sign in against the DB — no Keycloak needed.

### HTTPS auth

`REQUIRE_HTTPS_AUTH` is `"false"` in the ConfigMap so `port-forward` (plain HTTP)
works. Set it to `"true"` once you serve the app over TLS (via the Ingress).

---

## Step 7 (production) — Ingress + TLS

The `Ingress` in `app.yaml` routes `claims.example.com` → frontend. To use it:

1. Install an ingress controller (e.g. `ingress-nginx`):
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
   ```
2. Change the host in `app.yaml` (`claims.example.com`) to your real domain and
   provide the TLS secret `life-claim-tls` (e.g. via cert-manager).
3. Point DNS at the ingress controller's external IP.

## Using a registry (real cluster)

Push the images and set the tags in `kustomization.yaml` (`images:` block):

```bash
docker tag  life-claim-backend:latest  ghcr.io/OWNER/REPO/life-claim-backend:v2.0.0
docker push ghcr.io/OWNER/REPO/life-claim-backend:v2.0.0     # repeat for frontend + rules
```

Then uncomment + edit the `images:` overrides in `kustomization.yaml` and
`kubectl apply -k deploy/k8s` again.

---

## Handy commands

```bash
kubectl -n life-claim get all                       # everything
kubectl -n life-claim logs deploy/backend -f        # backend logs
kubectl -n life-claim logs deploy/rules -f          # rules engine logs
kubectl -n life-claim rollout restart deploy/backend
kubectl delete -k deploy/k8s                         # tear everything down
```
