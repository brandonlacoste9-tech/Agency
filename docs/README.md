# AdGenXAI Documentation Hub

Welcome to the complete documentation for **AdGenXAI: Agent-First Platform for AI-Powered Content Creation**.

This documentation maps David Ondrej's proven Agent-First methodologies to the BeeHive Codex ritual system, providing a complete implementation guide from philosophy to production.

---

## 📚 Documentation Index

### 📋 Project Foundation

**[PROJECT_REQUIREMENTS.md](../PROJECT_REQUIREMENTS.md)** — *Project goals and requirements*
- Business objectives and success criteria
- Key features for launch (MVP, Phase 2, Phase 3)
- Technical constraints and must-have integrations
- User personas and target audience
- Roadmap summary and risk mitigation
- Essential reading for understanding project scope

### 🎯 Core Philosophy & Strategy

**[AGENT_FIRST_PHILOSOPHY.md](./AGENT_FIRST_PHILOSOPHY.md)** — *Start here for strategic context*
- David Ondrej's three pillars: Agent Armies, Context Engineering, Operator-in-the-Loop
- Why agent-first beats monolithic AI
- Advantages over traditional approaches
- Real-world workflow examples
- Technology stack overview

**[BEEHIVE_RITUALS.md](./BEEHIVE_RITUALS.md)** — *Operational framework*
- **Badge Ritual**: Agent credentialing, permission gating, escalation levels
- **Metrics Ritual**: Real-time monitoring, threshold automation, cost optimization
- **Echo Ritual**: Pattern learning, playbook updates, success extraction
- **History Ritual**: Persistent memory, seasonal patterns, recommendations
- Implementation checklists for each ritual
- Production-ready examples

### 🛠️ Implementation & Integration

**[AGENT_ORCHESTRATION.md](./AGENT_ORCHESTRATION.md)** — *How to build agent teams*
- CrewAI framework setup and examples
- Model Context Protocol (MCP) architecture
- MCP server implementation guide
- Agent team architectures (Chief + Specialists)
- Real code examples in Python
- Integration with BeeHive rituals
- Cost optimization patterns

**[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** — *Supabase PostgreSQL schema*
- Complete table definitions for all four rituals
- Views for common queries
- Row-level security (RLS) policies
- Performance indexes
- Backup and recovery procedures
- Setup instructions
- Migration guides

**[INTEGRATION_QUICKSTART.md](./INTEGRATION_QUICKSTART.md)** — *5-minute setup*
- Step-by-step Supabase configuration
- Environment variable setup
- First agent creation
- Dashboard exploration
- Testing each ritual (with curl examples)
- Production deployment
- Troubleshooting guide

### 📊 User Guides

**[CREATOR_DASHBOARD.md](./CREATOR_DASHBOARD.md)** — *How to use Creator Studio*
- Dashboard navigation
- Overview metrics and quick actions
- Projects gallery and filtering
- Analytics dashboard features
- Prompt template library
- Video generation (Sora) job queue
- Provider settings and configuration
- Best practices and workflows
- Keyboard shortcuts
- Support resources

**[PROVIDER_INTEGRATION.md](./PROVIDER_INTEGRATION.md)** — *AI Provider setup*
- GitHub Models (free tier)
- OpenAI (production)
- Provider comparison
- Failover strategy
- Cost estimation
- Rate limiting
- Testing guide
- Troubleshooting

---

## 🗺️ Navigation by Role

### For Product/Business Leaders
1. Start: [PROJECT_REQUIREMENTS.md](../PROJECT_REQUIREMENTS.md)
2. User Research: [PROJECT_REQUIREMENTS.md - Section 4](../PROJECT_REQUIREMENTS.md#4-user-personas-and-target-audience)
3. Roadmap: [PROJECT_REQUIREMENTS.md - Section 8](../PROJECT_REQUIREMENTS.md#8-roadmap-summary)

### For Creators/Users
1. Start: [CREATOR_DASHBOARD.md](./CREATOR_DASHBOARD.md)
2. Setup: [PROVIDER_INTEGRATION.md](./PROVIDER_INTEGRATION.md)
3. Reference: [INTEGRATION_QUICKSTART.md](./INTEGRATION_QUICKSTART.md)

### For Engineers/Developers
1. Start: [PROJECT_REQUIREMENTS.md](../PROJECT_REQUIREMENTS.md) (understand scope)
2. Philosophy: [AGENT_FIRST_PHILOSOPHY.md](./AGENT_FIRST_PHILOSOPHY.md)
3. Core: [BEEHIVE_RITUALS.md](./BEEHIVE_RITUALS.md)
4. Implementation: [AGENT_ORCHESTRATION.md](./AGENT_ORCHESTRATION.md)
5. Database: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
6. Quickstart: [INTEGRATION_QUICKSTART.md](./INTEGRATION_QUICKSTART.md)

### For DevOps/Infrastructure
1. Start: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
2. Deployment: [INTEGRATION_QUICKSTART.md](./INTEGRATION_QUICKSTART.md) (Step 7)
3. Monitoring: [BEEHIVE_RITUALS.md](./BEEHIVE_RITUALS.md) (Metrics Ritual)

---

## 🚀 Quick Links

### Most Requested
- **What is this project about?** → [PROJECT_REQUIREMENTS.md](../PROJECT_REQUIREMENTS.md)
- **What are the business goals?** → [PROJECT_REQUIREMENTS.md - Section 1](../PROJECT_REQUIREMENTS.md#1-business-objectives)
- **What features are planned?** → [PROJECT_REQUIREMENTS.md - Section 2](../PROJECT_REQUIREMENTS.md#2-key-features-for-launch)
- **Who is this for?** → [PROJECT_REQUIREMENTS.md - Section 4](../PROJECT_REQUIREMENTS.md#4-user-personas-and-target-audience)
- **How do I get started?** → [INTEGRATION_QUICKSTART.md](./INTEGRATION_QUICKSTART.md)
- **What is the Agent-First Philosophy?** → [AGENT_FIRST_PHILOSOPHY.md](./AGENT_FIRST_PHILOSOPHY.md)
- **How do BeeHive Rituals work?** → [BEEHIVE_RITUALS.md](./BEEHIVE_RITUALS.md)
- **How do I create agent teams?** → [AGENT_ORCHESTRATION.md](./AGENT_ORCHESTRATION.md)
- **What's the database schema?** → [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **How do I use the dashboard?** → [CREATOR_DASHBOARD.md](./CREATOR_DASHBOARD.md)

### By Topic
- **Authentication & Permissions** → [BEEHIVE_RITUALS.md#badge-ritual](./BEEHIVE_RITUALS.md#1-badge-ritual-agent-credentialing--permission-gating)
- **Real-time Monitoring** → [BEEHIVE_RITUALS.md#metrics-ritual](./BEEHIVE_RITUALS.md#2-metrics-ritual-continuous-monitoring--optimization)
- **Pattern Learning** → [BEEHIVE_RITUALS.md#echo-ritual](./BEEHIVE_RITUALS.md#3-echo-ritual-audit-trails--learning-from-past)
- **Historical Memory** → [BEEHIVE_RITUALS.md#history-ritual](./BEEHIVE_RITUALS.md#4-history-ritual-persistent-memory-across-sessions)
- **Cost Optimization** → [BEEHIVE_RITUALS.md#cost-analysis](./BEEHIVE_RITUALS.md) (Metrics section)
- **Agent Teams** → [AGENT_ORCHESTRATION.md#crewai-agent-teams](./AGENT_ORCHESTRATION.md#part-1-crewai-agent-teams)
- **Tool Integration** → [AGENT_ORCHESTRATION.md#model-context-protocol](./AGENT_ORCHESTRATION.md#part-2-model-context-protocol-mcp)

---

## 📖 Key Concepts

### Three Pillars of Agent-First
1. **Agent Armies** - Specialized agents, not monolithic AI
   - Domain specialization
   - Fault isolation
   - Horizontal scaling
   - Transparent reasoning

2. **Context Engineering** - Living playbooks, not static prompts
   - Dynamic context windows
   - ACE-style learning
   - Automatic evolution
   - No context collapse

3. **Operator-in-the-Loop** - Human judgment gates, not blind automation
   - Risk-based escalation
   - Complete audit trails
   - Permission control
   - Regulatory compliance

### Four BeeHive Codex Rituals
1. **🎖️ Badge Ritual** - Trust (credentialing, permissions)
2. **📊 Metrics Ritual** - Monitor (real-time KPIs, automation)
3. **🔊 Echo Ritual** - Learn (extract patterns, improve)
4. **📖 History Ritual** - Remember (persistent context, recommendations)

---

## 🎯 Learning Paths

### Path 0: Product Overview (30 minutes)
1. [PROJECT_REQUIREMENTS.md](../PROJECT_REQUIREMENTS.md) - Executive Summary (5 min)
2. [PROJECT_REQUIREMENTS.md - Business Objectives](../PROJECT_REQUIREMENTS.md#1-business-objectives) (10 min)
3. [PROJECT_REQUIREMENTS.md - User Personas](../PROJECT_REQUIREMENTS.md#4-user-personas-and-target-audience) (15 min)

**Outcome**: Understand the product vision, goals, and target users

### Path 1: Creator (1 hour)
1. [CREATOR_DASHBOARD.md](./CREATOR_DASHBOARD.md) (15 min)
2. [PROVIDER_INTEGRATION.md](./PROVIDER_INTEGRATION.md) (15 min)
3. [INTEGRATION_QUICKSTART.md](./INTEGRATION_QUICKSTART.md) Steps 1-4 (30 min)

**Outcome**: Can use Creator Studio to generate and track content

### Path 2: Developer (3 hours)
1. [AGENT_FIRST_PHILOSOPHY.md](./AGENT_FIRST_PHILOSOPHY.md) (30 min)
2. [BEEHIVE_RITUALS.md](./BEEHIVE_RITUALS.md) (60 min)
3. [AGENT_ORCHESTRATION.md](./AGENT_ORCHESTRATION.md) (60 min)
4. [INTEGRATION_QUICKSTART.md](./INTEGRATION_QUICKSTART.md) (30 min)

**Outcome**: Can build and deploy agent teams

### Path 3: Architect (4 hours)
1. All of Path 2 (3 hours)
2. [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) (60 min)
3. [INTEGRATION_QUICKSTART.md](./INTEGRATION_QUICKSTART.md) Step 7 (30 min)

**Outcome**: Can design and deploy production systems

---

## 📊 Dashboard Overview

### Creator Studio at `/dashboard`

#### Pages
- **Overview** (`/dashboard`) - Metrics, recent projects, daily quota
- **Projects** (`/dashboard/projects`) - Gallery of all generations
- **Analytics** (`/dashboard/analytics`) - Performance trends, cost analysis
- **Templates** (`/dashboard/templates`) - Prompt library with search
- **Generations** (`/dashboard/generations`) - Sora video job queue
- **Agent Performance** (`/dashboard/agent-performance`) - Per-agent metrics
- **BeeHive Rituals** (`/dashboard/rituals`) - Ritual visualization
- **Settings** (`/dashboard/settings`) - Provider configuration

#### Key Metrics
- Success rate per agent
- Cost tracking and forecasting
- Latency percentiles (p50, p95, p99)
- Token usage and quotas
- User satisfaction ratings
- Pattern effectiveness

---

## 🔧 Technology Stack

### Frontend
- **Next.js 14** - React framework
- **React** - UI components
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

### Backend
- **Next.js API Routes** - Serverless functions
- **Node.js** - Runtime

### Database
- **Supabase (PostgreSQL)** - Relational data, vectors, RLS

### AI/Agents
- **CrewAI** - Multi-agent orchestration
- **OpenAI API** - GPT-4, GPT-4 Turbo
- **Anthropic Claude** - Long context reasoning
- **Sora API** - Video generation
- **GitHub Models** - Free alternative provider

### Infrastructure
- **Netlify** - Hosting and Agent Runners
- **MCP (Model Context Protocol)** - Tool integration
- **n8n** - Workflow automation (optional)

---

## 🎓 Examples & Recipes

### Common Tasks
- [Generate content with metrics tracking](./AGENT_ORCHESTRATION.md#example-workflow-multi-agent-content-generation)
- [Optimize costs with agent selection](./AGENT_ORCHESTRATION.md#cost-optimization-via-agents)
- [Extract learned patterns](./BEEHIVE_RITUALS.md#echo-query-patterns)
- [Query historical insights](./BEEHIVE_RITUALS.md#history-query-patterns)
- [Set up approval workflows](./BEEHIVE_RITUALS.md#operator-in-the-loop-workflows)
- [Monitor with real-time metrics](./BEEHIVE_RITUALS.md#threshold-based-automation-rules)

### Architecture Patterns
- [Chief + Specialist agents](./AGENT_ORCHESTRATION.md#agent-architecture-in-adgenxai)
- [MCP server setup](./AGENT_ORCHESTRATION.md#mcp-server-architecture-for-adgenxai)
- [Cost optimization flow](./AGENT_ORCHESTRATION.md#cost-optimization-via-agents)
- [Escalation workflow](./BEEHIVE_RITUALS.md#operator-in-the-loop-workflows)

---

## 🆘 Support & Troubleshooting

### Common Issues
- **Database connection failed** → [INTEGRATION_QUICKSTART.md Troubleshooting](./INTEGRATION_QUICKSTART.md#troubleshooting)
- **Agent not responding** → [AGENT_ORCHESTRATION.md Error Handling](./AGENT_ORCHESTRATION.md)
- **Metrics not updating** → [BEEHIVE_RITUALS.md Metrics Ritual](./BEEHIVE_RITUALS.md#2-metrics-ritual-continuous-monitoring--optimization)
- **Pattern learning slow** → [BEEHIVE_RITUALS.md Echo Ritual](./BEEHIVE_RITUALS.md#3-echo-ritual-audit-trails--learning-from-past)

### Get Help
- **GitHub Issues**: https://github.com/brandonlacoste9-tech/adgenxai/issues
- **Discussions**: https://github.com/brandonlacoste9-tech/adgenxai/discussions
- **Email**: support@adgenxai.com

---

## 📝 Document Status

| Document | Status | Last Updated | Pages |
|----------|--------|--------------|-------|
| [PROJECT_REQUIREMENTS.md](../PROJECT_REQUIREMENTS.md) | ✅ Complete | 2025-11-02 | 35 |
| [AGENT_FIRST_PHILOSOPHY.md](./AGENT_FIRST_PHILOSOPHY.md) | ✅ Complete | 2025-01-31 | 25 |
| [BEEHIVE_RITUALS.md](./BEEHIVE_RITUALS.md) | ✅ Complete | 2025-01-31 | 28 |
| [AGENT_ORCHESTRATION.md](./AGENT_ORCHESTRATION.md) | ✅ Complete | 2025-01-31 | 22 |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | ✅ Complete | 2025-01-31 | 18 |
| [CREATOR_DASHBOARD.md](./CREATOR_DASHBOARD.md) | ✅ Complete | 2025-01-31 | 20 |
| [PROVIDER_INTEGRATION.md](./PROVIDER_INTEGRATION.md) | ✅ Complete | 2025-01-31 | 15 |
| [INTEGRATION_QUICKSTART.md](./INTEGRATION_QUICKSTART.md) | ✅ Complete | 2025-01-31 | 18 |

**Total Documentation**: 8 comprehensive guides, 181 pages, 65,000+ words

---

## 🚀 Getting Started Right Now

### 60-Second Start
```bash
# 1. Clone and install
git clone https://github.com/brandonlacoste9-tech/adgenxai
cd adgenxai
npm install

# 2. Create .env.local (copy from .env.example)
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Start development server
npm run dev

# 4. Open http://localhost:3000/dashboard
```

### What You'll See
- Real-time mock data for agents and metrics
- Full Creator Studio dashboard
- Agent Performance tracking
- BeeHive Ritual visualization
- Ready for real database connection

---

## 🎯 Next Steps

1. **Read** [AGENT_FIRST_PHILOSOPHY.md](./AGENT_FIRST_PHILOSOPHY.md) (15 min)
2. **Explore** http://localhost:3000/dashboard (10 min)
3. **Follow** [INTEGRATION_QUICKSTART.md](./INTEGRATION_QUICKSTART.md) (30 min)
4. **Build** your first agent team using [AGENT_ORCHESTRATION.md](./AGENT_ORCHESTRATION.md)
5. **Deploy** to production using Step 7 of [INTEGRATION_QUICKSTART.md](./INTEGRATION_QUICKSTART.md)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

This platform is inspired by:
- **David Ondrej's Vectal.ai** - Agent-first methodologies and inspiration
- **Anthropic's Claude** - Excellent long-context reasoning
- **OpenAI's Models** - Foundation for agent capabilities
- **The open-source community** - CrewAI, n8n, and countless others

---

**Last Updated**: January 31, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅

---

**Welcome to AdGenXAI: Where Agents Learn, Remember, and Improve.**

Questions? Start with [INTEGRATION_QUICKSTART.md](./INTEGRATION_QUICKSTART.md) or open an issue on GitHub.
