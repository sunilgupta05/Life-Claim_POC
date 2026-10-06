<#
.SYNOPSIS
  One-command Kubernetes deploy for Life Claims (backend, worker, rules, frontend).

.DESCRIPTION
  1. Creates the life-claim namespace
  2. Creates/updates Secret life-claim-secrets from life-claim-backend\.env
  3. Applies deploy\k8s\overlays\<Env> (Deployments, Services, ConfigMap, PVC,
     NetworkPolicies; production adds Ingress, HPA, PDB)
  4. Restarts backend/worker/rules only when .env changed
  5. Waits until every Deployment is ready and prints how to open the app

  Safe to re-run: every step is idempotent. Re-run it after changing .env or
  bumping image tags in the overlay's kustomization.yaml.

.EXAMPLE
  .\deploy\k8s\deploy.ps1 -Env local -PortForward
.EXAMPLE
  .\deploy\k8s\deploy.ps1 -Env production
#>
param(
  [ValidateSet('production', 'local')]
  [string]$Env = 'production',
  [string]$EnvFile,
  [switch]$PortForward
)

$ErrorActionPreference = 'Stop'
$Namespace = 'life-claim'
$K8sDir = $PSScriptRoot
$RepoRoot = Split-Path (Split-Path $K8sDir -Parent) -Parent
if (-not $EnvFile) { $EnvFile = Join-Path $RepoRoot 'life-claim-backend\.env' }
$Overlay = Join-Path $K8sDir "overlays\$Env"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Check($what) { if ($LASTEXITCODE -ne 0) { throw "$what failed (exit $LASTEXITCODE)" } }

Step "Checks"
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) { throw 'kubectl not found in PATH.' }
if (-not (Test-Path $EnvFile)) { throw "Backend env file not found: $EnvFile" }
$ctx = kubectl config current-context
Check 'kubectl config current-context'
kubectl get nodes | Out-Host
Check "Cluster '$ctx' is not reachable (kubectl get nodes)"
Write-Host "Context: $ctx   Overlay: $Env   Env file: $EnvFile"

Step "Namespace"
kubectl apply -f (Join-Path $K8sDir 'base\namespace.yaml')
Check 'namespace'

Step "Secret life-claim-secrets (from .env)"
kubectl -n $Namespace create secret generic life-claim-secrets --from-env-file="$EnvFile" --dry-run=client -o yaml | kubectl apply -f -
Check 'secret'

Step "Apply manifests ($Overlay)"
kubectl apply -k $Overlay
Check 'kubectl apply -k'

Step "Roll pods if .env changed"
$hash = (Get-FileHash $EnvFile -Algorithm SHA256).Hash.Substring(0, 16).ToLower()
$patchFile = Join-Path $env:TEMP 'life-claim-env-hash.json'
"{`"spec`":{`"template`":{`"metadata`":{`"annotations`":{`"life-claim/env-hash`":`"$hash`"}}}}}" |
  Set-Content -Path $patchFile -Encoding ascii
foreach ($d in 'backend', 'worker', 'rules') {
  kubectl -n $Namespace patch deployment $d --type merge --patch-file $patchFile | Out-Null
  Check "patch $d"
}
Remove-Item $patchFile -ErrorAction SilentlyContinue

Step "Waiting for rollout (first pull of the images can take a few minutes)"
foreach ($d in 'rules', 'backend', 'worker', 'frontend') {
  kubectl -n $Namespace rollout status deployment/$d --timeout=600s
  if ($LASTEXITCODE -ne 0) {
    Write-Host "`n$d did not become ready. Diagnose with:" -ForegroundColor Red
    Write-Host "  kubectl -n $Namespace get pods"
    Write-Host "  kubectl -n $Namespace describe deploy/$d"
    Write-Host "  kubectl -n $Namespace logs deploy/$d"
    exit 1
  }
}

Step "Done"
kubectl -n $Namespace get pods,svc,ingress | Out-Host

if ($Env -eq 'local') {
  Write-Host "`nOpen the app:  kubectl -n $Namespace port-forward svc/frontend 8088:80   ->  http://localhost:8088" -ForegroundColor Green
  if ($PortForward) { kubectl -n $Namespace port-forward svc/frontend 8088:80 }
} else {
  Write-Host "`nPoint your domain's DNS at the ingress controller's external IP, then open https://<your-domain>" -ForegroundColor Green
}
