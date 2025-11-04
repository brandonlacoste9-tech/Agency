# Copilot Instructions

## Repo Context
This repo: **GitHub PR Manager**  
Purpose: AI-powered GitHub automation for PR analysis, risk assessment, and workflow management  
Primary runtime: Node 20 / ES6 modules + CommonJS  
Deployment: Docker/PM2, Redis, Prometheus, Grafana

## Architecture & Patterns
- **Entry point:** `src/index.js` (Express server, webhook handler, SSE, metrics, admin endpoints)
- **AI Integration:** `src/ai-service.js` (SmolLM2, fallback logic, review/label/comment generation)
- **Resilience:** Circuit breakers (`src/circuit-breaker.js`), retry logic, backpressure/queue control (`src/backpressure-control.js`)
- **Monitoring:** Prometheus metrics, `/metrics` endpoint, health checks, SSE for dashboard
- **PR/Issue Automation:**  
	- PRs: AI risk/priority analysis, auto-label, review comment, draft promotion  
	- Issues: AI categorization, auto-label
- **Config:** All secrets/tokens via env vars; see `README.md` for required variables and deployment steps

## Project-Specific Conventions
- **Extend, don’t fork:** Add to `src/ai-service.js` for new AI review logic; use `src/index.js` for workflow changes
- **All network calls** must use circuit breakers and retry logic
- **Labels:** Use `high-risk`, `critical-risk`, `ai-analyzed`, etc. as per AI output
- **Draft PRs:** Can be auto-promoted if `PROMOTE_DRAFTS=true`
- **No secrets in code:** Use `process.env` only
- **Testing:** Use `test-ai-integration.ps1` for integration tests; check logs for AI/rule-based fallback
- **Monitoring:** Use `/metrics`, `/health`, `/dashboard` endpoints for status and debugging

## Example Patterns

- **Add new PR analysis logic:**  
	Extend `AIService.analyzePR()` in `src/ai-service.js`  
- **Add new label logic:**  
	Update `addLabelsToePR()` in `src/index.js`
- **Add new metrics:**  
	Register in `src/index.js` with Prometheus client
