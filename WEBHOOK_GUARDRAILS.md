# Webhook Corruption Prevention Toolkit 🛡️

## Overview

This toolkit provides comprehensive guardrails to prevent file corruption and ensure webhook service reliability. It implements the surgical approach used to fix the GitHub PR manager corruption: syntax checks → mathematical validation → targeted repair → fallback recovery.

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Run Local Tests

```bash
# Check for corruption patterns
npm run check:corruption

# Test webhook with signature verification
npm run test:integration

# PowerShell alternative (Windows)
pwsh scripts/test-webhook.ps1

# Syntax check all JavaScript files
npm run test:syntax
```

## 🔧 Components

### 1. GitHub Actions CI (`.github/workflows/ci.yml`)

**Prevents broken commits from landing in main**

- ✅ Node.js syntax validation (`node -c`)
- ✅ TypeScript type checking (`tsc --noEmit`)
- ✅ ESLint with zero warnings
- ✅ Docker build verification
- ✅ Redis connectivity testing
- ✅ Corruption pattern detection

**Runs on every PR and push to main**

### 2. Prometheus Metrics (`agents/github-pr-manager/src/metrics.js`)

**Real-time observability for webhook processing**

```javascript
const { attachMetricsEndpoint, recordWebhookProcessed, recordWebhookError } = require('./metrics');

// Add to your Express app
attachMetricsEndpoint(app);

// Instrument your code
recordWebhookProcessed('push', 'success');
recordWebhookError('syntax_error', 'parser');
```

**Available endpoints:**
- `/metrics` - Prometheus metrics
- `/health` - Health check with Redis connectivity
- `/ready` - Kubernetes readiness probe

**Key metrics:**
- `github_webhook_queue_length` - Redis queue depth
- `github_webhook_processed_total` - Successful events
- `github_webhook_errors_total` - Error count by type
- `github_webhook_processing_duration_seconds` - Latency histogram

### 3. Integration Test (`tests/integration/postSignedWebhook.js`)

**End-to-end webhook verification**

```bash
# Set environment variables
export GITHUB_WEBHOOK_SECRET=your-secret
export WEBHOOK_URL=http://localhost:3001/webhook
export REDIS_URL=redis://localhost:6379

# Run the test
node tests/integration/postSignedWebhook.js
```

**What it tests:**
- ✅ HMAC-SHA256 signature computation
- ✅ HTTP request/response handling
- ✅ Redis queue mechanics
- ✅ Health and metrics endpoints
- ✅ Error scenarios and timeouts

### 4. Corruption Detection (`scripts/check-corruption.js`)

**Automated file integrity verification**

```bash
npm run check:corruption
```

**Detection patterns:**
- 🔍 Unbalanced braces/parentheses/brackets
- 🔍 Duplicate function declarations
- 🔍 Suspiciously long lines (>500 chars)
- 🔍 Character repetition patterns
- 🔍 JSON syntax validation
- 🔍 JavaScript syntax errors

### 5. Pre-commit Hooks (`.huskyrc.json`)

**Stops corruption at commit time**

```bash
# Install husky (if not already installed)
npm install -D husky lint-staged
npx husky install
```

**Runs on every commit:**
- Syntax validation (`node -c`)
- TypeScript checking
- ESLint with auto-fix
- Corruption pattern detection

## 📊 Usage Examples

### PowerShell Webhook Testing

```powershell
# Basic test with default values
pwsh scripts/test-webhook.ps1

# Custom webhook URL and secret
pwsh scripts/test-webhook.ps1 -WebhookUrl "https://your-server.com/webhook" -Secret "your-secret"

# Test with custom payload file
pwsh scripts/test-webhook.ps1 -PayloadFile "custom-payload.json" -EventType "pull_request"
```

### Node.js Integration Test

```javascript
// Custom test script
const { spawn } = require('child_process');

const testProcess = spawn('node', ['tests/integration/postSignedWebhook.js'], {
  env: {
    ...process.env,
    WEBHOOK_URL: 'http://localhost:3001/webhook',
    GITHUB_WEBHOOK_SECRET: 'test',
    REDIS_URL: 'redis://localhost:6379'
  }
});

testProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});
```

### Metrics Integration

```javascript
// In your webhook processor (index.js)
const express = require('express');
const { 
  attachMetricsEndpoint, 
  recordWebhookProcessed, 
  recordWebhookError,
  recordProcessingTime 
} = require('./metrics');

const app = express();

// Add metrics endpoint
attachMetricsEndpoint(app);

// Webhook handler with instrumentation
app.post('/webhook', async (req, res) => {
  const startTime = Date.now();
  const eventType = req.headers['x-github-event'];
  
  try {
    // Process webhook
    await processWebhook(req.body, eventType);
    
    // Record success
    recordWebhookProcessed(eventType, 'success');
    recordProcessingTime(eventType, (Date.now() - startTime) / 1000);
    
    res.status(200).send('OK');
  } catch (error) {
    // Record error
    recordWebhookError(error.type || 'unknown', 'processor');
    recordWebhookProcessed(eventType, 'error');
    
    res.status(500).send('Error');
  }
});
```

## 🔍 Troubleshooting Guide

### Common Issues

#### 1. CI Syntax Check Failing

```bash
# Error: SyntaxError: Unexpected token
```

**Solution:**
```bash
# Check specific file
node -c path/to/file.js

# Find all syntax errors
find . -name "*.js" -not -path "./node_modules/*" -exec node -c {} \;
```

#### 2. Unbalanced Braces Detected

```bash
# Error: Unbalanced braces: 2 unclosed
```

**Solution:**
```bash
# Use the corruption checker for details
npm run check:corruption

# Manual check with regex
grep -n "[{}]" problematic-file.js | head -20
```

#### 3. Integration Test Failing

```bash
# Error: Connection refused
```

**Solution:**
```bash
# Start the webhook service
docker-compose -f docker-compose-basic.yml up github-pr-manager

# Check if port is occupied
netstat -an | grep :3001

# Test connectivity
curl http://localhost:3001/health
```

#### 4. Redis Connection Issues

```bash
# Error: Redis connection failed
```

**Solution:**
```bash
# Start Redis
docker run -d -p 6379:6379 redis:7

# Test connection
redis-cli ping

# Check environment variables
echo $REDIS_URL
```

### Recovery Procedures

#### File Corruption Recovery

1. **Immediate Response:**
   ```bash
   # Backup current state
   cp corrupted-file.js corrupted-file.js.backup
   
   # Restore from git
   git checkout HEAD -- corrupted-file.js
   
   # Verify syntax
   node -c corrupted-file.js
   ```

2. **Analysis:**
   ```bash
   # Check what changed
   git diff corrupted-file.js.backup corrupted-file.js
   
   # Run corruption detection
   npm run check:corruption
   ```

3. **Prevention:**
   ```bash
   # Add pre-commit hooks
   npx husky install
   
   # Test the fix
   npm run test:syntax
   ```

## 📈 Monitoring & Alerting

### Prometheus Queries

```promql
# Queue depth alert
github_webhook_queue_length > 100

# Error rate alert
rate(github_webhook_errors_total[5m]) > 0.1

# Processing latency alert
histogram_quantile(0.95, rate(github_webhook_processing_duration_seconds_bucket[5m])) > 10
```

### Log Analysis

```bash
# Check webhook service logs
docker-compose -f docker-compose-basic.yml logs -f github-pr-manager

# Redis queue inspection
docker exec -it redis-container redis-cli
> LLEN queue:github-webhook
> LRANGE queue:github-webhook 0 10
```

## 🔄 Maintenance

### Weekly Tasks

1. **Review metrics dashboard**
2. **Check error logs for patterns**
3. **Verify backup and recovery procedures**
4. **Update dependencies with security patches**

### Monthly Tasks

1. **Load test webhook endpoint**
2. **Review and update alerting thresholds**
3. **Audit corruption detection patterns**
4. **Performance optimization review**

## 🎯 Best Practices

### Development

- ✅ Always run `npm run check:corruption` before commits
- ✅ Use the integration test for major changes
- ✅ Monitor metrics during deployments
- ✅ Keep webhook payloads under 1MB
- ✅ Implement circuit breakers for external APIs

### Operations

- ✅ Set up Prometheus alerts for queue depth
- ✅ Monitor Redis memory usage
- ✅ Keep webhook processing under 30 seconds
- ✅ Implement graceful shutdown handling
- ✅ Use health checks in load balancers

### Security

- ✅ Validate webhook signatures
- ✅ Rate limit webhook endpoints
- ✅ Sanitize all input data
- ✅ Use environment variables for secrets
- ✅ Implement audit logging

## 📚 Additional Resources

- [GitHub Webhook Documentation](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Redis Queue Patterns](https://redis.io/docs/data-types/lists/)
- [Node.js Error Handling](https://nodejs.org/api/errors.html)

---

This toolkit provides production-grade protection against webhook corruption and processing failures. The combination of CI checks, real-time metrics, comprehensive testing, and automated recovery procedures ensures robust service operation and rapid incident resolution.
