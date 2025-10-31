# AdGenXAI Integration Quickstart

## 5-Minute Setup Guide

Get AdGenXAI running with BeeHive Codex rituals, agent teams, and real persistence in 5 minutes.

---

## Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project
```bash
# Visit https://supabase.com → New Project
# Name: adgenxai
# Region: us-east-1 (or closest to you)
# Copy your database URL and anon key
```

### 1.2 Initialize Database Schema
```bash
# In Supabase SQL Editor, run:
psql -h db.supabase.co -U postgres -d postgres < docs/DATABASE_SCHEMA.md

# Or copy/paste the CREATE TABLE statements from DATABASE_SCHEMA.md
```

### 1.3 Create Agents
```sql
-- In Supabase SQL Editor:
INSERT INTO agents (
  agent_id, name, role, capabilities, tools_granted, escalation_level
) VALUES
  ('content-gen-v1', 'Content Generator', 'content_generation',
   ARRAY['generate:text', 'estimate:cost'], ARRAY['openai-api', 'analytics-api'], 2),
  ('video-prompt-v1', 'Video Prompter', 'video_generation',
   ARRAY['generate:video', 'check:status'], ARRAY['sora-api', 'analytics-api'], 2),
  ('analytics-v1', 'Analytics Agent', 'analytics',
   ARRAY['query:metrics', 'track:usage'], ARRAY['analytics-api'], 1);
```

---

## Step 2: Environment Configuration

### 2.1 Create .env.local
```bash
# Copy from .env.example
cp .env.example .env.local

# Fill in your values:
```

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# GitHub Models (alternative provider)
GITHUB_TOKEN=github_pat_...

# Sora Video Generation
SORA_API_KEY=your-sora-key

# MCP Servers (local)
MCP_CONTENT_SERVER_URL=http://localhost:8001
MCP_VIDEO_SERVER_URL=http://localhost:8002
MCP_ANALYTICS_SERVER_URL=http://localhost:8003

# n8n (optional, for workflows)
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your-n8n-key

# BeeHive Ritual Secrets
BADGE_RITUAL_SECRET=super-secret-jwt-key-min-32-chars
APPROVAL_SIGNATURE_SECRET=another-secret-min-32-chars
```

---

## Step 3: Start Creator Studio

### 3.1 Install Dependencies
```bash
npm install
```

### 3.2 Run Development Server
```bash
npm run dev
```

### 3.3 Open in Browser
```
http://localhost:3000
```

### 3.4 Access Creator Dashboard
```
http://localhost:3000/dashboard
```

---

## Step 4: Explore the Four Dashboards

### Overview
```
/dashboard
```
- Real-time metrics
- Recent projects
- Daily quota

### Agent Performance
```
/dashboard/agent-performance
```
- Per-agent success rates
- Cost tracking
- Execution history
- Trend analysis

### BeeHive Rituals
```
/dashboard/rituals
```
- Badge: Agent credentialing
- Metrics: Real-time monitoring
- Echo: Pattern learning
- History: Persistent memory

### Analytics
```
/dashboard/analytics
```
- Performance trends
- Cost analysis
- Model breakdown
- Daily patterns

---

## Step 5: Connect Your First Agent

### 5.1 Create a CrewAI Agent (Python)

```python
# agents/content_agent.py
from crewai import Agent
from dotenv import load_dotenv

load_dotenv()

content_agent = Agent(
    role="Content Creator",
    goal="Generate compelling marketing copy",
    backstory="Expert copywriter with 10+ years experience",
    verbose=True,
)
```

### 5.2 Create MCP Server for Tools

```python
# mcp_servers/content_server.py
from mcp.server import Server

server = Server("content-server")

@server.tool()
async def generate_headlines(product: str, count: int = 5) -> dict:
    """Generate marketing headlines"""
    # Call OpenAI API
    # Log to Echo ritual
    # Track metrics
    return {"headlines": [...]}

# Run with: python -m mcp run mcp_servers/content_server.py --port 8001
```

### 5.3 Call from Dashboard

```typescript
// In dashboard component
const response = await fetch("/api/agents/execute", {
  method: "POST",
  body: JSON.stringify({
    agent_id: "content-gen-v1",
    task: "Generate 5 headlines for eco-friendly backpack",
    model: "gpt-4o"
  })
});

// Returns:
// {
//   execution_id: "exec_abc123",
//   status: "success",
//   output: [...],
//   metrics: { latency_ms: 245, tokens: 1250, cost: 0.045 }
// }
```

---

## Step 6: Test the BeeHive Rituals

### Badge Ritual: Permission Gating
```bash
# Test 1: Authorized execution
curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:3000/api/agents/execute \
     -d '{"agent_id": "content-gen-v1", "task": "test"}'

# Test 2: Unauthorized (should fail)
curl http://localhost:3000/api/agents/execute \
     -d '{"agent_id": "content-gen-v1", "task": "test"}'
# Response: 401 Unauthorized
```

### Metrics Ritual: Real-time Monitoring
```bash
# View dashboard at http://localhost:3000/dashboard/rituals
# See live metrics updating in real-time

# Or query via API:
curl http://localhost:3000/api/metrics?agent_id=content-gen-v1 \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY"
```

### Echo Ritual: Pattern Learning
```bash
# Check learned patterns
curl http://localhost:3000/api/echo?topic=marketing \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY"

# Response:
# {
#   patterns: [
#     { name: "benefit-driven", success_rate: 94%, uses: 234 },
#     { name: "2-line-format", success_rate: 91%, uses: 203 }
#   ]
# }
```

### History Ritual: Persistent Memory
```bash
# Query historical insights
curl http://localhost:3000/api/history?user_id=creator-001 \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY"

# Response:
# {
#   projects: [{ name: "Q4 Campaign", learnings: [...] }],
#   seasonal_patterns: [{ season: "Q4", multiplier: 1.4 }],
#   recommendations: [{ period: "next_quarter", action: "..." }]
# }
```

---

## Step 7: Optional—Deploy to Production

### 7.1 Deploy to Netlify
```bash
npm run build
netlify deploy --prod
```

### 7.2 Set Environment Variables
```bash
# In Netlify Settings → Environment
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
# ... (all from .env)
```

### 7.3 Deploy Agent MCP Servers
```bash
# Option 1: Docker on Fly.io
docker build -t content-server mcp_servers/content_server
fly deploy

# Option 2: Netlify Agent Runners (coming soon)
# See Netlify docs for agent runner deployment
```

---

## Verification Checklist

- [ ] Supabase database created
- [ ] Tables initialized with schema
- [ ] Agents inserted (content-gen-v1, video-prompt-v1, analytics-v1)
- [ ] .env.local configured with all keys
- [ ] `npm install` completed
- [ ] `npm run dev` running on localhost:3000
- [ ] `/dashboard` accessible
- [ ] `/dashboard/agent-performance` shows mock agents
- [ ] `/dashboard/rituals` shows all four rituals
- [ ] Can see real-time metric updates
- [ ] BeeHive ritual flow working end-to-end

---

## Troubleshooting

### Issue: "Supabase connection failed"
**Solution**: Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in .env.local

### Issue: "Agents table not found"
**Solution**: Run DATABASE_SCHEMA.md SQL in Supabase SQL Editor

### Issue: "Dashboard shows no data"
**Solution**: Use mock data first (it's enabled by default). Real data populates as agents execute.

### Issue: "Cannot connect to MCP server"
**Solution**: Start MCP servers separately:
```bash
# Terminal 1
python -m mcp run mcp_servers/content_server.py --port 8001

# Terminal 2
python -m mcp run mcp_servers/video_server.py --port 8002

# Terminal 3
python -m mcp run mcp_servers/analytics_server.py --port 8003
```

---

## Next Steps

1. **Build Real Agent Teams**
   - Use CrewAI framework with actual agent implementations
   - Wire to MCP servers for tool integration
   - Deploy to production

2. **Implement Advanced Features**
   - Custom user authentication
   - Team collaboration
   - Advanced cost tracking
   - Social sharing

3. **Production Optimization**
   - Enable database connection pooling
   - Set up automated backups
   - Configure CDN for dashboard assets
   - Implement rate limiting

---

## Learning Resources

- **Agent-First Philosophy**: [docs/AGENT_FIRST_PHILOSOPHY.md](./AGENT_FIRST_PHILOSOPHY.md)
- **BeeHive Rituals**: [docs/BEEHIVE_RITUALS.md](./BEEHIVE_RITUALS.md)
- **Agent Orchestration**: [docs/AGENT_ORCHESTRATION.md](./AGENT_ORCHESTRATION.md)
- **Database Schema**: [docs/DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **Creator Dashboard**: [docs/CREATOR_DASHBOARD.md](./CREATOR_DASHBOARD.md)

---

## Support

- **Issues**: https://github.com/brandonlacoste9-tech/adgenxai/issues
- **Discussions**: https://github.com/brandonlacoste9-tech/adgenxai/discussions
- **Email**: support@adgenxai.com

---

**Welcome to AdGenXAI — Where Agents Learn, Remember, and Improve.**
