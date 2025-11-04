# Copilot Instructions

## Repo Context
This repo: **GitHub PR Manager**  
Role in stack: AI-powered GitHub automation for PR analysis and workflow management  
Primary runtime: Node 20 / ES6 modules + CommonJS agents  
Deployment: PM2 cluster / Docker with monitoring

## Architecture Hints
- **Module system**: Mixed: src/*.js uses ES6 imports, root *.js uses CommonJS
- **Key folders**: src/ (main service), agents/ (specialized workers), monitoring/ (ops)
- **Integration points**: GitHub webhooks → AI service (SmolLM2) → agent delegation → GitHub updates
- **Circuit breakers required**: All external calls (GitHub API, AI service) must use resilience patterns

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- Extend existing agents before creating new ones
- All network calls must include circuit breakers, retries, and fallback logic
- Test both AI-enabled and fallback modes before PR submission

## Example
When adding PR comment features, extend src/ai-service.js → analyzePR() method rather than creating a separate comment handler.
