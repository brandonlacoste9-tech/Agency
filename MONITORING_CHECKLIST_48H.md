# 48-Hour LongCat Migration Monitoring Checklist

## Daily Monitoring Checklist (Run Every 12 Hours)

### ⚡ Quick Health Check (2 minutes)
```bash
# 1. Check error rates in last 24h
curl -s "https://your-site.netlify.app/.netlify/functions/sora-generate" \
  -H "Content-Type: application/json" \
  -X POST -d '{"prompt":"Health check","duration":5}' | jq

# 2. Verify telemetry is flowing
# Check your telemetry dashboard or endpoint for recent events

# 3. Check Netlify function logs for errors
netlify functions:log sora-generate --since=24h
```

### 📊 Telemetry Verification (5 minutes)
```sql
-- Example queries for your telemetry database:

-- 1. Request volume (last 24h)
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as requests,
  COUNT(CASE WHEN properties->>'status' = 'error' THEN 1 END) as errors
FROM telemetry_events 
WHERE event = 'video_generation_request' 
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour 
ORDER BY hour DESC;

-- 2. Average latency by provider
SELECT 
  properties->>'provider' as provider,
  AVG((properties->>'latency_ms')::int) as avg_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (properties->>'latency_ms')::int) as p95_latency_ms,
  COUNT(*) as total_requests
FROM telemetry_events 
WHERE event = 'video_generation_result'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY provider;

-- 3. Error breakdown
SELECT 
  properties->>'status' as status,
  properties->>'error' as error_type,
  COUNT(*) as count
FROM telemetry_events 
WHERE event = 'video_generation_result'
  AND timestamp > NOW() - INTERVAL '24 hours'
  AND properties->>'status' = 'error'
GROUP BY status, error_type
ORDER BY count DESC;
```

### 🚨 Alert Checks (3 minutes)
Run these queries and alert if thresholds are exceeded:

```bash
# 1. Error Rate Check (should be < 1%)
ERROR_RATE=$(your-telemetry-query-error-rate-last-hour)
if [ "$ERROR_RATE" -gt "1" ]; then
  echo "🚨 HIGH ERROR RATE: ${ERROR_RATE}% - Consider rollback"
fi

# 2. Latency Check (should be < 30s p95)
P95_LATENCY=$(your-telemetry-query-p95-latency)
if [ "$P95_LATENCY" -gt "30000" ]; then
  echo "🚨 HIGH LATENCY: ${P95_LATENCY}ms p95"
fi

# 3. Volume Check (should have some requests)
REQUEST_COUNT=$(your-telemetry-query-request-count-last-hour)
if [ "$REQUEST_COUNT" -eq "0" ]; then
  echo "⚠️ NO REQUESTS in last hour - check service health"
fi
```

### 🔄 Rollback Test (1 minute)
```bash
# Test rollback capability weekly
netlify env:set USE_LONGCAT "0" --site=YOUR_SITE_ID
curl -s -X POST "https://your-site.netlify.app/.netlify/functions/sora-generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Rollback test"}' | jq '.error' # Should see 501 error
netlify env:set USE_LONGCAT "1" --site=YOUR_SITE_ID
```

## Day 1 Checklist (0-24 hours post-deployment)

### Hour 1: Immediate Verification
- [ ] Netlify environment variables configured
- [ ] First successful API call with LongCat
- [ ] Telemetry events appearing in your system
- [ ] No critical errors in function logs
- [ ] Rollback test successful

### Hour 6: Performance Baseline
- [ ] Record baseline p95 latency 
- [ ] Record baseline error rate (should be ~0%)
- [ ] Verify cost tracking is working
- [ ] Check request correlation (requestId) is working

### Hour 24: Daily Review
- [ ] Review error logs and patterns
- [ ] Check if any alerts fired
- [ ] Verify telemetry data quality
- [ ] Performance trends look healthy
- [ ] Update stakeholders on migration status

## Day 2 Checklist (24-48 hours)

### Key Metrics to Monitor
- [ ] **Error Rate**: < 1% sustained
- [ ] **P95 Latency**: < 30 seconds 
- [ ] **Request Volume**: Expected traffic patterns
- [ ] **Cost**: Within expected budget range
- [ ] **Telemetry Quality**: No missing or malformed events

### Optimization Opportunities
- [ ] Identify most common error types
- [ ] Check for retry pattern effectiveness
- [ ] Review timeout configurations
- [ ] Assess need for circuit breaker
- [ ] Plan permanent job state storage

### Stakeholder Communication
- [ ] Send migration success summary
- [ ] Share key performance metrics
- [ ] Document any issues encountered
- [ ] Plan for permanent monitoring setup

## Red Flags (Immediate Action Required)

### 🚨 Critical Issues
- **Error rate > 5%**: Immediate rollback consideration
- **P95 latency > 60s**: Performance investigation required
- **No telemetry events**: Monitoring system broken
- **Cost spike > 2x expected**: Budget protection needed

### ⚠️ Warning Signs  
- **Error rate 1-5%**: Monitor closely, investigate patterns
- **P95 latency 30-60s**: Performance optimization needed
- **Missing requestIds**: Correlation tracking broken
- **Irregular request patterns**: Possible service issues

## Success Criteria (48-hour mark)

### ✅ Migration Successful If:
- [ ] Error rate consistently < 1%
- [ ] P95 latency consistently < 30s
- [ ] No production incidents
- [ ] Telemetry flowing correctly
- [ ] Cost within 10% of projections
- [ ] Rollback capability verified
- [ ] Team confidence in new system

### 🎯 Next Steps After 48h:
- [ ] Set up permanent monitoring dashboard
- [ ] Configure automated alerts
- [ ] Plan circuit breaker implementation
- [ ] Schedule cost optimization review
- [ ] Document lessons learned
- [ ] Celebrate successful migration! 🎉

## Emergency Contacts & Procedures

### Rollback Procedure (< 2 minutes)
```bash
# Immediate soft rollback
netlify env:set USE_LONGCAT "0" --site=YOUR_SITE_ID

# Verify rollback working
curl -s -X POST "https://your-site.netlify.app/.netlify/functions/sora-generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test"}' | jq
# Should return 501 error

# Alert team
echo "🚨 LongCat rollback activated at $(date)" | send-to-slack
```

### Escalation Path
1. **Developer**: Investigate logs and telemetry
2. **Tech Lead**: Decide on rollback vs. fix-forward  
3. **Product**: Communicate with stakeholders
4. **Operations**: Coordinate infrastructure changes

---

**Remember**: This is a 48-hour intensive monitoring period. After success confirmation, transition to normal operational monitoring cadence.