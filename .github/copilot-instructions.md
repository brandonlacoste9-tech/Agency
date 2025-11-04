# Copilot Instructions

## Repo Context

This repo: **AdGenXAI**  
Role in stack: AI-powered advertising automation platform with GitHub PR management  
Primary runtime: Next.js 14 / TypeScript  
Deployment: Netlify with serverless functions

## Architecture Hints

- **Module system**: ES6 modules with Next.js App Router
- **Key folders**: app/ (Next.js routes), lib/ (utilities), agents/ (automation), components/ (UI)
- **Integration points**: GitHub API, AI providers (OpenAI/GitHub Models), Netlify Blobs cache, BeeHive agent orchestration
- **Provider selector pattern**: Intelligent AI routing based on cost, quality, latency
- **Circuit breaker pattern**: Automatic failover when providers fail

## AI Agent Rules

- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- Use provider selector for AI calls (app/lib/providers/provider-selector.ts)
- Cache-first strategy with Netlify Blobs for cost reduction
- All GitHub operations should use the resilient PR manager (agents/github-pr-manager/)

## Critical Patterns

### Provider Selection

```javascript
// Use intelligent provider selection
import { selectProvider } from "@/lib/providers/provider-selector";
const provider = await selectProvider({ mode: "preview", quality: "balanced" });
```

### Cache Integration

```javascript
// Leverage cache for cost reduction
import {
  getCachedResponse,
  setCachedResponse,
} from "@/lib/cache/cache-adapter";
const cached = await getCachedResponse(hash);
if (!cached) {
  const result = await aiProvider.generate(prompt);
  await setCachedResponse(hash, result, ttl);
}
```

### GitHub Automation

```javascript
// Use resilient GitHub PR manager
import { GitHubPRManager } from "@/agents/github-pr-manager";
const prManager = new GitHubPRManager();
await prManager.processWithCircuitBreaker(webhook);
```

## BeeHive Integration

- **Badge Ritual**: Authentication and authorization
- **Metrics Ritual**: Performance monitoring and analytics
- **Echo Ritual**: Learning from interactions
- **History Ritual**: Memory and context preservation

## Project-Specific Conventions

- **Aurora theme**: Consistent styling with Tailwind CSS and Framer Motion
- **Cost-aware development**: Preview mode uses cheap/fast providers, production uses quality providers
- **Sensory cortex pattern**: Webhook-driven AI orchestration
- **Roadmap governance**: Progress tracked in docs/milestones.json with automated burndown

## Example Integrations

### New AI Feature

When adding new AI functionality:

1. Use provider selector for routing
2. Implement cache-first strategy
3. Add BeeHive ritual integration
4. Include circuit breaker for resilience
5. Update roadmap milestone progress

### GitHub Automation

When extending PR automation:

1. Add to agents/github-pr-manager/src/
2. Use circuit breaker patterns
3. Implement backpressure control
4. Add comprehensive metrics
5. Test with webhook suite

## Avoid

- Direct AI provider calls (use provider selector)
- Uncached expensive operations
- GitHub API calls without circuit breakers
- Hardcoded provider configurations
- Breaking the Aurora design system
