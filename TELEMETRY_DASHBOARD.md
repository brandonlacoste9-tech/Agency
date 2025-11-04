# LongCat Migration - Telemetry Dashboard & Alert Rules

## Dashboard Queries & Visualizations

### 1. Request Volume & Success Rate
```sql
-- Requests per hour with success rate
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN properties->>'status' = 'queued' THEN 1 END) as successful_requests,
  COUNT(CASE WHEN properties->>'status' = 'error' THEN 1 END) as failed_requests,
  (COUNT(CASE WHEN properties->>'status' = 'queued' THEN 1 END) * 100.0 / COUNT(*)) as success_rate_percent
FROM telemetry_events 
WHERE event = 'video_generation_result'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour 
ORDER BY hour DESC;
```

### 2. Latency Distribution by Provider
```sql
-- P50, P95, P99 latency by provider
SELECT 
  properties->>'provider' as provider,
  COUNT(*) as request_count,
  AVG((properties->>'latency_ms')::int) as avg_latency_ms,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY (properties->>'latency_ms')::int) as p50_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (properties->>'latency_ms')::int) as p95_latency_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (properties->>'latency_ms')::int) as p99_latency_ms,
  MAX((properties->>'latency_ms')::int) as max_latency_ms
FROM telemetry_events 
WHERE event = 'video_generation_result'
  AND timestamp > NOW() - INTERVAL '24 hours'
  AND properties ? 'latency_ms'
GROUP BY provider;
```

### 3. Error Analysis
```sql
-- Error breakdown with trends
SELECT 
  properties->>'error' as error_type,
  properties->>'status' as status,
  COUNT(*) as error_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as error_percentage,
  MIN(timestamp) as first_seen,
  MAX(timestamp) as last_seen,
  STRING_AGG(DISTINCT properties->>'requestId', ', ') as sample_request_ids
FROM telemetry_events 
WHERE event = 'video_generation_result'
  AND timestamp > NOW() - INTERVAL '24 hours'
  AND properties->>'status' = 'error'
GROUP BY error_type, status
ORDER BY error_count DESC;
```

### 4. Request Characteristics Analysis
```sql
-- Request patterns and characteristics
SELECT 
  properties->>'provider' as provider,
  COUNT(*) as requests,
  AVG((properties->>'prompt_length')::int) as avg_prompt_length,
  AVG((properties->>'duration')::int) as avg_duration,
  MIN((properties->>'duration')::int) as min_duration,
  MAX((properties->>'duration')::int) as max_duration,
  COUNT(DISTINCT properties->>'requestId') as unique_request_ids
FROM telemetry_events 
WHERE event = 'video_generation_request'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY provider;
```

### 5. Correlation Analysis (Request → Result)
```sql
-- Match requests to results for completion tracking
WITH requests AS (
  SELECT 
    properties->>'requestId' as request_id,
    timestamp as request_time,
    properties->>'provider' as provider,
    properties->>'prompt_length' as prompt_length
  FROM telemetry_events 
  WHERE event = 'video_generation_request'
    AND timestamp > NOW() - INTERVAL '24 hours'
),
results AS (
  SELECT 
    properties->>'requestId' as request_id,
    timestamp as result_time,
    properties->>'status' as status,
    (properties->>'latency_ms')::int as latency_ms
  FROM telemetry_events 
  WHERE event = 'video_generation_result'
    AND timestamp > NOW() - INTERVAL '24 hours'
)
SELECT 
  r.provider,
  r.request_id,
  r.request_time,
  res.result_time,
  res.status,
  res.latency_ms,
  EXTRACT(EPOCH FROM (res.result_time - r.request_time)) * 1000 as total_processing_time_ms,
  CASE 
    WHEN res.request_id IS NULL THEN 'Missing Result'
    WHEN res.status = 'error' THEN 'Failed'
    ELSE 'Success'
  END as completion_status
FROM requests r
LEFT JOIN results res ON r.request_id = res.request_id
ORDER BY r.request_time DESC
LIMIT 100;
```

## Grafana Dashboard Panels

### Panel 1: Request Rate (Time Series)
```yaml
# Grafana Panel Config
title: "Video Generation Request Rate"
type: "stat"
targets:
  - query: |
      SELECT 
        $__timeGroup(timestamp, '5m') as time,
        COUNT(*) as requests_per_5min
      FROM telemetry_events 
      WHERE event = 'video_generation_request'
        AND $__timeFilter(timestamp)
      GROUP BY time
      ORDER BY time
```

### Panel 2: Success Rate (Gauge)
```yaml
title: "Success Rate (Last Hour)"
type: "gauge"
targets:
  - query: |
      SELECT 
        (COUNT(CASE WHEN properties->>'status' = 'queued' THEN 1 END) * 100.0 / COUNT(*)) as success_rate
      FROM telemetry_events 
      WHERE event = 'video_generation_result'
        AND timestamp > NOW() - INTERVAL '1 hour'
thresholds:
  - color: "red"
    value: 0
  - color: "yellow" 
    value: 95
  - color: "green"
    value: 99
```

### Panel 3: P95 Latency (Time Series)
```yaml
title: "P95 Latency by Provider"
type: "timeseries"
targets:
  - query: |
      SELECT 
        $__timeGroup(timestamp, '5m') as time,
        properties->>'provider' as provider,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (properties->>'latency_ms')::int) as p95_latency
      FROM telemetry_events 
      WHERE event = 'video_generation_result'
        AND $__timeFilter(timestamp)
        AND properties ? 'latency_ms'
      GROUP BY time, provider
      ORDER BY time
```

### Panel 4: Error Rate (Table)
```yaml
title: "Error Breakdown"
type: "table"
targets:
  - query: |
      SELECT 
        properties->>'error' as "Error Type",
        COUNT(*) as "Count",
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as "Percentage"
      FROM telemetry_events 
      WHERE event = 'video_generation_result'
        AND timestamp > NOW() - INTERVAL '1 hour'
        AND properties->>'status' = 'error'
      GROUP BY properties->>'error'
      ORDER BY "Count" DESC
```

## Prometheus Metrics (Alternative)

### Custom Metrics Export
```javascript
// Add to telemetry client for Prometheus integration
const prometheus = require('prom-client');

const requestCounter = new prometheus.Counter({
  name: 'video_generation_requests_total',
  help: 'Total video generation requests',
  labelNames: ['provider', 'status']
});

const latencyHistogram = new prometheus.Histogram({
  name: 'video_generation_latency_ms',
  help: 'Video generation latency in milliseconds',
  labelNames: ['provider'],
  buckets: [100, 500, 1000, 5000, 10000, 30000, 60000]
});

// In your telemetry tracking:
requestCounter.inc({ provider: 'longcat', status: 'queued' });
latencyHistogram.observe({ provider: 'longcat' }, latencyMs);
```

### PromQL Queries
```promql
# Request rate
rate(video_generation_requests_total[5m])

# Success rate
rate(video_generation_requests_total{status="queued"}[5m]) / 
rate(video_generation_requests_total[5m]) * 100

# P95 latency
histogram_quantile(0.95, rate(video_generation_latency_ms_bucket[5m]))

# Error rate
rate(video_generation_requests_total{status="error"}[5m]) / 
rate(video_generation_requests_total[5m]) * 100
```

## Alert Rules Configuration

### 1. High Error Rate Alert
```yaml
# Grafana Alert Rule
name: "LongCat High Error Rate"
condition: |
  SELECT 
    (COUNT(CASE WHEN properties->>'status' = 'error' THEN 1 END) * 100.0 / COUNT(*)) as error_rate
  FROM telemetry_events 
  WHERE event = 'video_generation_result'
    AND timestamp > NOW() - INTERVAL '5 minutes'
  HAVING error_rate > 1
frequency: "1m"
for: "3m"
severity: "critical"
message: |
  🚨 LongCat error rate is {{ $value }}% (threshold: 1%)
  Consider immediate rollback: `netlify env:set USE_LONGCAT "0"`
```

### 2. High Latency Alert
```yaml
name: "LongCat High Latency"
condition: |
  SELECT 
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (properties->>'latency_ms')::int) as p95_latency
  FROM telemetry_events 
  WHERE event = 'video_generation_result'
    AND timestamp > NOW() - INTERVAL '5 minutes'
    AND properties->>'provider' = 'longcat'
  HAVING p95_latency > 30000
frequency: "1m"
for: "5m"
severity: "warning"
message: |
  ⚠️ LongCat P95 latency is {{ $value }}ms (threshold: 30000ms)
  Check LongCat API health and consider optimization
```

### 3. No Requests Alert
```yaml
name: "LongCat No Requests"
condition: |
  SELECT COUNT(*) as request_count
  FROM telemetry_events 
  WHERE event = 'video_generation_request'
    AND timestamp > NOW() - INTERVAL '15 minutes'
  HAVING request_count = 0
frequency: "5m"
for: "15m"
severity: "warning"
message: |
  📉 No video generation requests in last 15 minutes
  Check service health and user traffic patterns
```

### 4. Missing Telemetry Alert
```yaml
name: "Telemetry Data Missing"
condition: |
  SELECT COUNT(*) as event_count
  FROM telemetry_events 
  WHERE timestamp > NOW() - INTERVAL '10 minutes'
  HAVING event_count = 0
frequency: "2m"
for: "10m"
severity: "critical"
message: |
  🚨 No telemetry events in last 10 minutes
  Telemetry system may be down - check immediately
```

## Datadog Integration

### Custom Dashboard JSON
```json
{
  "title": "LongCat Video Generation",
  "widgets": [
    {
      "definition": {
        "title": "Request Rate",
        "type": "timeseries",
        "requests": [
          {
            "q": "sum:video.generation.requests{*}.as_rate()",
            "display_type": "line"
          }
        ]
      }
    },
    {
      "definition": {
        "title": "Success Rate",
        "type": "query_value",
        "requests": [
          {
            "q": "sum:video.generation.requests{status:success}.as_rate() / sum:video.generation.requests{*}.as_rate() * 100",
            "aggregator": "avg"
          }
        ]
      }
    }
  ]
}
```

### Datadog Monitors
```javascript
// Datadog API monitor creation
const monitor = {
  name: "LongCat Error Rate",
  type: "metric alert",
  query: "avg(last_5m):sum:video.generation.requests{status:error}.as_rate() / sum:video.generation.requests{*}.as_rate() * 100 > 1",
  message: "LongCat error rate exceeded 1% @slack-alerts",
  options: {
    thresholds: {
      critical: 1,
      warning: 0.5
    },
    notify_no_data: true,
    no_data_timeframe: 10
  }
};
```

## Cost Monitoring

### Cost Analysis Query
```sql
-- Estimated cost tracking (customize for your pricing model)
SELECT 
  DATE(timestamp) as date,
  properties->>'provider' as provider,
  COUNT(*) as requests,
  SUM(CASE 
    WHEN (properties->>'duration')::int <= 10 THEN 0.05
    WHEN (properties->>'duration')::int <= 30 THEN 0.15
    ELSE 0.30
  END) as estimated_cost_usd,
  AVG((properties->>'duration')::int) as avg_duration_seconds
FROM telemetry_events 
WHERE event = 'video_generation_request'
  AND timestamp > NOW() - INTERVAL '7 days'
  AND properties->>'status' = 'queued'
GROUP BY date, provider
ORDER BY date DESC;
```

### Cost Alert
```yaml
name: "Daily Cost Limit"
condition: |
  SELECT SUM(estimated_cost) as daily_cost
  FROM cost_analysis_view
  WHERE date = CURRENT_DATE
  HAVING daily_cost > 100  -- $100 daily limit
frequency: "1h"
message: |
  💰 Daily video generation cost exceeded ${{ $value }}
  Consider implementing cost controls or usage limits
```

---

## Dashboard Setup Instructions

### 1. Grafana Setup
```bash
# Import dashboard JSON
curl -X POST http://admin:admin@localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @longcat-dashboard.json

# Set up data source (PostgreSQL)
curl -X POST http://admin:admin@localhost:3000/api/datasources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "telemetry-db",
    "type": "postgres",
    "url": "localhost:5432",
    "database": "telemetry",
    "user": "grafana",
    "password": "secret"
  }'
```

### 2. Datadog Setup
```bash
# Install DD agent with custom metrics
DD_API_KEY=your_key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Configure custom metrics in your telemetry client
# See Datadog integration section above
```

### 3. Prometheus + Grafana
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'longcat-metrics'
    static_configs:
      - targets: ['your-site.netlify.app']
    metrics_path: '/api/metrics'
    scrape_interval: 30s
```

This comprehensive dashboard setup will give you complete visibility into your LongCat migration performance! 📊