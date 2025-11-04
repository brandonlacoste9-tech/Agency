# 🏭 Production-Ready GitHub PR Management System

## 🎯 **System Overview**

This is a **hardened, production-ready** GitHub PR management system with:

- ✅ **Secure webhook signature verification**
- ✅ **Safe background PR monitoring**  
- ✅ **Windows-friendly PM2 deployment**
- ✅ **No secrets in source code**
- ✅ **Comprehensive error handling**

---

## 🚀 **Quick Start (Production)**

### **1. Set Environment Variables (Required)**
```powershell
# Set secrets in session (DO NOT commit these)
$env:GITHUB_TOKEN = "ghp_your_token_here"
$env:WEBHOOK_SECRET = "your_webhook_secret_here"  
$env:GITHUB_REPOSITORY = "brandonlacoste9-tech/adgenxai"
$env:PROMOTE_DRAFTS = "false"  # Safety: keep false initially
```

### **2. Deploy with PM2**
```powershell
cd agents/github-pr-manager
npm ci
npm run build
.\setup-pm2.ps1
```

### **3. Verify Health**
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```

---

## 🔒 **Security Features**

### **Webhook Signature Verification**
- ✅ Verifies `X-Hub-Signature-256` using `WEBHOOK_SECRET`
- ✅ Uses timing-safe comparison to prevent attacks
- ✅ Rejects unsigned webhooks in production

### **Safe Logging**
- ✅ Never logs `GITHUB_TOKEN` or `WEBHOOK_SECRET`
- ✅ Structured logging with timestamps
- ✅ Safe error handling without exposing secrets

### **Configurable Write Actions**
- ✅ `PROMOTE_DRAFTS=false` by default (read-only)
- ✅ Requires explicit opt-in for write operations
- ✅ Graceful fallback when no token provided

---

## 🛠️ **Available Endpoints**

### **Health Check**
```http
GET /health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-03T...",
  "repo": "brandonlacoste9-tech/adgenxai",
  "mode": "production"
}
```

### **GitHub Webhook**
```http
POST /webhook
```
- Accepts GitHub webhook events
- Verifies signature if `WEBHOOK_SECRET` set
- Lightweight processing (heavy work async)

---

## 📋 **Background PR Management**

The system runs a **safe background loop** every 60 seconds:

### **Current Behavior (Safe Defaults)**:
1. **List open PRs** for configured repository
2. **Log draft PRs** (no auto-promotion unless `PROMOTE_DRAFTS=true`)
3. **Check CI status** and log failures
4. **No destructive actions** without explicit configuration

### **Optional Actions** (Enable via Environment):
```powershell
$env:PROMOTE_DRAFTS = "true"  # Auto-promote draft PRs to ready-for-review
```

---

## 🔧 **PM2 Production Configuration**

### **Ecosystem Settings**:
- **Instances**: `1` (Windows-friendly fork mode)
- **Memory limit**: `1GB` with auto-restart
- **Environment**: Pulls from system env (secure)
- **No secrets in config files**

### **Windows Service Setup** (Optional):
```powershell
# Install pm2-windows-service (one-time, requires admin)
npm i -g pm2-windows-service
pm2-service-install -u $env:USERNAME -p "C:\Program Files\nodejs\node.exe" -i C:\Users\$env:USERNAME\.pm2

# Verify service
Get-Service pm2-$env:USERNAME
```

---

## 📊 **Monitoring & Logs**

### **PM2 Commands**:
```powershell
npx pm2 status                    # Check process status
npx pm2 logs github-pr-manager    # View real-time logs
npx pm2 monit                     # PM2 monitoring dashboard
npx pm2 restart github-pr-manager # Restart without downtime
```

### **Log Locations**:
- **Output**: `$env:USERPROFILE\.pm2\logs\github-pr-manager-out.log`
- **Errors**: `$env:USERPROFILE\.pm2\logs\github-pr-manager-error.log`

### **Health Monitoring**:
```powershell
# Automated health check
while ($true) {
  try {
    $health = Invoke-RestMethod "http://localhost:3001/health"
    Write-Host "$(Get-Date): HEALTHY - $($health.repo)" -ForegroundColor Green
  } catch {
    Write-Host "$(Get-Date): UNHEALTHY - $($_.Exception.Message)" -ForegroundColor Red
  }
  Start-Sleep 30
}
```

---

## 🎛️ **Configuration Options**

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `GITHUB_TOKEN` | *(required)* | GitHub PAT with repo permissions |
| `WEBHOOK_SECRET` | *(optional)* | Secret for webhook signature verification |
| `GITHUB_REPOSITORY` | *(required)* | Repository in `owner/repo` format |
| `PROMOTE_DRAFTS` | `false` | Auto-promote drafts to ready-for-review |
| `PORT` | `3001` | Server listening port |
| `NODE_ENV` | `development` | Environment mode |

---

## 🔍 **Troubleshooting**

### **Common Issues**:

#### **PM2 Start Fails**
```powershell
# Check if port is in use
Get-NetTCPConnection -LocalPort 3001
# Kill process if needed
Stop-Process -Id <PID> -Force
```

#### **Health Check Fails**
```powershell
# Check logs
npx pm2 logs github-pr-manager --lines 50
# Check if service is running
npx pm2 status
```

#### **Token Issues**
```powershell
# Verify token scopes (should include 'repo')
curl -H "Authorization: token $env:GITHUB_TOKEN" https://api.github.com/user
```

#### **Webhook Signature Failures**
- Ensure `WEBHOOK_SECRET` matches GitHub webhook configuration
- Check webhook delivery logs in GitHub settings

---

## 🚀 **Production Deployment Checklist**

### **Before Going Live**:
- [ ] Set `GITHUB_TOKEN` with minimal required scopes
- [ ] Configure `WEBHOOK_SECRET` in both GitHub and environment
- [ ] Test health endpoint: `http://localhost:3001/health`
- [ ] Verify PM2 auto-restart: `npx pm2 restart github-pr-manager`
- [ ] Test webhook delivery from GitHub
- [ ] Monitor logs for first 24 hours
- [ ] Set up monitoring alerts

### **Security Review**:
- [ ] No secrets in source code ✅
- [ ] Webhook signature verification enabled ✅
- [ ] Read-only mode by default ✅
- [ ] Error handling without secret exposure ✅
- [ ] Minimal required GitHub token scopes ✅

---

## 📈 **Next Steps**

### **Immediate Enhancements**:
1. **Token scope validation** on startup
2. **Prometheus metrics** integration
3. **Structured logging** (JSON format)
4. **Docker deployment** option

### **Advanced Features**:
1. **Multi-repository support**
2. **Configurable PR policies**
3. **Slack/Teams notifications**
4. **Advanced triage algorithms**

---

**🎉 Your GitHub PR Management System is Production-Ready!**

The system is now running securely with proper error handling, no secrets in source code, and comprehensive monitoring. Perfect for 24/7 operation! 🚀