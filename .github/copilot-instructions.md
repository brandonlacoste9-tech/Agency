# Copilot Instructions

## Repo Context
This repo: **AdgenXAI Core**  
Role in stack: Main AdgenXAI platform and agent coordination  
Primary runtime: Node 20 / TypeScript + Next.js  
Deployment: Netlify with agent services

## Architecture Hints
- **Module system**: ES6 modules with Next.js App Router
- **Key folders**: app/ (Next.js), agents/ (AI workers), scripts/ (automation)
- **Integration points**: GitHub APIs, AI services, webhook processing, dashboard
- **Agent orchestration with fallback patterns**: {{key architectural decisions}}

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- - Use existing agent patterns in agents/ directory\n- All external calls need error handling and timeouts\n- Maintain separation between UI (app/) and agents

## Example
When adding a new agent, create agents/new-agent/ with proper structure rather than mixing agent logic with UI components.
