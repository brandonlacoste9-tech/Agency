# agents/github-pr-manager/setup-pm2.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Push-Location (Split-Path -Path $MyInvocation.MyCommand.Path -Parent)  # script dir

Write-Host "`n[1/10] Deleting existing pm2 entries for github-pr-manager..."
npx pm2 delete github-pr-manager 2>$null | Out-Null
npx pm2 delete all 2>$null | Out-Null

Write-Host "`n[2/10] Killing node processes on ports 3000/3001 (if any)..."
$pids = (Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess) -as [int[]]
if ($pids -and $pids.Length -gt 0) {
  foreach ($pid in $pids | Sort-Object -Unique) {
    try { Stop-Process -Id $pid -Force -ErrorAction Stop; Write-Host " -> Stopped PID $pid" }
    catch { Write-Host " -> Failed to stop PID ${pid}: $($_.Exception.Message)" }
  }
} else {
  Write-Host " -> No processes listening on 3000/3001"
}

Write-Host "`n[3/10] Flushing pm2 logs..."
npx pm2 flush

Write-Host "`n[4/10] Ensure dist/index.js exists (build if missing)..."
if (-not (Test-Path ".\dist\index.js")) {
  Write-Host " -> Running npm ci and npm run build..."
  npm ci
  npm run build
  if (-not (Test-Path ".\dist\index.js")) {
    Write-Host "ERROR: Build failed; dist/index.js still missing." -ForegroundColor Red
    Pop-Location; exit 1
  }
} else {
  Write-Host " -> dist/index.js exists."
}

Write-Host "`n[5/10] Remove lingering pm2 entries (again)..."
npx pm2 delete github-pr-manager 2>$null | Out-Null
Start-Sleep -Seconds 1

Write-Host "`n[6/10] Start pm2 using ecosystem.config.cjs (ensure env variables are set in session)..."
if (-not (Test-Path ".\ecosystem.config.cjs")) {
  Write-Host "ERROR: ecosystem.config.cjs not found. Please create it." -ForegroundColor Red
  Pop-Location; exit 1
}

# Ensure any secrets are present in the session environment
if (-not $env:GITHUB_TOKEN) { Write-Host "WARNING: GITHUB_TOKEN is not set in this session. Set before starting for write operations." -ForegroundColor Yellow }

# Use update-env to force pm2 to use current env
npx pm2 start ecosystem.config.cjs --env production --update-env
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: pm2 start failed" -ForegroundColor Red; Pop-Location; exit 1 }

Write-Host "`n[7/10] Saving pm2 process list..."
npx pm2 save

Write-Host "`n[8/10] pm2 status and process info..."
npx pm2 status
npx pm2 show github-pr-manager

Write-Host "`n[9/10] Tail last 200 lines of logs..."
npx pm2 logs github-pr-manager --lines 200

Write-Host "`n[10/10] HTTP health check (port from env or 3001)..."
$port = $env:PORT
if (-not $port) { $port = 3001 }
try {
  $resp = Invoke-RestMethod -Uri "http://localhost:$port/health" -Method GET -TimeoutSec 10
  Write-Host "Health OK: $(ConvertTo-Json $resp -Depth 3)" -ForegroundColor Green
} catch {
  Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
  Write-Host "Check logs: Get-Content $env:USERPROFILE\.pm2\logs\github-pr-manager-error.log -Tail 30"
}

Pop-Location