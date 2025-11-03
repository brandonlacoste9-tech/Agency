# LongCat Migration - Production Smoke Tests

## Quick Verification Commands

### 1. Test Video Generation (LongCat)
```bash
# Replace YOUR_SITE_URL with your actual Netlify URL
curl -s -X POST https://YOUR_SITE_URL/.netlify/functions/sora-generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A cat playing piano","duration":10}' | jq

# Expected response:
# {
#   "jobId": "job_abc123",
#   "status": "queued",
#   "createdAt": "2025-11-03T...",
#   "requestId": "req_1730...",
#   "message": "Video generation queued..."
# }
```

### 2. Check Video Status
```bash
# Use the jobId from the previous response
curl -s "https://YOUR_SITE_URL/.netlify/functions/sora-status?jobId=job_abc123" | jq

# Expected response:
# {
#   "id": "job_abc123",
#   "status": "processing" | "completed" | "failed",
#   "progress": 0.5,
#   "video_url": "https://..." // when completed
# }
```

### 3. Test Rollback Capability
```bash
# Set USE_LONGCAT=0 in Netlify environment, then test:
curl -s -X POST https://YOUR_SITE_URL/.netlify/functions/sora-generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test rollback"}' | jq

# Expected response when rolled back:
# {
#   "error": "Service temporarily unavailable...",
#   "status": 501
# }
```

## Environment Setup Commands

### Netlify CLI Configuration
```bash
# Set LongCat environment variables
netlify env:set LONGCAT_API_KEY "sk-your-actual-key" --site=YOUR_SITE_ID
netlify env:set LONGCAT_BASE_URL "https://api.longcat.ai/v1" --site=YOUR_SITE_ID
netlify env:set USE_LONGCAT "1" --site=YOUR_SITE_ID
netlify env:set DEBUG_LONGCAT "0" --site=YOUR_SITE_ID
netlify env:set ENABLE_TELEMETRY "true" --site=YOUR_SITE_ID
netlify env:set DEBUG_TELEMETRY "false" --site=YOUR_SITE_ID

# Verify environment variables
netlify env:list --site=YOUR_SITE_ID
```

### Local Development Testing
```bash
# Copy .env.example to .env and fill in your values
cp .env.example .env

# Edit .env with your actual API keys:
# LONGCAT_API_KEY=sk-your-actual-key
# USE_LONGCAT=1
# DEBUG_LONGCAT=1
# DEBUG_TELEMETRY=true

# Test locally with Netlify Dev
netlify dev &

# Test local endpoints
curl -X POST http://localhost:8888/.netlify/functions/sora-generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A cat playing piano","duration":10}' | jq
```

## Validation Checklist

### ✅ Core Functionality
- [ ] POST /api/sora/generate returns valid jobId
- [ ] GET /api/sora/status returns job status  
- [ ] Response includes required fields: id, status, progress
- [ ] Telemetry events logged (check DEBUG_TELEMETRY=true)

### ✅ Error Handling
- [ ] Invalid prompt returns 400 error
- [ ] Prompt too long returns 400 error
- [ ] API errors properly handled and logged

### ✅ Feature Flags
- [ ] USE_LONGCAT=1 enables LongCat integration
- [ ] USE_LONGCAT=0 returns 501 rollback response
- [ ] DEBUG_LONGCAT=1 enables debug logging

### ✅ Telemetry
- [ ] video_generation_request events tracked
- [ ] video_generation_result events tracked
- [ ] requestId correlation working
- [ ] Latency measurements accurate

## Monitoring Setup

### Key Metrics to Track
```javascript
// Examples of queries you can run on your telemetry data:

// Success rate
SELECT 
  status,
  COUNT(*) as count,
  (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()) as percentage
FROM telemetry_events 
WHERE event = 'video_generation_result'
GROUP BY status;

// Average latency by provider
SELECT 
  provider,
  AVG(latency_ms) as avg_latency,
  PERCENTILE(latency_ms, 0.95) as p95_latency
FROM telemetry_events 
WHERE event = 'video_generation_result'
GROUP BY provider;

// Daily request volume
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as requests
FROM telemetry_events 
WHERE event = 'video_generation_request'
GROUP BY DATE(timestamp);
```

### Recommended Alerts
- Video generation error rate > 5%
- Average latency > 30 seconds
- No requests for > 1 hour (service down?)
- LongCat API key errors

## Troubleshooting

### Common Issues
1. **Build failures**: Check Next.js/SWC version alignment
2. **Function timeouts**: Check LONGCAT_API_KEY and network
3. **Missing telemetry**: Verify ENABLE_TELEMETRY=true
4. **Rollback not working**: Check USE_LONGCAT environment variable

### Debug Commands
```bash
# Check function logs
netlify functions:list
netlify functions:log sora-generate

# Test with debug mode
DEBUG_LONGCAT=1 DEBUG_TELEMETRY=1 netlify dev

# Verify configuration
netlify env:list
```

## Success Criteria

### ✅ Production Ready When:
- All smoke tests pass
- Telemetry events flowing
- Error rates < 1%
- Average latency < 10s
- Rollback capability verified
- Monitoring dashboards configured

### 🚀 Go Live Checklist:
- [ ] Netlify environment variables configured
- [ ] Production smoke tests successful
- [ ] Telemetry flowing to your analytics platform
- [ ] Monitoring alerts configured
- [ ] Team notified of migration completion
- [ ] Documentation updated with new endpoints

---

**Next Steps**: Run the smoke tests, configure monitoring, and celebrate a successful LongCat migration! 🎉