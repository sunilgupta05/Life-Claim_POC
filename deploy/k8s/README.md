# Life Claims — Kubernetes Deployment

One command deploys the whole app — **backend** (API), **worker** (notifications),
**rules** (Drools) and **frontend** (nginx) — from the Docker Hub images:

| Component | Image | Port | Service (in-cluster DNS) |
|-----------|-------|------|--------------------------|
| backend | `guptasunil05/life-claim-backend:v1.0.0` | 3010 | `backend:3010` |
| worker | `guptasunil05/life-claim-backend:v1.0.0` (cmd `node src/workers/notificationWorker.js`) | — | — |
| rules | `guptasunil05/life-claim-rules:v1.0.0` | 8095 | `rules:8095` |
| frontend | `guptasunil05/life-claim-frontend:v1.0.0` | 80 | `frontend:80` |

MySQL, Redis, RabbitMQ, Keycloak, the Transaction API and Alfresco are **not**
deployed here — the app uses the existing ones configured in
`life-claim-backend/.env` (currently `192.168.60.62`). The cluster must be able
to reach them.

## Deploy (one command)

From the repo root, with `kubectl` pointing at a working cluster
(`kubectl get nodes` shows `Ready`):

```powershell
# Local test cluster (minikube / Docker Desktop) — opens http://localhost:8088
.\deploy\k8s\deploy.ps1 -Env local -PortForward

# Production (Ingress + HTTPS + autoscaling)
.\deploy\k8s\deploy.ps1 -Env production
```

Linux/macOS: `./deploy/k8s/deploy.sh local` or `./deploy/k8s/deploy.sh production`.

The script:
1. creates namespace `life-claim`
2. creates/updates Secret `life-claim-secrets` from `life-claim-backend/.env` (never committed)
3. `kubectl apply -k deploy/k8s/overlays/<env>` — creates every Deployment, Service, ConfigMap, PVC, NetworkPolicy (+ Ingress, HPA, PDB in production)
4. restarts backend/worker/rules only if `.env` changed
5. waits until all pods are ready and prints how to open the app

It is idempotent — re-run it after editing `.env` or releasing a new image tag.

## Layout

```
deploy/k8s/
├── deploy.ps1 / deploy.sh        one-command deploy
├── base/                         shared, production-grade manifests
│   ├── namespace.yaml            Pod Security Admission labels
│   ├── configmap.yaml            container-only overrides (rules URL, HTTP inside cluster, ...)
│   ├── storage.yaml              PVC for logo uploads (uploads/branding)
│   ├── backend.yaml              Deployment + Service (probes, non-root, read-only FS)
│   ├── worker.yaml               notification worker Deployment
│   ├── rules.yaml                Drools Deployment + Service
│   ├── frontend.yaml             nginx Deployment + Service
│   └── networkpolicy.yaml        default-deny + allow-lists
├── overlays/
│   ├── production/               Ingress (TLS), HPA, PDB, domain CORS, image tags
│   └── local/                    1 replica each, HTTP via port-forward
└── optional/
    ├── cluster-issuer.yaml       Let's Encrypt issuer for cert-manager
    └── data.yaml                 in-cluster MySQL/RabbitMQ/Redis (not used by default)
```

### How configuration is resolved

Each backend/worker pod gets `envFrom: [Secret life-claim-secrets, ConfigMap life-claim-config]`.
The ConfigMap is listed last, so it overrides the few `.env` keys that are wrong
inside a cluster: `RULES_ENGINE_URL=http://rules:8095`, `USE_HTTPS=false`,
`NODE_ENV`, `TRUST_PROXY`, `REQUIRE_HTTPS_AUTH`, `LOG_TO_FILE=false`,
`CORS_ALLOWED_ORIGINS`. Everything else comes from `.env` unchanged.

## Production checklist

1. **Domain** — replace `claims.example.com` in `overlays/production/ingress.yaml`
   and in the CORS patch in `overlays/production/kustomization.yaml`.
2. **Ingress controller** — install ingress-nginx (namespace `ingress-nginx`;
   the NetworkPolicies allow traffic from it):
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
   ```
3. **TLS** — install cert-manager and apply `optional/cluster-issuer.yaml` (set
   your email), or create secret `life-claim-tls` yourself (see `ingress.yaml`).
4. **metrics-server** — needed by the HPAs.
5. **RWX storage** — `backend-uploads` is ReadWriteMany; set `storageClassName`
   in `base/storage.yaml` if your default class is RWO-only.
6. **Secrets** — set strong `RULES_ENGINE_API_KEY`, `INTERNAL_API_KEY`,
   `JWT_SECRET`, `SESSION_SECRET` in `.env` before deploying. For a vault, see
   `docs/SECRETS.md` (`SECRETS_PROVIDER`).
7. **Login RSA keys** — the backend image v1.0.0 contains
   `keys/login_private.pem`. Generate a new pair, put it in `.env` as
   `LOGIN_RSA_PRIVATE_KEY` / `LOGIN_RSA_PUBLIC_KEY` (env wins over the baked
   files), rebuild the frontend with the matching `VITE_LOGIN_RSA_PUBLIC_KEY`,
   and add `keys` to `life-claim-backend/.dockerignore`.
8. **Migrations** — the DB is shared with the existing deployment; only run
   pending ones:
   ```bash
   kubectl -n life-claim exec deploy/backend -- npm run migrate:status
   kubectl -n life-claim exec deploy/backend -- npm run migrate
   ```

## Release a new version

```bash
docker build -t guptasunil05/life-claim-backend:v1.0.1 ./life-claim-backend
docker push guptasunil05/life-claim-backend:v1.0.1
```
Set `newTag: v1.0.1` for that image in the overlay's `kustomization.yaml`, then
re-run the deploy script. Roll back:
```bash
kubectl -n life-claim rollout undo deployment/backend
```

## Handy commands

```bash
kubectl -n life-claim get pods,svc,ingress
kubectl -n life-claim logs deploy/backend -f
kubectl -n life-claim logs deploy/rules -f
kubectl -n life-claim describe pod <pod-name>
kubectl delete -k deploy/k8s/overlays/local          # remove everything
```

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| `ImagePullBackOff` | Tag not on Docker Hub, or repo private → add an image pull secret |
| `CreateContainerConfigError` | Secret `life-claim-secrets` missing → run the deploy script |
| backend `0/1 Running` | `/api/health/ready` failing — DB/Redis on 192.168.60.62 unreachable from the cluster; check `kubectl logs deploy/backend` |
| PVC `Pending` | No ReadWriteMany storage class → see checklist item 5 |
| Login returns "Secure transport required" | Production overlay reached over plain HTTP — use the HTTPS Ingress, or the `local` overlay |
| minikube: `apiserver process never appeared` / `bootstrap-kubelet.conf: no such file` | Stale old cluster: `minikube delete`, then `minikube start --driver=docker --memory=4096 --cpus=2` |
| Docker Desktop: `detected cgroup v1` | Add `kernelCommandLine = cgroup_no_v1=all` under `[wsl2]` in `%USERPROFILE%\.wslconfig`, `wsl --shutdown`, restart Docker Desktop |
