<#
.SYNOPSIS
  Keeps the Life Claims portal published on http://<server-ip>:8088 for the LAN.

.DESCRIPTION
  Runs forever (started at logon by install-autostart.ps1):
    1. waits for Docker Desktop
    2. starts minikube if it is stopped (e.g. after a reboot) — the pods come
       back on their own once the cluster is up
    3. publishes svc/frontend on 0.0.0.0:8088 with kubectl port-forward
    4. if the forward drops (pod restart, rollout, cluster restart), retries
  Log: %ProgramData%\LifeClaim\expose.log
#>
param(
  [int]$Port = 8088,
  [string]$Namespace = 'life-claim'
)

$minikubeDir = 'C:\Program Files\Kubernetes\Minikube'
if ((Test-Path $minikubeDir) -and ($env:Path -notlike "*$minikubeDir*")) { $env:Path += ";$minikubeDir" }

$logDir = Join-Path $env:ProgramData 'LifeClaim'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir 'expose.log'
function Log($msg) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg" | Add-Content -Path $log }

Log "expose.ps1 started (port $Port)"
while ($true) {
  docker info --format '{{.ServerVersion}}' *> $null
  if ($LASTEXITCODE -ne 0) { Log 'Docker not running yet, waiting...'; Start-Sleep 15; continue }

  kubectl get nodes *> $null
  if ($LASTEXITCODE -ne 0) {
    Log 'Cluster not reachable, running minikube start...'
    minikube start *>> $log
    Start-Sleep 10
    continue
  }

  Log "Publishing svc/frontend on 0.0.0.0:$Port"
  kubectl -n $Namespace port-forward --address 0.0.0.0 svc/frontend "${Port}:80" *>> $log
  Log 'port-forward exited, retrying in 5 s'
  Start-Sleep 5
}
