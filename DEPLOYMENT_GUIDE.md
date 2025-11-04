# GitHub PR & Issue Management Agent System - Deployment Guide

This guide walks you through deploying the comprehensive GitHub PR & Issue Management Agent System that you've created.

## 🎯 System Overview

You now have a sophisticated multi-layered automation system:

### **Layer 1: CLI-Based Triage (Active)**
- ✅ **Node.js PR Triage**: `npm run triage:prs` - Works now with GitHub API
- ✅ **Enhanced Integration**: Combines API analysis with GitHub CLI actions
- ✅ **Documentation**: Complete workflow docs and examples

### **Layer 2: Multi-Agent System (Ready for Deployment)**
- 🚀 **GitHubPRManagerAgent**: Master orchestrator with PR lifecycle management
- 🤖 **Specialized Agents**: Security, Code Review, Testing, Documentation, Performance, Deployment
- 📊 **Real-time Monitoring**: Health checks, metrics, Prometheus integration
- 🔧 **Enterprise Features**: Webhooks, auto-labeling, command interface

## 🚀 Quick Start Options

### Option 1: CLI Mode (Works Now)
```bash
# Basic PR analysis (no GitHub token needed for public repos)
npm run triage:prs -- --repo brandonlacoste9-tech/adgenxai

# With GitHub token for full functionality
GITHUB_TOKEN=your_token npm run triage:prs -- --repo brandonlacoste9-tech/adgenxai --output reports/triage.md

# Enhanced automation combining API + CLI
node scripts/enhanced-pr-triage.mjs
```

### Option 2: Agent System Deployment

#### Prerequisites
- Node.js 18+
- GitHub App credentials (for webhook integration)
- Optional: Docker and Kubernetes for production

#### Step 1: Install Agent Dependencies
```bash
cd agents/github-pr-manager
npm install
```

#### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env with your GitHub App credentials
```

#### Step 3: Start the System
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## 📋 GitHub App Setup (Required for Webhook Integration)

### 1. Create GitHub App
1. Go to GitHub Settings → Developer settings → GitHub Apps
2. Click "New GitHub App"
3. Configure:
   - **Name**: "AdGenXAI PR Manager"
   - **Homepage URL**: Your domain
   - **Webhook URL**: `https://your-domain.com/webhook`
   - **Webhook Secret**: Generate a secure secret

### 2. Set Permissions
- **Issues**: Read & Write
- **Pull requests**: Read & Write  
- **Contents**: Read
- **Metadata**: Read
- **Checks**: Write
- **Commit statuses**: Write

### 3. Subscribe to Events
- Issues (opened, edited, closed)
- Pull requests (opened, edited, closed, review_requested)
- Pull request reviews
- Issue comments
- Pull request review comments

### 4. Install App
- Install on your repository (`brandonlacoste9-tech/adgenxai`)
- Note the Installation ID

## 🔧 Configuration Reference

### Required Environment Variables
```env
# GitHub App (get from GitHub App settings)
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GITHUB_INSTALLATION_ID=78901234
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Server
PORT=3000
NODE_ENV=production

# Database (SQLite for dev, PostgreSQL for prod)
DATABASE_URL=sqlite://./github_agent.db
```

### Optional Agent Endpoints
```env
# Mock agents (return success for testing)
SECURITY_AGENT_ENDPOINT=http://localhost:3001
CODE_REVIEW_AGENT_ENDPOINT=http://localhost:3002
TESTING_AGENT_ENDPOINT=http://localhost:3003
DOCUMENTATION_AGENT_ENDPOINT=http://localhost:3004
PERFORMANCE_AGENT_ENDPOINT=http://localhost:3005
DEPLOYMENT_AGENT_ENDPOINT=http://localhost:3006
```

## 🐳 Docker Deployment

### Build and Run
```bash
cd agents/github-pr-manager
docker build -t github-pr-manager .
docker run -p 3000:3000 --env-file .env github-pr-manager
```

### Docker Compose
```yaml
version: '3.8'
services:
  github-agent:
    build: ./agents/github-pr-manager
    ports:
      - "3000:3000"
    env_file:
      - ./agents/github-pr-manager/.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## ☸️ Kubernetes Deployment

### Basic Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: github-pr-manager
spec:
  replicas: 2
  selector:
    matchLabels:
      app: github-pr-manager
  template:
    metadata:
      labels:
        app: github-pr-manager
    spec:
      containers:
      - name: github-pr-manager
        image: github-pr-manager:latest
        ports:
        - containerPort: 3000
        env:
        - name: GITHUB_APP_ID
          valueFrom:
            secretKeyRef:
              name: github-secrets
              key: app-id
        - name: GITHUB_PRIVATE_KEY
          valueFrom:
            secretKeyRef:
              name: github-secrets
              key: private-key
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: github-pr-manager
spec:
  selector:
    app: github-pr-manager
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 🔍 Testing & Validation

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. System Status
```bash
curl http://localhost:3000/status
```

### 3. Manual Triggers
```bash
# Trigger PR review
curl -X POST http://localhost:3000/trigger/pr-review \
  -H "Content-Type: application/json" \
  -d '{"repository": "brandonlacoste9-tech/adgenxai", "prNumber": 123}'

# Trigger issue triage  
curl -X POST http://localhost:3000/trigger/issue-triage \
  -H "Content-Type: application/json" \
  -d '{"repository": "brandonlacoste9-tech/adgenxai", "issueNumber": 456}'
```

### 4. Webhook Testing
Use GitHub webhook test or:
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-Hub-Signature-256: sha256=your_signature" \
  -d '{"action": "opened", "pull_request": {"number": 123}}'
```

## 📊 Monitoring

### Available Endpoints
- `GET /health` - Health check
- `GET /status` - System metrics
- `GET /metrics` - Prometheus metrics
- `GET /config` - Safe configuration display

### Key Metrics
- `github_agent_active_prs` - Active PRs being processed
- `github_agent_active_issues` - Active issues being managed  
- `github_agent_active_tasks` - Currently running tasks
- `github_agent_success_rate` - Overall task success rate

### Prometheus Configuration
```yaml
scrape_configs:
  - job_name: 'github-pr-manager'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

## 🎮 Command Interface

Once deployed, users can control the system via GitHub comments:

### PR Commands
```bash
/rerun-tests          # Re-run testing analysis
/security-review      # Trigger security scan
/performance-check    # Performance analysis  
/full-review         # Complete review suite
/status              # Current progress
/create-issue <type> # Create follow-up issue
```

### Issue Commands
```bash
/triage              # Re-analyze issue
/estimate            # Show effort estimate
/assign-agent <type> # Assign specific agent
/generate-code       # Auto-generate code
/generate-docs       # Generate documentation
/link-pr <number>    # Link to related PR
/duplicate <number>  # Mark as duplicate
/status              # Issue status
```

## 🔗 Integration with Existing Workflow

### Current PR Triage Integration
Your existing GitHub CLI automation works perfectly with the new system:

1. **CLI Analysis** → Generates detailed reports
2. **Agent Processing** → Multi-agent review and automation
3. **GitHub Actions** → Continues to work with existing CI/CD
4. **Roadmap Governance** → Integrates with milestone tracking

### Enhanced Workflow
1. **PR Opened** → Agent system analyzes and assigns reviewers
2. **Multi-Agent Review** → Parallel security, performance, code quality checks
3. **Automated Reporting** → Comprehensive reports posted to PR
4. **CLI Triage** → Additional analysis and bulk operations
5. **Auto-merge** → Ready PRs automatically merged based on criteria

## 🚨 Troubleshooting

### Common Issues

1. **Rate Limiting**
   - Solution: Add GitHub token to environment
   - Check: `GITHUB_TOKEN` environment variable

2. **Webhook Not Received**
   - Check: Webhook URL is accessible from GitHub
   - Verify: Webhook secret matches configuration
   - Test: Use ngrok for local testing

3. **Agent Communication Errors**
   - Check: Agent endpoints are accessible
   - Verify: Agent health endpoints respond
   - Fallback: System continues without failing agents

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# Verbose webhook processing
DEBUG=webhook npm start
```

## 🎯 Next Steps

1. **Start with CLI** - Use existing `npm run triage:prs` immediately
2. **Deploy Agent System** - Set up GitHub App and webhook integration
3. **Add Specialized Agents** - Deploy custom agents for your specific needs
4. **Scale Gradually** - Start with basic features, add complexity over time
5. **Monitor and Optimize** - Use built-in metrics to optimize performance

## 🔒 Security Considerations

- ✅ Webhook signature verification implemented
- ✅ GitHub App authentication (more secure than tokens)
- ✅ No sensitive data in logs
- ✅ Rate limiting and request validation
- ✅ Agent communication over HTTPS in production

## 📚 Additional Resources

- [GitHub Apps Documentation](https://docs.github.com/en/developers/apps)
- [GitHub Webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [Octokit REST API](https://octokit.github.io/rest.js/)
- [Express.js Documentation](https://expressjs.com/)

Your system is now ready for deployment! Start with the CLI functionality and gradually deploy the agent system for full automation capabilities. 🚀
