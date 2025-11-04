# GitHub PR Manager - Architecture Documentation

## Production-Grade Architecture Overview

This is a **production-grade GitHub automation system** with AI-powered PR analysis using SmolLM2. The system follows a **multi-agent architecture** with resilience patterns for enterprise deployment.

### Core Service Boundary
- **Main Service**: `src/index.js` - Express server handling webhooks and orchestrating AI analysis
- **AI Integration**: `src/ai-service.js` - SmolLM2 interface with fallback to rule-based analysis  
- **Multi-Agent System**: `pr-manager-agent.js` + specialized agents for security, code review, testing, etc.
- **Resilience Layer**: Circuit breakers, retry logic, graceful shutdown, backpressure control

## Development Patterns

### Dual Architecture (ES6 + CommonJS)
```javascript
// Main service uses ES6 modules (src/*.js)
import express from "express";
import { AIService } from "./ai-service.js";

// Agent system uses CommonJS (*.js files)
const { GitHubPRManagerAgent } = require('./pr-manager-agent');
```

### Production Resilience First
Every external call MUST use resilience patterns:
```javascript
// GitHub API calls through circuit breaker
const result = await githubCircuitBreaker.execute(() => 
  octokit.rest.pulls.get({ owner, repo, pull_number })
);

// AI service with fallback
const analysis = await aiCircuitBreaker.execute(() => 
  aiService.analyzePR(prData)
).catch(() => fallbackAnalysis(prData));
```

### Agent Orchestration Pattern
The system delegates specialized tasks to purpose-built agents:
- `security-agent` (port 3001) - Security scanning
- `code-review-agent` (port 3002) - Code quality analysis  
- `testing-agent` (port 3003) - Test generation
- `deployment-agent` (port 3006) - CI/CD coordination

## Configuration

### Environment Variables (Required)
```bash
GITHUB_TOKEN=ghp_xxx           # GitHub PAT with repo permissions
GITHUB_REPOSITORY=owner/repo   # Target repository
WEBHOOK_SECRET=xxx             # GitHub webhook verification
AI_SERVICE_URL=http://localhost:8000  # SmolLM2 endpoint
ENABLE_AI_ANALYSIS=true        # Toggle AI vs rule-based analysis
```

### Development vs Production Modes
- **Development**: `npm start` → Single process with hot-reload
- **Production**: PM2 cluster mode via `ecosystem.config.cjs`
- **Docker**: Full stack with Redis, Prometheus, Grafana via `docker-compose.yml`

## Build & Deployment Commands

```bash
# Local development
npm start                    # Start main service
node pr-manager-agent.js    # Start agent orchestrator

# Production deployment  
pm2 start ecosystem.config.cjs --env production
.\setup-pm2.ps1             # Windows PM2 setup script

# Docker stack (full monitoring)
docker-compose up -d        # Complete infrastructure
.\ops-toolkit.ps1 -Status  # Production health checks
```

## Testing Strategy

### Integration Testing
```bash
.\test-webhooks.js          # Webhook payload testing
.\webhook-integration-test.js  # End-to-end webhook flow
.\production-readiness-test.ps1  # Pre-deployment validation
```

### AI Service Testing
The system gracefully degrades when AI is unavailable - test both modes:
```bash
# Test with AI enabled
ENABLE_AI_ANALYSIS=true npm start

# Test fallback mode  
ENABLE_AI_ANALYSIS=false npm start
```

## Code Patterns

### PR Analysis Flow
1. **Webhook Receipt** → `src/index.js` `/webhook` endpoint
2. **Risk Assessment** → `analyzePRRisk()` function with AI or rules
3. **Agent Delegation** → Route to specialized agents based on risk/type
4. **GitHub Updates** → Labels, comments, reviews via Octokit

### Error Handling Pattern
```javascript
// Standard resilience pattern
try {
  const result = await circuitBreaker.execute(operation);
  recordSuccess('operation-name');
  return result;
} catch (error) {
  recordError('operation-name', error);
  return fallbackResponse();
}
```

### Monitoring Integration
All operations emit metrics to Prometheus:
```javascript
recordGitHubApiCall(endpoint, statusCode, duration);
recordAgentOperation(agentType, operation, success);
```

## Key File Navigation

- **Main Logic**: `src/index.js` (webhook handling, PR analysis orchestration)
- **AI Integration**: `src/ai-service.js` (SmolLM2 API calls and fallback rules)
- **Agent Framework**: `pr-manager-agent.js` (multi-agent orchestration)
- **Resilience**: `src/circuit-breaker.js`, `src/retry-logic.js`
- **Configuration**: `ecosystem.config.cjs` (PM2), `docker-compose.yml` (infrastructure)
- **Operations**: `ops-toolkit.ps1` (deployment scripts), `OPERATIONAL_RUNBOOK.md`

## Integration Points

### GitHub Webhooks
- **Endpoint**: `/webhook` with HMAC signature verification
- **Events**: `pull_request`, `issues` (opened, reopened, synchronize)
- **Response**: Always 200 OK with background processing

### SmolLM2 AI Service  
- **Endpoint**: `POST /v1/chat/completions` (OpenAI-compatible)
- **Model**: `ai/smollm2` 
- **Fallback**: Rule-based analysis when AI unavailable
- **Circuit Breaker**: 5 failures → 60s cooldown

### Multi-Agent Communication
- **Protocol**: HTTP REST between agents
- **Discovery**: Environment-based endpoint configuration
- **Coordination**: `task-delegator.js` handles agent selection and load balancing

## Security Considerations

- **Webhook Verification**: HMAC-SHA256 signature validation required
- **Token Scope**: Minimum `repo` permissions for PR/issue operations
- **Secrets Management**: Environment variables only, never hardcoded
- **Input Validation**: All webhook payloads validated before processing
- **AI Service**: Ensure SmolLM2 doesn't persist sensitive data

## Common Debugging

```bash
# Check service health
curl http://localhost:3001/health

# View processing queue
curl http://localhost:3001/admin/queue-stats

# Monitor AI service
curl http://localhost:8000/health

# PM2 status
npx pm2 logs github-pr-manager --lines 50
```