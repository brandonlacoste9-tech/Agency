# 🔧 GitHub PR Manager - Operational Runbook

## 🚨 Emergency Procedures

### Service Down
```bash
# Check service status
curl -f http://localhost:3001/health
docker ps | grep github-pr-manager
systemctl status github-pr-manager  # if using systemd

# Emergency restart
docker-compose -f docker-compose.production.yml restart github-pr-manager
# OR
systemctl restart github-pr-manager

# Check logs for errors
docker logs github-pr-manager-enhanced_github-pr-manager_1 --tail 100
```

### High Queue Length (>100 items)
```bash
# Check queue metrics
curl -s http://localhost:3001/metrics | grep github_webhook_queue_length

# Scale up workers (if using Docker)
docker-compose -f docker-compose.production.yml up -d --scale github-pr-manager=3

# Drain queue manually (if needed)
# Connect to Redis and inspect
redis-cli -h localhost -p 6379
> LLEN queue:github-webhook
> LPOP queue:github-webhook  # Process one item manually
```

### High Error Rate (>5%)
```bash
# Check error metrics
curl -s http://localhost:3001/metrics | grep github_errors_total

# Check recent errors in logs
docker logs github-pr-manager-enhanced_github-pr-manager_1 --since="10m" | grep ERROR

# Common fixes:
# 1. Invalid webhook signature -> Check WEBHOOK_SECRET
# 2. GitHub API rate limit -> Check GITHUB_TOKEN permissions
# 3. Redis connection -> Restart Redis container
```

### Memory Leak / High Memory Usage
```bash
# Check memory usage
docker stats github-pr-manager-enhanced_github-pr-manager_1

# If memory > 512MB, restart with memory limit
docker update --memory="512m" github-pr-manager-enhanced_github-pr-manager_1
docker restart github-pr-manager-enhanced_github-pr-manager_1

# Enable Node.js heap dumps for investigation
docker exec -it github-pr-manager-enhanced_github-pr-manager_1 kill -USR2 1
```

## 📊 Monitoring & Alerting

### Prometheus Alerts
Create these alerts in your Prometheus configuration:

```yaml
# prometheus-alerts.yml
groups:
- name: github-pr-manager
  rules:
  - alert: GitHubPRManagerDown
    expr: up{job="github_pr_manager"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "GitHub PR Manager service is down"
      
  - alert: HighWebhookQueueLength
    expr: github_webhook_queue_length > 100
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Webhook queue backing up ({{ $value }} items)"
      
  - alert: HighErrorRate
    expr: rate(github_webhook_errors_total[5m]) / rate(github_webhook_processed_total[5m]) > 0.05
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate: {{ $value | humanizePercentage }}"
      
  - alert: LongProcessingTime
    expr: histogram_quantile(0.95, rate(github_webhook_processing_duration_seconds_bucket[5m])) > 30
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "95th percentile processing time > 30s"
```

### Grafana Dashboard Panels
```json
{
  "dashboard": {
    "title": "GitHub PR Manager",
    "panels": [
      {
        "title": "Queue Length",
        "type": "stat",
        "targets": [{"expr": "github_webhook_queue_length"}]
      },
      {
        "title": "Processing Rate",
        "type": "graph", 
        "targets": [
          {"expr": "rate(github_webhook_processed_total[5m])", "legendFormat": "Processed/sec"},
          {"expr": "rate(github_webhooks_total[5m])", "legendFormat": "Received/sec"}
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [{"expr": "rate(github_webhook_errors_total[5m])"}]
      },
      {
        "title": "Processing Duration (95th percentile)",
        "type": "graph",
        "targets": [{"expr": "histogram_quantile(0.95, rate(github_webhook_processing_duration_seconds_bucket[5m]))"}]
      }
    ]
  }
}
```

## 🔐 Security Operations

### Rotate Webhook Secret
```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -hex 32)

# 2. Update GitHub webhook settings with new secret
# (Manual step in GitHub UI)

# 3. Update environment and restart
export WEBHOOK_SECRET=$NEW_SECRET
docker-compose -f docker-compose.production.yml up -d --force-recreate github-pr-manager

# 4. Verify new secret works
./test-webhook-signature.ps1 -Secret $NEW_SECRET
```

### Rotate GitHub Token
```bash
# 1. Create new token in GitHub Settings > Developer settings > Personal access tokens
# 2. Update environment
export GITHUB_TOKEN=new_token_here
docker-compose -f docker-compose.production.yml up -d --force-recreate github-pr-manager

# 3. Revoke old token in GitHub UI
```

### Security Audit Checklist
- [ ] All secrets stored in secure vault (not in .env files)
- [ ] HTTPS enabled with valid TLS certificate
- [ ] Container images scanned for vulnerabilities (Trivy/Anchore)
- [ ] Dependencies updated (`npm audit fix`)
- [ ] Rate limiting enabled
- [ ] Webhook signature validation enabled
- [ ] Access logs monitored for suspicious activity

## 🚀 Deployment Procedures

### Blue-Green Deployment
```bash
# 1. Deploy to "green" environment
docker-compose -f docker-compose.production.yml -p github-pr-manager-green up -d

# 2. Run smoke tests
curl -f http://localhost:3002/health  # assuming green on port 3002
./smoke-tests.ps1 -BaseUrl http://localhost:3002

# 3. Switch traffic (update load balancer or port mapping)
# 4. Monitor for 10 minutes
# 5. Stop blue environment
docker-compose -f docker-compose.production.yml -p github-pr-manager-blue down
```

### Rollback Procedure
```bash
# 1. Quick rollback to previous tag
git checkout v0.9.0  # or previous working tag
docker-compose -f docker-compose.production.yml up -d --build --force-recreate

# 2. Emergency rollback (if git not available)
docker run -p 3001:3001 github-pr-manager-enhanced:v0.9.0

# 3. Verify rollback successful
curl -f http://localhost:3001/health
./smoke-tests.ps1
```

### Database Migration (if needed)
```bash
# 1. Backup database
pg_dump github_agent > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations
docker exec -it github-pr-manager-enhanced_postgres_1 psql -U postgres -d github_agent -f /migrations/001_add_new_columns.sql

# 3. Verify migration
docker exec -it github-pr-manager-enhanced_postgres_1 psql -U postgres -d github_agent -c "\d+ webhook_logs"
```

## 🔍 Troubleshooting Commands

### PowerShell Diagnostics
```powershell
# Check service endpoints
$endpoints = @("health", "ready", "metrics", "webhook/stats")
foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod "http://localhost:3001/$endpoint"
        Write-Host "✅ /$endpoint - OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ /$endpoint - ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test webhook signature generation
$secret = "your-webhook-secret"
$payload = '{"test":"diagnostic","timestamp":"' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + '"}'
$hmac = New-Object System.Security.Cryptography.HMACSHA256([System.Text.Encoding]::UTF8.GetBytes($secret))
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload))
$sig = 'sha256=' + ([System.BitConverter]::ToString($hash) -replace '-','').ToLower()
Write-Host "Generated signature: $sig"

# Send test webhook
try {
    $headers = @{
        'Content-Type' = 'application/json'
        'X-GitHub-Event' = 'ping'
        'X-Hub-Signature-256' = $sig
        'X-GitHub-Delivery' = [guid]::NewGuid()
    }
    $response = Invoke-RestMethod -Uri "http://localhost:3001/webhook" -Method POST -Headers $headers -Body $payload
    Write-Host "✅ Webhook test successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Webhook test failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

### Common Issues & Solutions

#### "Port 3001 already in use"
```bash
# Find what's using the port
ss -ltnp | grep :3001
# OR
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3002 docker-compose -f docker-compose.production.yml up -d
```

#### "No SSE snapshot"
```javascript
// Check in browser console
const eventSource = new EventSource('http://localhost:3001/webhook/events');
eventSource.onmessage = (event) => console.log('SSE:', event.data);
eventSource.onerror = (error) => console.error('SSE Error:', error);

// Should see snapshot + heartbeats + updates
```

#### "CORS errors in browser"
```bash
# Check CORS headers
curl -I -X OPTIONS http://localhost:3001/webhook/events

# Should see:
# Access-Control-Allow-Origin: http://localhost:3001
# Access-Control-Allow-Headers: ...
```

#### "Silent EventSource failure"
- Check `DASHBOARD_ORIGIN` environment variable
- Verify CORS headers match dashboard URL
- Check browser network tab for failed requests

#### "Container keeps restarting"
```bash
# Check restart reason
docker inspect github-pr-manager-enhanced_github-pr-manager_1 | grep -A 5 "RestartPolicy"

# Check healthcheck failures
docker inspect github-pr-manager-enhanced_github-pr-manager_1 | grep -A 10 "Health"

# Check logs
docker logs github-pr-manager-enhanced_github-pr-manager_1 --since="1h"
```

## 📋 Daily Operations Checklist

### Morning Health Check (5 minutes)
- [ ] Check service status: `curl -f http://localhost:3001/health`
- [ ] Check queue length: `curl -s http://localhost:3001/metrics | grep queue_length`
- [ ] Check error rate: Review last 24h in Grafana
- [ ] Check disk space: `df -h` (PostgreSQL and Redis data)
- [ ] Check container status: `docker ps`

### Weekly Maintenance (30 minutes)
- [ ] Review security alerts and update dependencies
- [ ] Backup database: `pg_dump github_agent > weekly_backup.sql`
- [ ] Clean old Docker images: `docker image prune -f`
- [ ] Review and rotate logs if needed
- [ ] Check certificate expiration (if using HTTPS)
- [ ] Run integration tests: `./webhook-integration-test.js`

### Monthly Tasks (1 hour)
- [ ] Security audit: Run `npm audit` and fix vulnerabilities
- [ ] Performance review: Analyze processing time trends
- [ ] Capacity planning: Review resource usage trends
- [ ] Disaster recovery test: Test backup restore procedure
- [ ] Documentation update: Review and update this runbook

## 📞 Escalation Procedures

### Severity Levels

**P0 - Critical (5min response)**
- Service completely down
- All webhooks failing (>90% error rate)
- Security breach detected

**P1 - High (15min response)**  
- Degraded performance (>50% slower)
- High error rate (>20%)
- Queue backup (>500 items)

**P2 - Medium (1hr response)**
- Intermittent issues (<10% error rate)
- Minor performance degradation
- Non-critical feature failures

**P3 - Low (Next business day)**
- Documentation issues
- Enhancement requests
- Non-urgent maintenance

### Contact Information
```bash
# Primary: On-call engineer
# Secondary: Platform team lead  
# Escalation: Engineering manager

# Communication channels:
# - Slack: #github-automation-alerts
# - PagerDuty: GitHub-PR-Manager service
# - Email: platform-team@company.com
```

## 🛡️ Disaster Recovery

### Data Recovery
```bash
# Restore PostgreSQL from backup
docker exec -i github-pr-manager-enhanced_postgres_1 psql -U postgres -d github_agent < backup_20231103_143000.sql

# Restore Redis (if using persistence)
docker cp redis_backup.rdb github-pr-manager-enhanced_redis_1:/data/dump.rdb
docker restart github-pr-manager-enhanced_redis_1
```

### Complete Environment Recreation
```bash
# 1. Clone repository
git clone https://github.com/brandonlacoste9-tech/adgenxai.git
cd adgenxai/agents/github-pr-manager

# 2. Checkout production tag
git checkout v1.0.0

# 3. Set environment variables
cp .env.production .env
# Edit .env with actual values

# 4. Start services
docker-compose -f docker-compose.production.yml up -d

# 5. Verify health
./production-readiness-test.ps1
```

### Business Continuity
- **RTO (Recovery Time Objective)**: 15 minutes
- **RPO (Recovery Point Objective)**: 1 hour (Redis persistence + hourly DB backups)
- **Backup retention**: 30 days
- **Cross-region backup**: Weekly snapshot to S3/Azure Blob

---

## 📚 Additional Resources

- [Production Deployment Summary](./PRODUCTION_DEPLOYMENT_SUMMARY.md)
- [Integration Tests](./webhook-integration-test.js)
- [Production Readiness Tests](./production-readiness-test.ps1)
- [Docker Compose Production](./docker-compose.production.yml)
- [CI/CD Pipeline](../../.github/workflows/github-agent-ci.yml)

**Last Updated**: November 3, 2025  
**Version**: 1.0.0  
**Maintainer**: GitHub PR Manager Team