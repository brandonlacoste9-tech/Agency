# BeeHive Codex Database Schema

## Overview

Supabase PostgreSQL schema for implementing all four BeeHive rituals with full audit trails, learning patterns, and persistent context.

---

## 1. Badge Ritual Tables

### `agents`
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT UNIQUE NOT NULL,  -- e.g., "content-gen-v1"
  name TEXT NOT NULL,
  role TEXT NOT NULL,  -- "content_generator", "video_prompter", etc.

  -- Capabilities & Permissions
  capabilities TEXT[] NOT NULL,  -- ["generate:text", "estimate:cost"]
  tools_granted TEXT[] NOT NULL,  -- ["openai-api", "sora-api"]
  escalation_level INT DEFAULT 2,  -- 1=Auto, 2=Notify, 3=Approve, 4=Human

  -- Rate Limiting
  requests_per_minute INT DEFAULT 100,
  tokens_per_day INT DEFAULT 1000000,
  costs_per_month DECIMAL DEFAULT 5000,

  -- Authentication
  api_key_hash TEXT,  -- Hashed API key for agent
  jwt_secret TEXT,    -- Secret for signing JWTs

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_agent_id (agent_id),
  INDEX idx_is_active (is_active)
);

-- Permissions audit log
CREATE TABLE agent_permissions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  action TEXT NOT NULL,  -- "tool_granted", "tool_revoked", "escalation_changed"
  before_state JSONB,
  after_state JSONB,
  changed_by UUID,  -- Admin who made change
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_agent_id_time (agent_id, created_at DESC)
);

-- Token usage per agent (real-time)
CREATE TABLE agent_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  date DATE NOT NULL,
  tokens_used INT DEFAULT 0,
  requests_count INT DEFAULT 0,
  cost_usd DECIMAL DEFAULT 0,

  UNIQUE(agent_id, date),
  INDEX idx_agent_date (agent_id, date DESC)
);
```

---

## 2. Metrics Ritual Tables

### `metrics_events`
```sql
CREATE TABLE metrics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  execution_id TEXT NOT NULL,  -- Unique per execution

  -- Performance
  latency_ms INT,
  p99_latency_ms INT,
  tokens_used INT,
  cost_usd DECIMAL,

  -- Quality
  success BOOLEAN,
  error_type TEXT,
  error_message TEXT,
  user_rating INT CHECK (user_rating >= 1 AND user_rating <= 5),

  -- Business
  tokens_generated INT,
  revenue_impact DECIMAL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_agent_time (agent_id, created_at DESC),
  INDEX idx_success (success),
  INDEX idx_execution_id (execution_id)
);

-- Aggregated metrics (pre-computed for dashboards)
CREATE TABLE metrics_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  hour TIMESTAMPTZ NOT NULL,

  -- Aggregates
  total_requests INT,
  success_count INT,
  error_count INT,
  avg_latency_ms DECIMAL,
  p99_latency_ms INT,
  total_tokens INT,
  total_cost DECIMAL,
  avg_user_rating DECIMAL,

  UNIQUE(agent_id, hour),
  INDEX idx_agent_hour (agent_id, hour DESC)
);

-- Threshold alerts
CREATE TABLE metrics_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  alert_type TEXT NOT NULL,  -- "error_spike", "cost_overage", "latency_high"
  metric_name TEXT,
  threshold_value DECIMAL,
  actual_value DECIMAL,
  severity TEXT,  -- "warning", "critical"
  resolved BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  INDEX idx_alert_type (alert_type),
  INDEX idx_resolved (resolved)
);
```

---

## 3. Echo Ritual Tables

### `echo_entries`
```sql
CREATE TABLE echo_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  execution_id TEXT NOT NULL,

  -- Input/Output
  input_prompt TEXT,
  output_content TEXT,

  -- Outcome
  success BOOLEAN,
  user_rating INT,
  user_feedback TEXT,

  -- Business Impact
  engagement_metrics JSONB,  -- {clicks, conversions, ctr, etc.}
  performance_data JSONB,    -- {ctr: 3.2%, conversion: 2.1%, etc.}

  -- Learned Patterns
  patterns_learned TEXT[],  -- ["Benefit-driven works", "2-line format preferred"]
  key_insights TEXT,

  -- Model/Config Info
  model_used TEXT,
  parameters JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_agent_time (agent_id, created_at DESC),
  INDEX idx_success (success),
  INDEX idx_user_rating (user_rating DESC)
);

-- Pattern library (extracted from Echo entries)
CREATE TABLE echo_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,  -- "eco-friendly-products"
  pattern_name TEXT NOT NULL,  -- "benefit-driven-headline"
  description TEXT,

  -- Pattern Success Metrics
  success_rate DECIMAL,  -- 0-100
  usage_count INT DEFAULT 0,
  avg_user_rating DECIMAL,
  avg_engagement JSONB,

  -- Pattern Details
  pattern_examples TEXT[],  -- Example prompts/outputs
  best_practices TEXT[],
  anti_patterns TEXT[],

  -- Learned Context
  optimal_model TEXT,
  optimal_parameters JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(topic, pattern_name),
  INDEX idx_topic (topic),
  INDEX idx_success_rate (success_rate DESC)
);

-- Pattern usage tracking
CREATE TABLE echo_pattern_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID NOT NULL REFERENCES echo_patterns(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  execution_id TEXT NOT NULL,

  success BOOLEAN,
  user_rating INT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_pattern_time (pattern_id, timestamp DESC)
);
```

---

## 4. History Ritual Tables

### `history_timeline`
```sql
CREATE TABLE history_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- Owner of context
  project_id TEXT NOT NULL,  -- e.g., "q4-campaign-2025"

  -- Time Period
  period_start DATE,
  period_end DATE,
  time_bucket TEXT,  -- "daily", "weekly", "monthly", "quarterly"

  -- Project Context
  project_name TEXT,
  project_goals TEXT,
  target_audience TEXT,

  -- Historical Performance
  total_generations INT DEFAULT 0,
  success_rate DECIMAL,
  avg_user_satisfaction DECIMAL,
  total_tokens_used INT,
  total_cost DECIMAL,

  -- Learned Insights
  successful_patterns TEXT[],
  failed_patterns TEXT[],
  key_learnings TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, project_id, time_bucket),
  INDEX idx_user_project (user_id, project_id),
  INDEX idx_time_bucket (time_bucket)
);

-- Historical events (detailed log)
CREATE TABLE history_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id TEXT NOT NULL,

  event_type TEXT NOT NULL,  -- "generation_success", "pattern_discovered", "cost_optimized"
  event_date TIMESTAMPTZ DEFAULT NOW(),

  -- Event Details
  agent_id UUID REFERENCES agents(id),
  model_used TEXT,
  tokens_used INT,
  cost_usd DECIMAL,

  -- Contextual Data
  generation_data JSONB,
  engagement_metrics JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_user_project_date (user_id, project_id, event_date DESC),
  INDEX idx_event_type (event_type)
);

-- Seasonal patterns (extracted from historical data)
CREATE TABLE history_seasonal_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id TEXT,  -- NULL for global patterns

  season TEXT NOT NULL,  -- "Q1", "Q4", "holiday", "summer"
  metric_name TEXT,  -- "engagement", "ctr", "conversion"
  baseline_value DECIMAL,
  seasonal_multiplier DECIMAL,  -- e.g., 1.4 = 40% boost in Q4
  confidence INT,  -- 0-100, statistical confidence

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_user_season (user_id, season)
);

-- Next period recommendations (AI-generated from history)
CREATE TABLE history_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id TEXT,
  recommendation_for_period TEXT,  -- "next_quarter", "next_month"

  recommendation_text TEXT,
  confidence DECIMAL,  -- 0-100
  expected_impact JSONB,  -- {improvement_percentage, estimated_cost_saving, etc.}

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_user_recommendation (user_id, recommendation_for_period)
);
```

---

## 5. Integration Tables

### `executions` (Central log for all agent runs)
```sql
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id TEXT UNIQUE NOT NULL,  -- For external reference
  user_id UUID NOT NULL,
  agent_id UUID NOT NULL REFERENCES agents(id),

  -- Execution Context
  input_data JSONB,
  output_data JSONB,

  -- Status & Timeline
  status TEXT,  -- "queued", "running", "completed", "failed"
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Results
  success BOOLEAN,
  error_details TEXT,

  -- Rituals Integration
  echo_entry_id UUID REFERENCES echo_entries(id),
  metrics_event_id UUID REFERENCES metrics_events(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_user_time (user_id, created_at DESC),
  INDEX idx_agent_time (agent_id, created_at DESC),
  INDEX idx_status (status)
);

-- Approval workflow
CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES executions(id),

  escalation_level INT NOT NULL,  -- 1-4
  requested_by UUID,  -- Agent ID
  requested_at TIMESTAMPTZ DEFAULT NOW(),

  approver_id UUID,  -- Human operator
  approval_status TEXT,  -- "pending", "approved", "rejected"
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  approval_signature TEXT,  -- Signed JWT confirming approval

  INDEX idx_status (approval_status),
  INDEX idx_approver (approver_id),
  INDEX idx_requested_time (requested_at DESC)
);
```

---

## 6. Views for Common Queries

### Agent Performance Summary
```sql
CREATE VIEW agent_performance_summary AS
SELECT
  a.agent_id,
  a.name,
  COUNT(e.id) as total_executions,
  ROUND(100.0 * SUM(CASE WHEN e.success THEN 1 ELSE 0 END) / COUNT(e.id), 2) as success_rate,
  ROUND(AVG(e.latency_ms)::NUMERIC, 2) as avg_latency_ms,
  ROUND(SUM(e.cost_usd)::NUMERIC, 4) as total_cost,
  ROUND(AVG(e.user_rating)::NUMERIC, 2) as avg_rating,
  MAX(e.created_at) as last_execution
FROM agents a
LEFT JOIN metrics_events e ON a.id = e.agent_id
GROUP BY a.id, a.agent_id, a.name;
```

### Pattern Effectiveness
```sql
CREATE VIEW pattern_effectiveness AS
SELECT
  ep.topic,
  ep.pattern_name,
  COUNT(epu.id) as usage_count,
  ROUND(100.0 * SUM(CASE WHEN epu.success THEN 1 ELSE 0 END) / COUNT(epu.id), 2) as success_rate,
  ROUND(AVG(epu.user_rating)::NUMERIC, 2) as avg_rating,
  MAX(epu.timestamp) as last_used
FROM echo_patterns ep
LEFT JOIN echo_pattern_usage epu ON ep.id = epu.pattern_id
GROUP BY ep.id, ep.topic, ep.pattern_name;
```

### Cost Optimization Insights
```sql
CREATE VIEW cost_insights AS
SELECT
  a.agent_id,
  a.name,
  CURRENT_DATE as date,
  COALESCE(au.tokens_used, 0) as tokens_today,
  COALESCE(au.cost_usd, 0) as cost_today,
  a.tokens_per_day as daily_limit,
  ROUND(100.0 * COALESCE(au.tokens_used, 0) / a.tokens_per_day, 2) as usage_percentage,
  CASE
    WHEN au.cost_usd > a.costs_per_month / 30 THEN 'OVER_BUDGET'
    WHEN au.cost_usd > (a.costs_per_month / 30) * 0.8 THEN 'APPROACHING_LIMIT'
    ELSE 'HEALTHY'
  END as status
FROM agents a
LEFT JOIN agent_usage au ON a.id = au.agent_id AND au.date = CURRENT_DATE;
```

---

## 7. Indexes for Performance

```sql
-- Badge Ritual
CREATE INDEX idx_agent_capabilities ON agents USING GIN(capabilities);
CREATE INDEX idx_agent_tools ON agents USING GIN(tools_granted);

-- Metrics Ritual
CREATE INDEX idx_metrics_agent_success ON metrics_events(agent_id, success, created_at DESC);
CREATE INDEX idx_metrics_date_range ON metrics_events(created_at) WHERE success = true;

-- Echo Ritual
CREATE INDEX idx_echo_agent_rating ON echo_entries(agent_id, user_rating DESC);
CREATE INDEX idx_pattern_topic_rating ON echo_patterns(topic, success_rate DESC);

-- History Ritual
CREATE INDEX idx_history_user_project ON history_timeline(user_id, project_id);
CREATE INDEX idx_seasonal_user_season ON history_seasonal_patterns(user_id, season);

-- General
CREATE INDEX idx_created_at_desc ON metrics_events(created_at DESC);
CREATE INDEX idx_created_at_desc_echo ON echo_entries(created_at DESC);
CREATE INDEX idx_created_at_desc_executions ON executions(created_at DESC);
```

---

## 8. Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE echo_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- Users can only see their own executions
CREATE POLICY exec_user_isolation ON executions
  FOR SELECT USING (user_id = auth.uid());

-- Agents can only see/update their own usage
CREATE POLICY agent_usage_isolation ON agent_usage
  FOR SELECT USING (
    agent_id IN (SELECT id FROM agents WHERE api_key_hash = current_setting('request.headers')::json->>'x-api-key')
  );

-- Approvers see only their approval requests
CREATE POLICY approval_isolation ON approvals
  FOR SELECT USING (
    approver_id = auth.uid() OR approver_id IS NULL  -- NULL = not yet assigned
  );
```

---

## 9. Setup Instructions

```bash
# 1. Create Supabase project
# 2. In SQL Editor, run all CREATE TABLE statements above
# 3. Create indexes and views
# 4. Enable RLS policies
# 5. Create JWT secret and API keys for agents

-- Generate agent API keys (run once per agent)
INSERT INTO agents (
  agent_id, name, role, capabilities, tools_granted
) VALUES (
  'content-gen-v1',
  'Content Generator',
  'content_generation',
  ARRAY['generate:text', 'estimate:cost'],
  ARRAY['openai-api', 'analytics-api']
);

-- Create service role API key in Supabase Settings
-- Store in .env as SUPABASE_SERVICE_ROLE_KEY
```

---

## 10. Backup & Recovery

```bash
# Backup database (daily)
pg_dump -h db.supabase.co -U postgres \
  -d postgres \
  --data-only \
  > backup-$(date +%Y%m%d).sql

# Restore from backup
psql -h db.supabase.co -U postgres -d postgres < backup-20250131.sql

# Cleanup old metrics (retention policy)
DELETE FROM metrics_events
WHERE created_at < NOW() - INTERVAL '90 days'
AND success = true;  -- Keep failures for learning

DELETE FROM metrics_hourly
WHERE hour < NOW() - INTERVAL '1 year';
```

---

This schema implements the complete BeeHive Codex with audit trails, learning patterns, persistent context, and production-grade performance.
