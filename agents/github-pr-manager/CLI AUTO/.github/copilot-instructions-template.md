# Copilot Instructions

## Repo Context
This repo: **{{repo_name}}**  
Role in stack: {{one-line description}}  
Primary runtime: Node 20 / TypeScript  
Deployment: {{Netlify | Docker | PM2}}

## Architecture Hints
- **Module system**: {{ES6 modules | CommonJS | Mixed}}
- **Key folders**: {{list main directories}}
- **Integration points**: {{external APIs, services, databases}}
- **{{Framework-specific patterns}}**: {{key architectural decisions}}

## AI Agent Rules
- Extend existing utilities before adding new ones
- All network calls must handle errors and timeouts
- Commit style: `feat:`, `fix:`, `ci:`, `docs:`
- Never generate or commit secrets, tokens, or API keys
- Test changes before PR submission
- {{Repo-specific rules}}

## Example
When {{common task}}, {{preferred approach}} rather than {{anti-pattern}}.