# GitHub Agent CLI - Quick Reference

## 🚀 Essential Commands

```bash
# Deploy & Start
npm run agent:deploy

# Health Check  
npm run agent:health

# Status Check
npm run agent:status

# Monitoring
npm run agent:monitor
```

## 🔧 Direct PM2 Commands

```bash
# View status
npx pm2 status

# View logs
npx pm2 logs github-pr-manager

# Restart
npx pm2 restart github-pr-manager

# Stop
npx pm2 stop github-pr-manager
```

## 🌐 Web Interface

- **Dashboard:** http://localhost:3001
- **Health:** http://localhost:3001/health  
- **Webhook:** http://localhost:3001/webhook

## 📁 Key Files

- `dist/index.js` - AdGenXAI GitHub Agent server
- `package.json` - NPM scripts and dependencies
- `ecosystem.config.cjs` - PM2 configuration
- `GITHUB_AGENT_INSTALLATION_PLAN.md` - Complete documentation

## 🎯 Current Status

✅ **Installed:** github-agent-cli@1.0.1  
✅ **Deployed:** PM2 process running  
✅ **Health:** Platform healthy  
✅ **Webhook:** Ready for GitHub events  
✅ **Committed:** Changes pushed to main branch