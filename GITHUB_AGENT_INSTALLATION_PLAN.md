# GitHub Agent CLI - Complete Installation & Deployment Plan
## AdGenXAI Repository Integration Guide

**Date:** November 3, 2025  
**Repository:** `brandonlacoste9-tech/adgenxai`  
**Branch:** `main`  
**CLI Version:** `github-agent-cli@1.0.2`

---

## 🎯 Project Overview

This document provides a complete reference for the GitHub Agent CLI installation and deployment within the AdGenXAI repository. The GitHub Agent CLI provides enterprise-grade GitHub automation capabilities with PM2 process management, health monitoring, and webhook handling.

## 📦 Installation Summary

### Dependencies Added
```json
{
  "github-agent-cli": "^1.0.1"
}
```

### NPM Scripts Added
```json
{
  "agent:deploy": "github-agent deploy",
  "agent:health": "github-agent health --detailed", 
  "agent:status": "github-agent status",
  "agent:monitor": "github-agent monitor --interval 30"
}
```

### Files Created
- `dist/index.js` - AdGenXAI-specific GitHub Agent server
- `ecosystem.config.cjs` - PM2 configuration (auto-generated)
- `package.json.backup` - Backup of original package.json

---

## 🚀 Quick Start Commands

### Deploy the GitHub Agent Platform
```bash
npm run agent:deploy
```

### Check Platform Health
```bash
npm run agent:health
```

### Show Current Status
```bash
npm run agent:status
```

### Start Continuous Monitoring
```bash
npm run agent:monitor
```

### Direct CLI Access
```bash
npx github-agent --help
```

---

## 🏗️ Architecture Details

### GitHub Agent Server (`dist/index.js`)

**Purpose:** Custom Express server for AdGenXAI GitHub automation  
**Port:** 3001 (configurable via PORT env var)  
**Process Name:** `github-pr-manager`

#### Endpoints:
- `GET /` - Server status and information
- `GET /health` - Detailed health metrics
- `POST /webhook` - GitHub webhook handler

#### Features:
- **Project Identification:** Explicitly branded for AdGenXAI
- **Webhook Logging:** Detailed event logging for GitHub webhooks
- **Health Metrics:** Memory usage, uptime, process info
- **Graceful Shutdown:** Proper cleanup on SIGINT

### PM2 Configuration (`ecosystem.config.cjs`)

```javascript
module.exports = {
  apps: [{
    name: 'github-pr-manager',
    script: './dist/index.js',
    instances: 1,
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production', 
      PORT: 3001
    },
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

---

## 📊 Health Monitoring

### Health Check Response Format
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T02:55:13.492Z",
  "uptime": 31.0816481,
  "version": "1.0.0", 
  "environment": "development",
  "memory": {
    "rss": 38100992,
    "heapTotal": 12378112,
    "heapUsed": 10514072,
    "external": 2442625,
    "arrayBuffers": 19082
  },
  "pid": 15212,
  "project": "adgenxai"
}
```

### PM2 Status Output
```
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ github-pr-manager  │ cluster  │ 0    │ online    │ 0%       │ 0b       │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

---

## 🔧 Deployment Workflow

### 1. Initial Setup
```bash
cd C:\Users\north\adgenxai
npm install github-agent-cli
```

### 2. Configuration
- ✅ NPM scripts added to package.json
- ✅ Custom dist/index.js created for AdGenXAI
- ✅ PM2 ecosystem configuration ready

### 3. Deployment Process
```bash
npm run agent:deploy
```

**Deployment Steps:**
1. **Cleanup** - Remove existing PM2 processes
2. **Build Check** - Verify dist/index.js exists
3. **Configuration** - Create/update ecosystem.config.cjs  
4. **Deploy** - Start process with PM2
5. **Save** - Persist PM2 configuration
6. **Health Check** - Verify platform is running

### 4. Verification
```bash
npm run agent:status   # Check PM2 status
npm run agent:health   # Check health endpoint
curl http://localhost:3001  # Test web interface
```

---

## 🌐 GitHub Integration

### Webhook Configuration

**Webhook URL:** `http://localhost:3001/webhook`  
**Events:** All GitHub events supported  
**Content Type:** `application/json`

### Webhook Handler Features
- **Event Logging:** Logs all incoming webhook events
- **Repository Detection:** Identifies repository from payload
- **Action Tracking:** Logs specific actions (opened, closed, etc.)
- **Response Format:** JSON confirmation with event details

### Example Webhook Response
```json
{
  "message": "AdGenXAI webhook received successfully",
  "event": "pull_request",
  "repository": "brandonlacoste9-tech/adgenxai", 
  "processed": true
}
```

---

## 🔄 CI/CD Integration

### Existing GitHub Workflows
- `ci.yml` - Main CI pipeline
- `github-agent-ci.yml` - GitHub Agent specific CI
- `test.yml` - Test automation
- `phase2.yml` - Phase 2 deployment

### Integration Points
- GitHub Agent can be deployed via GitHub Actions
- Health checks can be integrated into CI/CD pipelines
- Webhook events can trigger automated responses

---

## 🛠️ Troubleshooting Guide

### Common Issues & Solutions

#### 1. Port Already in Use
```bash
# Check what's using port 3001
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID> /F

# Or use a different port
PORT=3002 npm run agent:deploy
```

#### 2. PM2 Process Not Starting
```bash
# Check PM2 logs
npx pm2 logs github-pr-manager

# Restart the process
npx pm2 restart github-pr-manager

# Delete and redeploy
npx pm2 delete github-pr-manager
npm run agent:deploy
```

#### 3. Health Check Failing
```bash
# Check if server is running
curl http://localhost:3001/health

# Check PM2 status
npm run agent:status

# View detailed logs
npx pm2 logs github-pr-manager --lines 50
```

#### 4. Webhook Not Receiving Events
- Verify webhook URL in GitHub repository settings
- Check firewall and network configuration
- Ensure server is accessible from external networks
- Review webhook delivery logs in GitHub

---

## 📈 Performance & Scaling

### Resource Requirements
- **CPU:** Minimal (< 1% under normal load)
- **Memory:** ~40MB base usage
- **Network:** HTTP requests only
- **Disk:** Logs and PM2 state files

### Scaling Options
- **Horizontal:** Multiple instances via PM2 cluster mode
- **Vertical:** Increase memory/CPU allocation
- **Load Balancing:** Multiple servers with load balancer
- **Container:** Docker deployment for cloud scaling

---

## 🔐 Security Considerations

### Access Control
- Server runs on localhost by default
- No authentication required for local access
- Webhook endpoint accepts all GitHub events

### Security Enhancements
- Add webhook secret validation
- Implement API key authentication
- Use HTTPS in production
- Add rate limiting for webhook endpoints
- Validate webhook payloads

---

## 📝 Maintenance Tasks

### Daily
- Monitor health status: `npm run agent:health`
- Check PM2 status: `npm run agent:status`

### Weekly  
- Review logs: `npx pm2 logs github-pr-manager`
- Check memory usage trends
- Verify webhook delivery success rates

### Monthly
- Update GitHub Agent CLI: `npm update github-agent-cli`
- Review and archive old logs
- Performance optimization review

---

## 🔄 Backup & Recovery

### Configuration Backup
```bash
# Backup package.json
cp package.json package.json.backup

# Backup PM2 configuration
npx pm2 dump

# Backup custom server
cp dist/index.js dist/index.js.backup
```

### Recovery Procedure
```bash
# Restore from backup
cp package.json.backup package.json
npm install

# Redeploy platform
npm run agent:deploy

# Verify functionality
npm run agent:health
```

---

## 📋 Commit History

### Initial Installation Commit
```
feat: Install GitHub Agent CLI in adgenxai project

- Add github-agent-cli dependency
- Add npm scripts for agent operations:
  - agent:deploy: Deploy GitHub automation platform
  - agent:health: Check platform health  
  - agent:status: Show PM2 status
  - agent:monitor: Start health monitoring
- Add dist/index.js for adgenxai-specific GitHub Agent server
- Server includes webhook endpoint for repository automation

Commit: 542dd7e
```

---

## 🎯 Future Enhancements

### Planned Features
- [ ] Webhook secret validation
- [ ] Dashboard UI for monitoring
- [ ] Automated PR triage integration
- [ ] Custom automation workflows
- [ ] Slack/Discord notifications
- [ ] Database integration for event storage
- [ ] Performance metrics collection

### Integration Opportunities
- [ ] Connect with existing PR automation scripts
- [ ] Integrate with telemetry dashboard
- [ ] Add to Phase 2 deployment pipeline
- [ ] Connect with agent swarm dashboard

---

## 📞 Support & Documentation

### Resources
- **NPM Package:** https://www.npmjs.com/package/github-agent-cli
- **GitHub Repository:** brandonlacoste9-tech/adgenxai
- **Local Server:** http://localhost:3001
- **Health Endpoint:** http://localhost:3001/health

### Command Reference
```bash
# Global CLI commands
github-agent --help
github-agent deploy [options]
github-agent health [options] 
github-agent status
github-agent stop

# Project-specific commands
npm run agent:deploy
npm run agent:health
npm run agent:status
npm run agent:monitor

# PM2 direct commands
npx pm2 status
npx pm2 logs github-pr-manager
npx pm2 restart github-pr-manager
npx pm2 stop github-pr-manager
npx pm2 delete github-pr-manager
```

---

## ✅ Installation Verification Checklist

- [x] GitHub Agent CLI installed as dependency
- [x] NPM scripts added to package.json
- [x] Custom dist/index.js created for AdGenXAI
- [x] Platform deployed with PM2
- [x] Health checks passing
- [x] Web interface accessible
- [x] Webhook endpoint ready
- [x] Changes committed to GitHub
- [x] Documentation created

---

**Last Updated:** November 3, 2025  
**Status:** ✅ Production Ready  
**Maintainer:** brandonlacoste9-tech