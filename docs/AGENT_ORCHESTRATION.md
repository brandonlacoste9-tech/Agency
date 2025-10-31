# Agent Orchestration: CrewAI + MCP Integration

## Overview

AdGenXAI uses **CrewAI** for multi-agent orchestration and **Model Context Protocol (MCP)** for seamless tool communication. Together, they enable specialized agent teams to collaborate on complex creative workflows.

---

## Part 1: CrewAI Agent Teams

### What is CrewAI?

CrewAI provides a framework for managing multiple AI agents with different roles, responsibilities, and tools. Instead of one agent doing everything, each agent specializes:

```
Chief Executive Agent
├── Content Agent (writes copy)
├── Video Agent (engineers Sora prompts)
├── Analytics Agent (tracks performance)
├── Research Agent (competitive analysis)
└── Publishing Agent (distributes across platforms)
```

### Core Concepts

**Agent**:
```python
from crewai import Agent

content_agent = Agent(
    role="Content Creator",
    goal="Generate engaging marketing copy",
    backstory="Expert copywriter with 10+ years experience",
    tools=[openai_tool, cost_estimator_tool],
    model="gpt-4o",
    max_iterations=3
)
```

**Task**:
```python
from crewai import Task

generate_headlines = Task(
    description="Generate 5 compelling headlines for {product}",
    agent=content_agent,
    expected_output="5 unique headlines, each under 80 characters"
)
```

**Crew** (Team):
```python
from crewai import Crew

marketing_team = Crew(
    agents=[content_agent, video_agent, analytics_agent],
    tasks=[generate_headlines, generate_video_prompt, analyze_performance],
    process=Process.hierarchical,  # Chief agent orchestrates
    manager_agent=chief_agent
)
```

### Agent Architecture in AdGenXAI

```yaml
agents:
  content_generator:
    role: "Content Generator"
    goal: "Create compelling marketing copy"
    tools:
      - openai_api (gpt-4o)
      - cost_estimator
      - pattern_analyzer
    model: "gpt-4o"
    escalation_level: 2

  video_prompter:
    role: "Video Prompt Engineer"
    goal: "Craft perfect Sora prompts"
    tools:
      - sora_api
      - video_style_guide
      - performance_metrics
    model: "gpt-4o"
    escalation_level: 2

  research_agent:
    role: "Research Analyst"
    goal: "Analyze competitors and trends"
    tools:
      - web_search_api
      - competitive_database
      - trend_analyzer
    model: "gpt-4o"
    escalation_level: 1

  analytics_agent:
    role: "Performance Analyst"
    goal: "Track and optimize campaign metrics"
    tools:
      - analytics_api
      - cost_calculator
      - roi_estimator
    model: "gpt-3.5-turbo"  # Cheaper for analysis
    escalation_level: 1

  publishing_agent:
    role: "Content Publisher"
    goal: "Distribute content across platforms"
    tools:
      - social_media_api
      - scheduling_api
      - approval_gate
    model: "gpt-3.5-turbo"
    escalation_level: 3  # Requires approval
```

### Example Workflow: Multi-Agent Content Generation

```python
from crewai import Agent, Task, Crew, Process

# Step 1: Define agents
research_agent = Agent(
    role="Market Researcher",
    goal="Understand target audience and trends",
    tools=[search_tool, analytics_tool],
    model="gpt-4o"
)

content_agent = Agent(
    role="Content Writer",
    goal="Generate compelling copy",
    tools=[openai_tool, template_tool],
    model="gpt-4o"
)

video_agent = Agent(
    role="Video Director",
    goal="Design Sora video prompts",
    tools=[sora_api_tool, style_guide_tool],
    model="gpt-4o"
)

chief_agent = Agent(
    role="Campaign Manager",
    goal="Orchestrate team and make final decisions",
    tools=[approval_gate_tool],
    model="gpt-4o"
)

# Step 2: Define tasks
research_task = Task(
    description="Research target audience for {product}. Identify key pain points and values.",
    agent=research_agent,
    expected_output="1-2 page audience analysis"
)

content_task = Task(
    description="Generate 5 headlines + copy for {product}",
    agent=content_agent,
    expected_output="5 unique headlines with supporting copy"
)

video_task = Task(
    description="Engineer Sora prompt for {product} based on headlines",
    agent=video_agent,
    expected_output="Detailed Sora prompt (max 1000 chars)"
)

approval_task = Task(
    description="Review all outputs and approve for publication",
    agent=chief_agent,
    expected_output="Approval status and feedback"
)

# Step 3: Create crew
team = Crew(
    agents=[research_agent, content_agent, video_agent, chief_agent],
    tasks=[research_task, content_task, video_task, approval_task],
    process=Process.hierarchical,
    manager_agent=chief_agent,
    verbose=True
)

# Step 4: Execute
result = team.kickoff(inputs={"product": "Eco-friendly backpack"})
print(result)
```

**Output:**
```
Campaign Manager: Initiating campaign planning for Eco-friendly backpack

Research Agent: Analyzing target audience...
> Key finding: 35-45 year old professionals, $75K+, eco-conscious
> Values: sustainability, quality, durability
> Pain points: Choice paralysis, greenwashing skepticism

Content Agent: Generating headlines...
> "Carry Change: Eco-Friendly Adventure Gear"
> "Built to Last, Made to Care"
> "Your Journey. Planet Protected."

Video Agent: Engineering Sora prompt...
> "High-quality product showcase video showing sustainable backpack on minimalist white background..."

Campaign Manager: All outputs approved ✓
Status: Ready for publication
```

### CrewAI Best Practices

- ✅ **Hierarchical Process**: Use chief agent for complex workflows
- ✅ **Tool Specificity**: Each agent gets only needed tools
- ✅ **Clear Goals**: Each agent has focused, measurable objective
- ✅ **Iteration Limits**: Set max_iterations (3-5) to control cost
- ✅ **Error Handling**: Catch exceptions and escalate appropriately
- ✅ **Cost Control**: Use cheaper models (gpt-3.5) for simple tasks
- ✅ **Monitoring**: Log all agent actions for audit trail (Badge ritual)
- ✅ **Learning**: Store successful workflows (Echo ritual)

---

## Part 2: Model Context Protocol (MCP)

### What is MCP?

MCP is an open protocol for AI agents to access tools and resources. Instead of embedding tool definitions in agent code, MCP provides a standardized interface:

```
Agent ←→ MCP Client ←→ MCP Server ←→ Tool/Resource
```

### MCP Resource Types

**Tools** (Agent can call):
```json
{
  "type": "tool",
  "name": "generate_headlines",
  "description": "Generate marketing headlines",
  "inputSchema": {
    "type": "object",
    "properties": {
      "product": { "type": "string" },
      "style": { "enum": ["benefit-driven", "emotional", "technical"] },
      "count": { "type": "integer" }
    }
  }
}
```

**Resources** (Static data agents access):
```json
{
  "type": "resource",
  "name": "brand_guidelines",
  "description": "Brand voice, tone, visual guidelines",
  "uri": "brand://guidelines/v2"
}
```

**Prompts** (Reusable prompt templates):
```json
{
  "type": "prompt",
  "name": "content_generation_playbook",
  "description": "System prompt with learned patterns",
  "content": "You are an expert copywriter..."
}
```

### MCP Server Architecture in AdGenXAI

```
┌─────────────────────────────────────────────────────────┐
│              CrewAI Agent (Chief)                        │
│  Content Agent | Video Agent | Analytics Agent          │
├─────────────────────────────────────────────────────────┤
│              MCP Client                                  │
│  (Handles tool requests, resource fetching)             │
├─────────────────────────────────────────────────────────┤
│              MCP Servers (Tool Providers)               │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  Content Server  │  │   Sora Server    │            │
│  ├──────────────────┤  ├──────────────────┤            │
│  │ generate_copy    │  │ generate_video   │            │
│  │ estimate_cost    │  │ check_status     │            │
│  │ get_templates    │  │ list_models      │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ Analytics Server │  │  Settings Server │            │
│  ├──────────────────┤  ├──────────────────┤            │
│  │ query_metrics    │  │ get_rate_limits  │            │
│  │ track_usage      │  │ get_agent_creds  │            │
│  │ estimate_roi     │  │ list_tools       │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### MCP Integration Example

**MCP Server (Content Generation):**
```python
import mcp
from mcp.server import Server, Request
from contextlib import asynccontextmanager

# Create MCP server
server = Server("adgenxai-content-server")

# Define tools
@server.tool()
async def generate_headlines(
    product: str,
    style: str = "benefit-driven",
    count: int = 5
) -> dict:
    """Generate marketing headlines"""
    response = await openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[{
            "role": "system",
            "content": f"You are an expert copywriter. Style: {style}",
            "role": "user",
            "content": f"Generate {count} headlines for {product}"
        }]
    )
    return {
        "headlines": response.choices[0].message.content.split('\n'),
        "tokens_used": response.usage.total_tokens,
        "cost": calculate_cost(response.usage.total_tokens)
    }

@server.tool()
async def estimate_cost(tokens: int, model: str = "gpt-4o") -> dict:
    """Estimate generation cost"""
    rates = {
        "gpt-4o": 0.00002,      # $0.02 per 1K tokens
        "gpt-3.5-turbo": 0.0005 # $0.50 per 1M tokens
    }
    cost = (tokens / 1000000) * rates.get(model, 0)
    return {"cost": cost, "currency": "USD"}

# Define resources
@server.resource()
async def get_brand_guidelines() -> dict:
    """Get brand voice guidelines"""
    return {
        "voice": "expert, direct, benefit-focused",
        "tone": "professional but approachable",
        "values": ["sustainability", "quality", "transparency"]
    }

# Define prompts
@server.prompt()
async def get_playbook(topic: str) -> str:
    """Get learned playbook for topic"""
    playbook = await db.query_echo(topic=topic, success=True)
    return f"""You are an expert in {topic}.

    Learned patterns:
    {playbook['patterns']}

    Previously successful:
    {playbook['examples']}

    Remember to:
    {playbook['best_practices']}
    """

@asynccontextmanager
async def lifespan(server):
    # Startup
    print("Content Server starting...")
    yield
    # Shutdown
    print("Content Server stopping...")

# Run server
server.lifespan = lifespan
mcp.run_server(server, port=8001)
```

**Agent Using MCP:**
```python
from mcp import Client

# Connect to MCP servers
content_client = Client("localhost:8001")  # Content server
sora_client = Client("localhost:8002")      # Sora server
analytics_client = Client("localhost:8003") # Analytics server

# Use in CrewAI agent
content_agent = Agent(
    role="Content Creator",
    goal="Generate marketing copy",
    tools=[
        content_client.tool("generate_headlines"),
        content_client.tool("estimate_cost"),
        analytics_client.tool("query_metrics")
    ],
    resources=[
        content_client.resource("brand_guidelines")
    ],
    prompts=[
        content_client.prompt("get_playbook")
    ]
)

# When agent calls tool:
# Agent: "Generate headlines for eco-friendly backpack"
# → MCP Client forwards to Content Server
# → Server calls generate_headlines()
# → Returns response to agent
# → Agent can use response in reasoning
```

### MCP Server Architecture for AdGenXAI

```yaml
mcp_servers:
  content_server:
    port: 8001
    tools:
      - generate_headlines
      - generate_copy
      - paraphrase
      - estimate_cost
      - validate_brand_alignment
    resources:
      - brand_guidelines
      - templates_library
      - tone_examples
    prompts:
      - playbook_for_topic
      - learned_patterns

  sora_server:
    port: 8002
    tools:
      - generate_video_prompt
      - submit_generation
      - check_status
      - list_models
      - estimate_duration
    resources:
      - video_style_guide
      - aspect_ratio_specs
      - duration_guidelines
    prompts:
      - video_generation_playbook

  analytics_server:
    port: 8003
    tools:
      - query_metrics
      - calculate_roi
      - forecast_costs
      - track_usage
      - compare_models
    resources:
      - usage_quotas
      - rate_limits
      - cost_targets
    prompts:
      - optimization_recommendations

  settings_server:
    port: 8004
    tools:
      - get_agent_credentials
      - validate_provider
      - check_rate_limits
      - list_available_tools
    resources:
      - provider_configs
      - capability_matrix
      - escalation_levels
    prompts:
      - agent_permissions_context
```

---

## Integration: CrewAI + MCP + BeeHive Rituals

### Full Workflow Example

```
User: "Generate Q4 campaign for eco-friendly backpacks"

1. BADGE RITUAL (MCP: settings_server)
   └─ Agent retrieves credentials via MCP
      "What tools can I use?"
      ← Response: ["openai-api", "sora-api", "analytics-query"]

2. HISTORY RITUAL (MCP: content_server playbook)
   └─ Agent retrieves learned context
      "What worked for eco-products?"
      ← Response: Playbook with successful patterns

3. CHIEF AGENT DELEGATION
   └─ Chief: "Research the market"
      → Research Agent calls MCP: search_competitors()
   └─ Chief: "Generate headlines"
      → Content Agent calls MCP: generate_headlines()
        (Using playbook from History ritual)
   └─ Chief: "Create video prompt"
      → Video Agent calls MCP: generate_video_prompt()
   └─ Chief: "Analyze performance"
      → Analytics Agent calls MCP: estimate_roi()

4. METRICS RITUAL (MCP: analytics_server)
   └─ All agents log usage
      └─ Tokens: 2,500 | Cost: $0.065 | Latency: 245ms
      └─ Success rate: 95%
      └─ Check thresholds: All green ✓

5. ECHO RITUAL (MCP: content_server)
   └─ Store successful generation
      "Benefit-driven angle with 2-line format worked"
      → Updates playbook for next time

6. APPROVAL GATE (Escalation Level 2)
   └─ Results await operator review
      "Campaign Ready for Review"
      → Operator approves/rejects via dashboard

7. PUBLISH (Publishing Agent via MCP)
   └─ Once approved, agent calls:
      - social_media_api.schedule()
      - email_api.send()
      - blog_api.publish()
```

### Cost Optimization via Agents

```
Agent: "How can we reduce costs?"

→ Calls MCP: analytics_server.compare_models()
  ← Returns: "gpt-3.5-turbo costs 60% less than gpt-4o"

→ Calls MCP: content_server.test_model_quality()
  ← Returns: "gpt-3.5-turbo achieves 85% quality"

→ Decision: Use gpt-3.5 for routine tasks, gpt-4o for complex

→ Calls MCP: settings_server.update_agent_config()
  └─ Updated config: Use gpt-3.5 for simple tasks

Result: 40% cost reduction, 10% quality decrease (acceptable)
```

---

## Implementation Checklist

- [ ] **CrewAI Setup**
  - [ ] Install: `pip install crewai`
  - [ ] Create agents with specific roles
  - [ ] Define tasks for each agent
  - [ ] Set up hierarchical crew with chief agent
  - [ ] Integrate with OpenAI API
  - [ ] Add cost tracking per agent

- [ ] **MCP Server Setup**
  - [ ] Create MCP server for each domain
  - [ ] Define tools with input/output schemas
  - [ ] Define resources (guidelines, templates)
  - [ ] Define prompts (playbooks, recommendations)
  - [ ] Implement authentication (JWT via Badge ritual)
  - [ ] Add error handling and logging

- [ ] **Integration**
  - [ ] Connect agents to MCP servers
  - [ ] Test tool calling end-to-end
  - [ ] Implement resource caching
  - [ ] Add cost estimation for each tool call
  - [ ] Set up rate limiting per agent

- [ ] **BeeHive Rituals**
  - [ ] Badge: Agents authenticate to MCP servers
  - [ ] Metrics: Track all MCP tool usage
  - [ ] Echo: Store successful MCP patterns
  - [ ] History: Build playbooks from MCP calls

---

## Monitoring & Observability

```yaml
monitoring:
  agent_performance:
    - tokens_used_per_agent
    - cost_per_execution
    - success_rate
    - average_latency
    - error_rate

  mcp_server_health:
    - requests_per_second
    - response_time_p99
    - error_rate_per_tool
    - authentication_failures

  team_efficiency:
    - total_execution_time
    - parallel_vs_sequential_ratio
    - cost_per_outcome
    - user_satisfaction
```

---

## Resources

- **CrewAI Docs**: https://docs.crewai.com
- **MCP Specification**: https://modelcontextprotocol.io
- **n8n Integration**: https://n8n.io
- **Netlify Agent Runners**: https://netlify.com/agent-runners

---

**AdGenXAI: Orchestrated Agent Teams with Seamless Tool Integration**
