<#
.SYNOPSIS
  One-time server setup (run as Administrator) so the portal is reachable from
  other PCs at http://<server-ip>:8088 and stays up across reboots.

.DESCRIPTION
  1. Opens TCP <Port> inbound in Windows Firewall
  2. Registers scheduled task "LifeClaim-Portal" that runs expose.ps1 hidden at
     logon of the current user (Docker Desktop also runs in the user session),
     restarts it if it fails, and starts it right now.

  Requirements for 24x7:
   - Docker Desktop > Settings > General > "Start Docker Desktop when you sign in" ON
   - the server stays signed in (locking the screen is fine; signing out is not)

  Remove:  .\install-autostart.ps1 -Uninstall
#>
param(
  [int]$Port = 8088,
  [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
$taskName = 'LifeClaim-Portal'
$ruleName = "Life Claim portal $Port"

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Run this script in PowerShell opened with "Run as Administrator".'
}

if ($Uninstall) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
  Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
  Write-Host "Removed task $taskName and firewall rule '$ruleName'."
  return
}

Write-Host "==> Firewall: allow inbound TCP $Port"
if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -Profile Any | Out-Null
}

Write-Host "==> Scheduled task $taskName (at logon of $env:USERDOMAIN\$env:USERNAME)"
$script = Join-Path $PSScriptRoot 'expose.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`" -Port $Port"
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
Write-Host "`nDone. In ~30 s the portal is at http://${ip}:$Port from any PC on the network." -ForegroundColor Green
Write-Host "Log: $env:ProgramData\LifeClaim\expose.log"
