# Cross-Repo Copilot Instructions Deployment Kit

This package contains everything needed to deploy surgical Copilot instructions across the AdgenXAI stack.

## Quick Deploy

1. Copy this entire folder to the target repo root
2. Run: `.\deploy-copilot-instructions.ps1`
3. Commit with: `git commit -m "ci: add copilot instructions for AI guidance"`

## Files Included

- `copilot-instructions-template.md` - Base template with placeholders
- `deploy-copilot-instructions.ps1` - Automated deployment script
- Pre-configured contexts for all 6 repos in the stack

## Manual Deployment (Alternative)

If you prefer manual deployment, copy the appropriate content below for each repo:

### Beehive
```md
# Copilot Instructions

## Repo Context
This repo: **Beehive**  
Role in stack: Central orchestration hub for AI agent coordination  
Primary runtime: Node 20 / TypeScript  
Deployment: Docker with Kubernetes

## Architecture Hints
- **Module system**: ES6 modules with TypeScript
- **Key folders**: src/ (core services), agents/ (workers), k8s/ (deployment)
- **Integration points**: Agent APIs, message queues, service discovery
- **Service mesh communication**: Required for all inter-service calls

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- New services go in src/services/ with full TypeScript
- Agent communication uses message bus (not direct HTTP)
- All services must register with discovery service

## Example
When adding a new service, extend src/services/ with proper interfaces rather than creating standalone microservices without discovery.
```

### AdgenAI Core
```md
# Copilot Instructions

## Repo Context
This repo: **AdgenAI Core**  
Role in stack: Core AI processing engine for content generation and analysis  
Primary runtime: Python 3.11 / FastAPI  
Deployment: Docker with GPU support

## Architecture Hints
- **Module system**: Python modules with async/await patterns
- **Key folders**: src/ (core AI), models/ (ML models), api/ (FastAPI routes)
- **Integration points**: OpenAI API, local models, vector databases, caching layer
- **Async processing with task queues**: Required for all AI operations

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- Use dependency injection for model loading
- All AI calls must have timeout and retry logic
- Model responses must be validated before returning

## Example
When adding a new AI model, extend src/models/ with proper interface rather than hardcoding model calls in route handlers.
```

### Adgenai.ca Website
```md
# Copilot Instructions

## Repo Context
This repo: **Adgenai.ca Website**  
Role in stack: Public-facing marketing website and user portal  
Primary runtime: Next.js 14 / TypeScript  
Deployment: Netlify with edge functions

## Architecture Hints
- **Module system**: ES6 modules with Next.js App Router
- **Key folders**: app/ (routes), components/ (UI), lib/ (utilities)
- **Integration points**: AdgenAI API, authentication, payment processing, analytics
- **Server components with client interactivity boundaries**: Use server-first approach

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- Use server components by default, client only when needed
- API routes in app/api/ with proper error handling
- All external API calls must use the centralized client

## Example
When adding a new page, create app/[route]/page.tsx with proper metadata rather than mixing server and client logic in components.
```

### AdgenXAI 2.0
```md
# Copilot Instructions

## Repo Context
This repo: **AdgenXAI 2.0**  
Role in stack: Next-generation AI platform with enhanced capabilities  
Primary runtime: Node 20 / TypeScript  
Deployment: Docker with microservices

## Architecture Hints
- **Module system**: ES6 modules with strict TypeScript
- **Key folders**: packages/ (monorepo), services/ (microservices), shared/ (common)
- **Integration points**: GraphQL federation, event sourcing, distributed caching
- **Microservices with event-driven architecture**: Required for all state changes

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- Follow monorepo structure with proper package boundaries
- Use GraphQL for inter-service communication
- All state changes must emit events

## Example
When adding a new microservice, create packages/service-name with shared types rather than direct database access from other services.
```

### NV Dashboard
```md
# Copilot Instructions

## Repo Context
This repo: **NV Dashboard**  
Role in stack: Administrative dashboard for system monitoring and control  
Primary runtime: React 18 / TypeScript  
Deployment: Netlify with backend APIs

## Architecture Hints
- **Module system**: ES6 modules with Vite bundling
- **Key folders**: src/ (React app), components/ (UI), hooks/ (logic), api/ (backend calls)
- **Integration points**: Multiple backend APIs, real-time websockets, authentication
- **React Query for state management and caching**: Required for all server state

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- Use React Query for all server state
- Custom hooks for business logic
- Components should be purely presentational

## Example
When adding a new dashboard widget, create components/widgets/ with proper data hooks rather than fetching data directly in components.
```

## Deployment Order

Follow the specified rollout sequence:
1. ✅ **GitHub PR Manager** (completed)
2. **Beehive** 
3. **AdgenAI Core**
4. **Adgenai.ca Website**
5. **AdgenXAI 2.0**
6. **NV Dashboard**

This ensures dependencies and integration points are properly established.