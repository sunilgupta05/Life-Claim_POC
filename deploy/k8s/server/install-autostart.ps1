<#
.SYNOPSIS
  One-time server setup (run as Administrator) so the portal is reachable from
  other PCs at https://<server-ip>:8443 (http://<server-ip>:8088 redirects) and
  stays up across reboots. Safe to re-run — do so after updating expose.ps1.

.DESCRIPTION
  1. Opens TCP 8088 and 8443 inbound in Windows Firewall
  2. Stops a previous publisher (task + its kubectl port-forward), then registers
     scheduled task "LifeClaim-Portal" that runs expose.ps1 hidden at logon of
     the current user (Docker Desktop also runs in the user session), restarts it
     if it fails, and starts it right now.

  Requirements for 24x7:
   - Docker Desktop > Settings > General > "Start Docker Desktop when you sign in" ON
   - the server stays signed in (locking the screen is fine; signing out is not)

  Remove:  .\install-autostart.ps1 -Uninstall
#>
param(
  [int]$HttpPort = 8088,
  [int]$HttpsPort = 8443,
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
$taskName = 'LifeClaim-Portal'
$ports = @($HttpPort, $HttpsPort)

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Run this script in PowerShell opened with "Run as Administrator".'
}

function Stop-Publisher {
  Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  # The task's kubectl child can outlive it and keep the ports busy.
  Get-CimInstance Win32_Process -Filter "Name = 'kubectl.exe'" |
    Where-Object { $_.CommandLine -like '*port-forward*life-claim*' } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

if ($Uninstall) {
  Stop-Publisher
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
  foreach ($p in $ports) {
    Get-NetFirewallRule -DisplayName "Life Claim portal $p" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
  }
  Write-Host "Removed task $taskName and firewall rules for ports $($ports -join ', ')."
  return
}

Write-Host "==> Firewall: allow inbound TCP $($ports -join ', ')"
foreach ($p in $ports) {
  $rule = "Life Claim portal $p"
  if (-not (Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $rule -Direction Inbound -Protocol TCP -LocalPort $p -Action Allow -Profile Any | Out-Null
  }
}

Write-Host "==> Stopping a previous publisher (if any)"
Stop-Publisher

Write-Host "==> Scheduled task $taskName (at logon of $env:USERDOMAIN\$env:USERNAME)"
$script = Join-Path $PSScriptRoot 'expose.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`" -HttpPort $HttpPort -HttpsPort $HttpsPort"
$trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) `
  -MultipleInstances IgnoreNew
$taskPrincipal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings `
  -Principal $taskPrincipal -Force | Out-Null

Write-Host "==> Starting it now"
Start-ScheduledTask -TaskName $taskName

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notlike 'vEthernet*' } | Select-Object -First 1).IPAddress
Write-Host "`nDone. In ~30 s the portal is at https://${ip}:$HttpsPort (http://${ip}:$HttpPort redirects)." -ForegroundColor Green
Write-Host "The certificate is self-signed: browsers show a warning once - choose Advanced > Proceed."
Write-Host "Log: $env:ProgramData\LifeClaim\expose.log"
