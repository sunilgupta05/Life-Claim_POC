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

  Inside a pod `localhost` is the pod itself, so for -Env server/local every
  `localhost` / `127.0.0.1` host in .env (DB_HOST, REDIS_URL, RABBITMQ_URL,
  KEYCLOAK_URL, ...) is rewritten to -HostAddress before the Secret is created.
  The .env file on disk is not modified.

  On minikube, images missing from the cluster are pulled on this PC and
  loaded with `minikube image load` (the cluster may not reach Docker Hub).

  Safe to re-run: every step is idempotent. Re-run it after changing .env or
  bumping image tags in the overlay's kustomization.yaml.

.EXAMPLE
  .\deploy\k8s\deploy.ps1 -Env server          # on 192.168.60.62 -> http://192.168.60.62:8088
.EXAMPLE
  .\deploy\k8s\deploy.ps1 -Env local -PortForward
.EXAMPLE
  .\deploy\k8s\deploy.ps1 -Env production
#>
param(
  [ValidateSet('production', 'server', 'local')]
  [string]$Env = 'production',
  [string]$EnvFile,
  # Where services that .env calls "localhost" really live, as seen from a pod.
  [string]$HostAddress,
  [switch]$PortForward
)

$ErrorActionPreference = 'Stop'
$Namespace = 'life-claim'
$K8sDir = $PSScriptRoot
$RepoRoot = Split-Path (Split-Path $K8sDir -Parent) -Parent
if (-not $EnvFile) { $EnvFile = Join-Path $RepoRoot 'life-claim-backend\.env' }
$Overlay = Join-Path $K8sDir "overlays\$Env"
if (-not $HostAddress) {
  $HostAddress = @{ server = '192.168.60.62'; local = 'host.minikube.internal' }[$Env]
}
$minikubeDir = 'C:\Program Files\Kubernetes\Minikube'
if ((Test-Path $minikubeDir) -and ($env:Path -notlike "*$minikubeDir*")) { $env:Path += ";$minikubeDir" }

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

if ($ctx -eq 'minikube') {
  Step "Images in minikube"
  # Windows PowerShell 5.1 turns redirected native stderr into terminating
  # errors under 'Stop'; these probes are allowed to fail.
  $ErrorActionPreference = 'Continue'
  $wanted = kubectl kustomize $Overlay | Select-String -Pattern '^\s*-?\s*image:\s*(\S+)' |
    ForEach-Object { $_.Matches[0].Groups[1].Value } | Sort-Object -Unique
  $present = minikube image ls 2>$null
  foreach ($img in $wanted) {
    if ($present -match [regex]::Escape($img)) { Write-Host "ok      $img"; continue }
    docker image inspect $img *> $null
    if ($LASTEXITCODE -ne 0) { docker pull $img; Check "docker pull $img" }
    Write-Host "loading $img"
    minikube image load $img
    Check "minikube image load $img"
  }
  $ErrorActionPreference = 'Stop'
}

Step "Namespace"
kubectl apply -f (Join-Path $K8sDir 'base\namespace.yaml')
Check 'namespace'

Step "Secret life-claim-secrets (from .env)"
$secretEnv = $EnvFile
if ($HostAddress) {
  $text = [IO.File]::ReadAllText($EnvFile)
  $rewritten = [regex]::Replace($text, '(?m)(?<=[=/@])(localhost|127\.0\.0\.1)(?=[:/,\s]|$)', $HostAddress)
  if ($rewritten -ne $text) { Write-Host "localhost / 127.0.0.1 in .env -> $HostAddress (inside the cluster only)" }
  $secretEnv = Join-Path $env:TEMP 'life-claim-cluster.env'
  [IO.File]::WriteAllText($secretEnv, $rewritten)
}
kubectl -n $Namespace create secret generic life-claim-secrets --from-env-file="$secretEnv" --dry-run=client -o yaml | kubectl apply -f -
Check 'secret'

Step "Apply manifests ($Overlay)"
kubectl apply -k $Overlay
Check 'kubectl apply -k'

Step "Roll pods if .env or the ConfigMap changed"
# Pods read both at start-up only, so fold both into one hash on the pod template.
$configMap = kubectl -n $Namespace get configmap life-claim-config -o jsonpath='{.data}'
Check 'read configmap'
$sha = [Security.Cryptography.SHA256]::Create()
$bytes = [Text.Encoding]::UTF8.GetBytes([IO.File]::ReadAllText($secretEnv) + "`n" + ($configMap -join "`n"))
$hash = (($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 16)
if ($secretEnv -ne $EnvFile) { Remove-Item $secretEnv -ErrorAction SilentlyContinue }
$patchFile = Join-Path $env:TEMP 'life-claim-env-hash.json'
"{`"spec`":{`"template`":{`"metadata`":{`"annotations`":{`"life-claim/env-hash`":`"$hash`"}}}}}" |
  Set-Content -Path $patchFile -Encoding ascii
foreach ($d in 'backend', 'worker', 'rules') {
  kubectl -n $Namespace patch deployment $d --type merge --patch-file $patchFile | Out-Null
  Check "patch $d"
}
Remove-Item $patchFile -ErrorAction SilentlyContinue

Step "Waiting for rollout (first pull of the images can take a few minutes)"
$deployments = kubectl -n $Namespace get deployments -o name | ForEach-Object { $_ -replace '^deployment\.apps/', '' }
# Broker first (the worker needs it), then the app tier.
$order = @('rabbitmq', 'rules', 'backend', 'worker', 'frontend') | Where-Object { $deployments -contains $_ }
foreach ($d in $order) {
  $timeout = if ($d -eq 'rabbitmq') { '1500s' } else { '600s' }   # broker's first boot is slow on a loaded host
  kubectl -n $Namespace rollout status deployment/$d "--timeout=$timeout"
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

if ($Env -eq 'server') {
  $task = Get-ScheduledTask -TaskName 'LifeClaim-Portal' -ErrorAction SilentlyContinue
  if ($task) {
    Write-Host "`nPortal: http://${HostAddress}:8088  (published 24x7 by task LifeClaim-Portal)" -ForegroundColor Green
  } else {
    Write-Host "`nOne-time step to publish http://${HostAddress}:8088 to the network (PowerShell as Administrator):" -ForegroundColor Yellow
    Write-Host "  powershell -ExecutionPolicy Bypass -File $K8sDir\server\install-autostart.ps1"
  }
  if ($PortForward) { kubectl -n $Namespace port-forward --address 0.0.0.0 svc/frontend 8088:80 }
} elseif ($Env -eq 'local') {
  Write-Host "`nOpen the app:  kubectl -n $Namespace port-forward svc/frontend 8088:80   ->  http://localhost:8088" -ForegroundColor Green
  if ($PortForward) { kubectl -n $Namespace port-forward svc/frontend 8088:80 }
} else {
  Write-Host "`nPoint your domain's DNS at the ingress controller's external IP, then open https://<your-domain>" -ForegroundColor Green
}
