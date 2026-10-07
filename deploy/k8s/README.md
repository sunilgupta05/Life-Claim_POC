# Life Claims — Kubernetes Deployment

One command deploys the whole app — **backend** (API), **worker** (notifications),
**rules** (Drools) and **frontend** (nginx) — from the Docker Hub images:

| Component | Image | Port | Service (in-cluster DNS) |
|-----------|-------|------|--------------------------|
| backend | `guptasunil05/life-claim-backend:v1.0.0` | 3010 | `backend:3010` |
| worker | `guptasunil05/life-claim-backend:v1.0.0` (cmd `node src/workers/notificationWorker.js`) | — | — |
| rules | `guptasunil05/life-claim-rules:v1.0.0` | 8095 | `rules:8095` |
| frontend | `guptasunil05/life-claim-frontend:v1.0.0` | 80 | `frontend:80` |

**RabbitMQ** (notification queue) runs in the cluster for the `server` and
`local` overlays (`addons/rabbitmq`, image `rabbitmq:3.13-management`, using
`RABBITMQ_USER` / `RABBITMQ_PASS` from `.env`). MySQL, Redis, Keycloak, the
Transaction API and Alfresco are **not** deployed here — the app uses the existing ones configured in
`life-claim-backend/.env` (currently `192.168.60.62`). The cluster must be able
to reach them.

## Deploy (one command)

From the repo root, with `kubectl` pointing at a working cluster
(`kubectl get nodes` shows `Ready`):

| Where | Command | Portal URL |
|-------|---------|------------|
| **Office server 192.168.60.62** (Windows + minikube) | `.\deploy\k8s\deploy.ps1 -Env server` | `http://192.168.60.62:8088` from any PC on the LAN |
| Laptop test | `.\deploy\k8s\deploy.ps1 -Env local -PortForward` | `http://localhost:8088` |
| Real cluster + domain | `.\deploy\k8s\deploy.ps1 -Env production` | `https://<your-domain>` |

If PowerShell blocks scripts, prefix with
`powershell -ExecutionPolicy Bypass -File`. Linux/macOS: `./deploy/k8s/deploy.sh <env>`.

The script:
1. on minikube, loads any missing image into the cluster (pulls it on the host first)
2. creates namespace `life-claim`
3. creates/updates Secret `life-claim-secrets` from `life-claim-backend/.env`
   (never committed). For `server`/`local`, `localhost` / `127.0.0.1` hosts in
   `.env` are rewritten to the real host (`192.168.60.62` /
   `host.minikube.internal`) — inside a pod, `localhost` is the pod itself
4. `kubectl apply -k deploy/k8s/overlays/<env>`
5. restarts backend/worker/rules only if the effective `.env` changed
6. waits until all pods are ready and prints how to open the app

It is idempotent — re-run it after editing `.env` or releasing a new image tag.

## Server 192.168.60.62 — portal for the whole office, 24x7

One-time setup on the server:

1. Docker Desktop → Settings → General → **Start Docker Desktop when you sign in** = on.
2. minikube cluster (no internet needed inside it):
   ```powershell
   minikube start --driver=docker --memory=4096 --cpus=2 --cni=bridge
   ```
3. Deploy:
   ```powershell
   cd C:\projects\claude-poc-fresh
   powershell -ExecutionPolicy Bypass -File .\deploy\k8s\deploy.ps1 -Env server
   ```
4. Publish to the LAN — **PowerShell as Administrator**, once:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\deploy\k8s\server\install-autostart.ps1
   ```
   This opens port 8088 in Windows Firewall and registers the scheduled task
   `LifeClaim-Portal`, which runs `server/expose.ps1` hidden at sign-in: it
   starts minikube after a reboot and keeps `svc/frontend` published on
   `0.0.0.0:8088`, reconnecting automatically. Log:
   `C:\ProgramData\LifeClaim\expose.log`.

Open **http://192.168.60.62:8088** from any PC on the network. The server must
stay signed in (a locked screen is fine). No `npm start` / `npm run dev` /
`start-rules.bat` is needed — Kubernetes runs all four components.

Updates later: change `.env` or bump `newTag` in `overlays/server/kustomization.yaml`,
then re-run step 3. Uninstall the publisher: `install-autostart.ps1 -Uninstall`.

The `server` overlay is the production base (probes, non-root, read-only FS,
NetworkPolicies, 2 backend + 2 frontend replicas, zero-downtime rollouts) over
plain HTTP, so it keeps `NODE_ENV=development` — with `production` the backend
refuses login over HTTP. Full production mode needs HTTPS: use the
`production` overlay with a domain.

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
├── addons/rabbitmq/              in-cluster broker (server + local overlays)
├── overlays/
│   ├── production/               Ingress (TLS), HPA, PDB, domain CORS, image tags
│   ├── server/                   office server 192.168.60.62, http://192.168.60.62:8088
│   └── local/                    1 replica each, HTTP via port-forward
├── server/
│   ├── install-autostart.ps1     firewall + scheduled task (run once as Administrator)
│   └── expose.ps1                keeps the portal published on :8088 (started by the task)
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
| backend `0/1 Running` | `/api/health/ready` failing. Check: `kubectl -n life-claim exec deploy/backend -- printenv DB_HOST` — must not be `localhost` (re-run deploy.ps1, it rewrites it) and must be reachable from the pod |
| worker `CrashLoopBackOff` | `kubectl -n life-claim logs deploy/worker` — usually RabbitMQ unreachable (`RABBITMQ_URL` in `.env`) |
| Setting ignored in the cluster | The admin **Settings** page stores values in the DB table `app_config`, which wins over `.env` and the ConfigMap. A saved `RULES_ENGINE_URL` / `KEYCLOAK_URL` / `RABBITMQ_URL` with `localhost` breaks pods — clear it there |
| Portal not opening from other PCs | `Get-ScheduledTask LifeClaim-Portal`, read `C:\ProgramData\LifeClaim\expose.log`, check firewall rule "Life Claim portal 8088" |
| minikube `NotReady`, `cni plugin not initialized` | `minikube delete --all --purge`, then start with `--cni=bridge` |
| PVC `Pending` | No ReadWriteMany storage class → see checklist item 5 |
| Login returns "Secure transport required" | Production overlay reached over plain HTTP — use the HTTPS Ingress, or the `local` overlay |
| minikube: `apiserver process never appeared` / `bootstrap-kubelet.conf: no such file` | Stale old cluster: `minikube delete`, then `minikube start --driver=docker --memory=4096 --cpus=2` |
| Docker Desktop: `detected cgroup v1` | Add `kernelCommandLine = cgroup_no_v1=all` under `[wsl2]` in `%USERPROFILE%\.wslconfig`, `wsl --shutdown`, restart Docker Desktop |
