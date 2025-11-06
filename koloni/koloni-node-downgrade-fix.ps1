# Koloni Node/NPM Downgrade & Fix Script
# This script will:
# 1. Download and install Node.js LTS v20 (Windows x64)
# 2. Downgrade npm to v8
# 3. Clean and reinstall dependencies
# 4. Start MCP and Vite dev servers

Write-Host "--- Koloni Node/NPM Downgrade & Fix Script ---" -ForegroundColor Cyan

# 1. Download Node.js v20 LTS installer
$nodeUrl = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
$nodeInstaller = "node-v20.11.1-x64.msi"
Write-Host "Downloading Node.js v20 LTS..."
Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeInstaller

# 2. Install Node.js v20 LTS silently
Write-Host "Installing Node.js v20 LTS..."
Start-Process msiexec.exe -ArgumentList "/i $nodeInstaller /qn" -Wait

# 3. Downgrade npm to v8
Write-Host "Downgrading npm to v8..."
npm install -g npm@8

# 4. Remove node_modules and package-lock.json
Write-Host "Removing node_modules and package-lock.json..."
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# 5. Clean npm cache
Write-Host "Cleaning npm cache..."
npm cache clean --force

# 6. Reinstall dependencies
Write-Host "Reinstalling dependencies..."
npm install

# 7. Start MCP server in background (if present)
Write-Host "Starting MCP server (if present)..."
if (Test-Path "mcp/server.ts") {
    Start-Process powershell -ArgumentList 'cd mcp; node server.ts' -WindowStyle Minimized
    Write-Host "MCP server started in background."
} else {
    Write-Host "No MCP server found."
}

# 8. Start Vite dev server
Write-Host "Starting Vite dev server..."
npm run dev

Write-Host "--- Script Complete ---" -ForegroundColor Green
