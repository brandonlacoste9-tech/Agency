## Summary
<!-- What does this change and why? Fit with Sensory Cortex architecture? -->

## Checklist (AdGenXAI)
- [ ] ESLint clean & TS strict pass
- [ ] Tests added/updated (incl. integrations)
- [ ] Docs updated (QUICKSTART / PROVIDER_INTEGRATION / DATABASE_SCHEMA)
- [ ] No secrets (env vars only)
- [ ] Aurora theme & mobile responsiveness maintained
- [ ] Works with BEE-SHIP deploy scripts
- [ ] Sensory Cortex patterns followed

## Phase-2 Integration
- [ ] Scoped label (PR-3 | PR-1 | PR-5)
- [ ] Linked to Phase-2 project
- [ ] Provider fallback tested (if relevant)
- [ ] RLS enforced (if DB changes)
- [ ] Webhook pattern followed (if functions)

## Risk & Rollback
- Risk: Low / Medium / High
- Rollback: Revert PR; `AI_PROVIDER` flag / disable route / BEE-SHIP rollback
- External deps: (list)

## Handoff to Agents
@copilot Please run **Code Review** focusing on:
- Security (RLS, auth checks, webhook validation)
- ESLint/CodeQL findings (must be clean)
- Provider patterns (streaming, fallback, error handling)
- Supabase data access (RLS adherence, views/RPC usage)
- Netlify Functions patterns
- Aurora theme & mobile responsiveness

If changes are safe and non-trivial, open **stacked PRs** titled:
`[stack] <PR-3|PR-1|PR-5>: <short description>`

Include: diff summary, links to findings, assumptions (env vars, RLS, rate limits)