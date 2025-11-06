# Koloni Debug & Fix Script for Windows
# This script automates the most common fixes for Vite/Rollup and MCP server issues on Windows.
# Usage: Right-click and 'Run with PowerShell' or run in a PowerShell terminal.

Write-Host "--- Koloni Debug & Fix Script ---" -ForegroundColor Cyan

# 1. Stop any process using port 3001 (for MCP server)
Write-Host "Checking for processes on port 3001..."
$portInfo = netstat -ano | Select-String ":3001"
if ($portInfo) {
    $pid = ($portInfo -split '\s+')[-1]
    Write-Host "Killing process with PID $pid on port 3001..."
    taskkill /PID $pid /F | Out-Null
} else {
    Write-Host "No process found on port 3001."
}

# 2. Remove node_modules and package-lock.json
Write-Host "Removing node_modules and package-lock.json..."
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# 3. Clean npm cache
Write-Host "Cleaning npm cache..."
npm cache clean --force

# 4. Optionally downgrade npm (uncomment if needed)
# Write-Host "Downgrading npm to v8 for compatibility..."
# npm install -g npm@8

# 5. Reinstall dependencies with legacy peer deps
Write-Host "Reinstalling dependencies with legacy peer deps..."
npm install --legacy-peer-deps

# 6. Start MCP server in background (optional)
Write-Host "Starting MCP server (if present)..."
if (Test-Path "mcp/server.ts") {
    Start-Process powershell -ArgumentList 'cd mcp; node server.ts' -WindowStyle Minimized
    Write-Host "MCP server started in background."
} else {
    Write-Host "No MCP server found."
}

# 7. Start Vite dev server
Write-Host "Starting Vite dev server..."
npm run dev

Write-Host "--- Script Complete ---" -ForegroundColor Green
