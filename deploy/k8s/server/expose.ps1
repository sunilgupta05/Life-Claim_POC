<#
.SYNOPSIS
  Keeps the Life Claims portal published for the LAN:
    https://<server-ip>:8443   (portal)
    http://<server-ip>:8088    (redirects to the HTTPS URL)

.DESCRIPTION
  Runs forever (started at logon by install-autostart.ps1):
    1. waits for Docker Desktop
    2. starts minikube if it is stopped (e.g. after a reboot) — the pods come
       back on their own once the cluster is up
    3. publishes svc/edge (the HTTPS gateway) on 0.0.0.0 with kubectl port-forward
    4. if the forward drops (pod restart, rollout, cluster restart), retries
  Log: %ProgramData%\LifeClaim\expose.log
#>
param(
  [int]$HttpPort = 8088,
  [int]$HttpsPort = 8443,
  [string]$Namespace = 'life-claim'
)

$minikubeDir = 'C:\Program Files\Kubernetes\Minikube'
if ((Test-Path $minikubeDir) -and ($env:Path -notlike "*$minikubeDir*")) { $env:Path += ";$minikubeDir" }

$logDir = Join-Path $env:ProgramData 'LifeClaim'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log = Join-Path $logDir 'expose.log'
function Log($msg) { "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg" | Add-Content -Path $log }

Log "expose.ps1 started (http $HttpPort, https $HttpsPort)"
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

  Log "Publishing svc/edge on 0.0.0.0:$HttpPort (http) and 0.0.0.0:$HttpsPort (https)"
  kubectl -n $Namespace port-forward --address 0.0.0.0 svc/edge "${HttpPort}:80" "${HttpsPort}:443" *>> $log
  Log 'port-forward exited, retrying in 5 s'
  Start-Sleep 5
}
