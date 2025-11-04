# 🚨 GitHub PR Manager - Incident Response Cheatsheet

## Emergency One-Liners (copy/paste during incidents)

### 🔍 **5-Minute Triage**
```powershell
# Quick health check
curl -fsS http://localhost:3001/health | jq .

# Check service status
docker-compose -f docker-compose.production.yml ps

# Check recent logs for errors
docker logs github-pr-manager-enhanced_github-pr-manager_1 --tail 50 | findstr /i "error\|fatal\|exception"

# Check queue depth
redis-cli LLEN queue:github-webhook

# Check metrics for anomalies
curl -s http://localhost:3001/metrics | findstr "github_webhook_queue_length\|github_webhook_errors_total"
```

### 🔥 **Emergency Actions**

#### Service Down
```powershell
# Quick restart
docker-compose -f docker-compose.production.yml restart github-pr-manager

# Force recreate if restart fails
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --force-recreate

# Check if port is blocked
netstat -ano | findstr :3001
```

#### High Queue (>200 items)
```powershell
# Scale up workers immediately
docker-compose -f docker-compose.production.yml up -d --scale github-pr-manager=3

# Check Redis connection
redis-cli -u $env:REDIS_URL ping

# Inspect stuck messages (CAREFUL!)
redis-cli LRANGE queue:github-webhook 0 5

# Emergency queue drain (DANGEROUS - only if stuck)
redis-cli DEL queue:github-webhook
```

#### High Error Rate (>20%)
```powershell
# Check error types in logs
docker logs github-pr-manager-enhanced_github-pr-manager_1 --since="10m" | findstr /i "error" | sort | uniq -c

# Check GitHub API rate limits
curl -H "Authorization: token $env:GITHUB_TOKEN" https://api.github.com/rate_limit

# Test webhook signature validation
./ops-toolkit.ps1 -Operation test-signature

# Restart with clean state
docker-compose -f docker-compose.production.yml restart github-pr-manager
```

#### Memory Leak (>512MB)
```powershell
# Check container memory
docker stats github-pr-manager-enhanced_github-pr-manager_1 --no-stream

# Restart with memory limit
docker update --memory="512m" github-pr-manager-enhanced_github-pr-manager_1
docker restart github-pr-manager-enhanced_github-pr-manager_1

# Generate heap dump for analysis
docker exec -it github-pr-manager-enhanced_github-pr-manager_1 kill -USR2 1
```

### 🔧 **Common Fixes**

#### "Connection Refused" 
```powershell
# Check if process is running
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Check port availability  
Test-NetConnection -ComputerName localhost -Port 3001

# Start service
docker-compose -f docker-compose.production.yml up -d github-pr-manager
```

#### "SSE Not Working"
```powershell
# Test SSE endpoint
curl -N http://localhost:3001/webhook/events

# Check CORS headers
curl -I -X OPTIONS http://localhost:3001/webhook/events

# Verify no proxy buffering (if using Nginx)
curl -H "X-Accel-Buffering: no" http://localhost:3001/webhook/events
```

#### "Webhook Signature Failures"
```powershell
# Verify webhook secret
echo $env:WEBHOOK_SECRET

# Test signature generation
./ops-toolkit.ps1 -Operation test-signature

# Check GitHub webhook configuration
# (Manual: GitHub > Settings > Webhooks > Edit)
```

#### "Redis Connection Issues"
```powershell
# Test Redis connectivity
redis-cli -u $env:REDIS_URL ping

# Check Redis memory usage
redis-cli -u $env:REDIS_URL info memory

# Clear Redis if corrupted (CAREFUL!)
redis-cli -u $env:REDIS_URL FLUSHDB
```

### 📞 **Escalation Commands**

#### Gather Diagnostic Info
```powershell
# Full diagnostic package
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
mkdir "diagnostics_$timestamp"

# System info
docker-compose -f docker-compose.production.yml ps > "diagnostics_$timestamp/containers.txt"
docker logs github-pr-manager-enhanced_github-pr-manager_1 --tail 200 > "diagnostics_$timestamp/app_logs.txt"
curl -s http://localhost:3001/health > "diagnostics_$timestamp/health.json"
curl -s http://localhost:3001/metrics > "diagnostics_$timestamp/metrics.txt"

# Redis info
redis-cli -u $env:REDIS_URL info > "diagnostics_$timestamp/redis_info.txt"
redis-cli -u $env:REDIS_URL LLEN queue:github-webhook > "diagnostics_$timestamp/queue_length.txt"

Write-Host "Diagnostics saved to diagnostics_$timestamp/"
```

#### Create Incident Report
```powershell
# Quick incident summary
$incident = @"
## Incident Report - $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

**Severity**: [P0/P1/P2/P3]
**Status**: [Investigating/Mitigating/Resolved]
**Impact**: [Service Down/Degraded Performance/Partial Outage]

### Timeline:
- $(Get-Date -Format "HH:mm"): Incident detected
- $(Get-Date -Format "HH:mm"): Investigation started
- $(Get-Date -Format "HH:mm"): Root cause identified
- $(Get-Date -Format "HH:mm"): Fix applied
- $(Get-Date -Format "HH:mm"): Service restored

### Root Cause:
[Brief description]

### Resolution:
[Actions taken]

### Prevention:
[Steps to prevent recurrence]

### Metrics During Incident:
- Queue Length: $(redis-cli LLEN queue:github-webhook)
- Error Rate: [Check Grafana]
- Response Time: [Check metrics]
"@

$incident | Out-File "incident_$(Get-Date -Format 'yyyyMMdd_HHmmss').md"
```

### 🔄 **Rollback Procedures**

#### Emergency Rollback
```powershell
# Rollback to previous Docker image
docker pull github-pr-manager-enhanced:v1.0.0
docker-compose -f docker-compose.production.yml down
docker tag github-pr-manager-enhanced:v1.0.0 github-pr-manager-enhanced:latest
docker-compose -f docker-compose.production.yml up -d

# Rollback via Git (if building from source)
git checkout v1.0.0
docker-compose -f docker-compose.production.yml up -d --build --force-recreate
```

#### Verify Rollback Success
```powershell
# Check service health after rollback
./post-deploy-checklist.ps1

# Verify key functionality
./ops-toolkit.ps1 -Operation health-check
./ops-toolkit.ps1 -Operation send-webhook
```

### 📊 **Monitoring Commands**

#### Watch Key Metrics
```powershell
# Live metrics monitoring
while ($true) {
    Clear-Host
    Write-Host "=== GitHub PR Manager Metrics ===" -ForegroundColor Green
    Write-Host "Time: $(Get-Date)" -ForegroundColor Cyan
    
    $metrics = curl -s http://localhost:3001/metrics
    $queueLength = ($metrics | Select-String "github_webhook_queue_length (\d+)").Matches.Groups[1].Value
    $totalWebhooks = ($metrics | Select-String "github_webhooks_total (\d+)").Matches.Groups[1].Value
    $errors = ($metrics | Select-String "github_webhook_errors_total (\d+)").Matches.Groups[1].Value
    
    Write-Host "Queue Length: $queueLength" -ForegroundColor White
    Write-Host "Total Webhooks: $totalWebhooks" -ForegroundColor White  
    Write-Host "Total Errors: $errors" -ForegroundColor White
    
    if ($queueLength -gt 100) { Write-Host "⚠️ HIGH QUEUE!" -ForegroundColor Red }
    if ($errors -gt 0) { 
        $errorRate = [math]::Round(($errors / [math]::Max($totalWebhooks, 1)) * 100, 2)
        Write-Host "Error Rate: $errorRate%" -ForegroundColor $(if($errorRate -gt 5){"Red"}else{"Yellow"})
    }
    
    Start-Sleep 5
}
```

#### Watch Logs Live
```powershell
# Live log monitoring with error highlighting
docker logs github-pr-manager-enhanced_github-pr-manager_1 -f | ForEach-Object {
    if ($_ -match "ERROR|FATAL|💥") {
        Write-Host $_ -ForegroundColor Red
    } elseif ($_ -match "WARN|⚠️") {
        Write-Host $_ -ForegroundColor Yellow
    } else {
        Write-Host $_
    }
}
```

### 🔗 **Quick Links**

- **Logs**: `docker logs github-pr-manager-enhanced_github-pr-manager_1 -f`
- **Metrics**: `http://localhost:3001/metrics`
- **Health**: `http://localhost:3001/health`
- **SSE**: `http://localhost:3001/webhook/events`
- **Grafana**: `http://localhost:3000` (if configured)
- **Prometheus**: `http://localhost:9090` (if configured)

### 🆘 **When All Else Fails**

```powershell
# Nuclear option - complete reset (CAREFUL!)
Write-Host "⚠️ NUCLEAR OPTION - This will destroy all data!" -ForegroundColor Red
$confirm = Read-Host "Type 'RESET' to continue"
if ($confirm -eq "RESET") {
    docker-compose -f docker-compose.production.yml down -v
    docker system prune -f
    docker-compose -f docker-compose.production.yml up -d --build
    Write-Host "✅ Complete reset performed" -ForegroundColor Green
}
```

---

## 📋 **Incident Response Checklist**

### Immediate (0-5 minutes)
- [ ] Check service health: `curl -f http://localhost:3001/health`
- [ ] Check queue depth: `redis-cli LLEN queue:github-webhook`
- [ ] Check recent logs: `docker logs <container> --tail 50`
- [ ] Identify error patterns
- [ ] Determine severity (P0/P1/P2/P3)

### Investigation (5-15 minutes)
- [ ] Gather full diagnostic info
- [ ] Check metrics for anomalies
- [ ] Review recent deployments/changes
- [ ] Test key functionality
- [ ] Determine root cause

### Mitigation (15-30 minutes)
- [ ] Apply immediate fix or rollback
- [ ] Scale resources if needed
- [ ] Verify fix effectiveness
- [ ] Monitor for stability
- [ ] Update stakeholders

### Resolution (30+ minutes)
- [ ] Document root cause
- [ ] Plan permanent fix
- [ ] Update monitoring/alerts
- [ ] Conduct post-incident review
- [ ] Update runbooks

---

**Last Updated**: November 3, 2025  
**Version**: 1.0.1  
**Emergency Contact**: [Your on-call info here]