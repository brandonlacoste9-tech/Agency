# GitHub PR Manager - Production-Grade Resilience

## 🛡️ Armor-Plated Webhook Management System

This enhanced GitHub PR Manager features production-grade resilience with circuit breakers, backpressure control, graceful shutdown, and operational safety features designed to prevent 3 AM PagerDuty alerts.

## 🚀 New Resilience Features

### 1. Circuit Breaker for Webhook Processing
- **Library**: `opossum` 
- **Timeout**: 10 seconds
- **Error Threshold**: 50% failure rate
- **Reset Time**: 30 seconds
- **Dead Letter Queue**: Failed webhooks are queued for retry
- **Fallback**: Graceful degradation with retry queue

### 2. Backpressure Control & Worker Pool
- **Library**: `p-queue`
- **Concurrency**: Configurable via `WEBHOOK_WORKER_CONCURRENCY` (default: 8)
- **Queue Limit**: `QUEUE_SIZE_LIMIT` (default: 1000)
- **Overflow Protection**: Rejects requests when queue is full

### 3. Agent Toggle System (Redis-based)
- **Runtime Control**: Enable/disable agents without restart
- **Redis Key**: `agents:enabled`
- **Default**: Fail-open (enabled) for availability
- **Admin Endpoints**: `/admin/agents/enable`, `/admin/agents/disable`

### 4. Resilient HTTP Clients
- **Library**: `axios-retry`
- **Retry Attempts**: 4 with exponential backoff
- **GitHub API Client**: Custom client with rate limiting awareness
- **Error Handling**: Automatic retry on network/5xx errors

### 5. Graceful Shutdown
- **Signals**: SIGTERM, SIGINT, uncaught exceptions
- **Process**: Close server → drain queue → cleanup connections
- **Timeout**: 30-second shutdown timeout with force-exit

### 6. Enhanced Metrics & Monitoring
- **Circuit Breaker States**: Open/closed monitoring
- **Queue Metrics**: Size, pending jobs, processing time
- **Agent Status**: Real-time enable/disable state
- **Dead Letter Queue**: Failed webhook tracking
- **GitHub API**: Rate limit and call tracking

## 📊 Admin Endpoints

### Agent Control
```bash
# Enable agents
curl -X POST http://localhost:3001/admin/agents/enable \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Disable agents
curl -X POST http://localhost:3001/admin/agents/disable \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Check agent status
curl http://localhost:3001/admin/agents/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Dead Letter Queue Management
```bash
# View dead letter queue
curl http://localhost:3001/admin/dead-letter \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Clear dead letter queue
curl -X POST http://localhost:3001/admin/dead-letter/clear \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Health Check
```bash
# Health check (no auth required)
curl http://localhost:3001/admin/health
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENTS_ENABLED` | `true` | Global agent enable/disable |
| `ADMIN_TOKEN` | - | Required for admin endpoints |
| `WEBHOOK_WORKER_CONCURRENCY` | `8` | Webhook processing concurrency |
| `QUEUE_SIZE_LIMIT` | `1000` | Maximum queue size |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |

### Production Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set environment variables**:
   ```bash
   export GITHUB_TOKEN="your_github_token"
   export GITHUB_REPOSITORY="owner/repo"
   export WEBHOOK_SECRET="your_webhook_secret"
   export ADMIN_TOKEN="secure_random_token"
   export REDIS_URL="redis://localhost:6379"
   ```

3. **Start with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

## 🚨 Operational Safety

### Kill Switch Options

1. **Environment Variable**: Set `AGENTS_ENABLED=false`
2. **Redis Toggle**: Use admin endpoints to disable at runtime
3. **Circuit Breaker**: Automatic protection when failure rate exceeds 50%
4. **Queue Backpressure**: Automatic rejection when queue is full

### Recovery Procedures

```bash
# Disable agents instantly
redis-cli SET agents:enabled 0

# Check system status
curl http://localhost:3001/admin/agents/status

# Monitor metrics
curl http://localhost:3001/metrics

# View dead letter queue
curl http://localhost:3001/admin/dead-letter
```

### Monitoring Alerts

- Circuit breaker open: `webhook_circuit_breaker_open = 1`
- Queue overload: `webhook_queue_size > QUEUE_SIZE_LIMIT * 0.8`
- High error rate: `github_agent_errors_total` increasing rapidly
- Agents disabled: `agents_enabled = 0`

## 🎯 Testing the Resilience

### Manual Circuit Breaker Test
```bash
# Send multiple failing webhooks to trigger circuit breaker
for i in {1..20}; do
  curl -X POST http://localhost:3001/webhook \
    -H "Content-Type: application/json" \
    -d '{"action":"test_failure"}'
done

# Check circuit breaker status
curl http://localhost:3001/metrics | grep webhook_circuit
```

### Agent Toggle Test
```bash
# Disable agents
curl -X POST http://localhost:3001/admin/agents/disable \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Send webhook (should be queued, not processed)
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{"action":"opened","pull_request":{"number":123}}'

# Re-enable agents
curl -X POST http://localhost:3001/admin/agents/enable \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## 📈 Metrics Dashboard

Access Grafana at `http://localhost:3000` (admin/admin) to view:

- Webhook processing rate and duration
- Circuit breaker status
- Queue depth and processing time
- GitHub API rate limits
- System health metrics

## 🔒 Security Considerations

- **Admin Token**: Required for all admin operations
- **CODEOWNERS**: Critical files require team approval
- **Branch Protection**: Enable for production deployment
- **Secrets Management**: Never commit tokens to git

## 🏗️ Architecture

```
GitHub Webhook → Load Balancer → PR Manager
                                     ↓
                              Circuit Breaker
                                     ↓
                               Queue Manager
                                     ↓
                              Worker Pool → GitHub API
                                     ↓        ↓
                               Metrics ← AI Service
```

## 🚀 Deployment

### Production Checklist

- [ ] Set all required environment variables
- [ ] Configure Redis for persistence
- [ ] Set up Prometheus/Grafana monitoring
- [ ] Configure log aggregation
- [ ] Set up alerting for circuit breaker events
- [ ] Test failover scenarios
- [ ] Document recovery procedures

### Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests with:
- Deployment with health checks
- Service and ingress configuration
- ConfigMap for environment variables
- Secret for sensitive data

## 📞 Support

For production issues:

1. Check `/admin/health` endpoint
2. Review `/metrics` for system state
3. Check dead letter queue: `/admin/dead-letter`
4. Use admin endpoints to disable agents if needed
5. Review application logs for detailed error information

The system is designed to fail gracefully and provide operational visibility for quick resolution of issues.
