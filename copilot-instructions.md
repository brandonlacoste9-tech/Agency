# Copilot Code Review — AdGenXAI

## Priorities
1) Security: RLS, auth checks, webhook validation, secrets safety.
2) Correctness: provider adapters, streaming, fallback logic.
3) Quality: ESLint clean, TypeScript strict, mobile-first Aurora styling.

## Repo Context
- Providers: OpenAI primary, GitHub Models fallback via `AI_PROVIDER`.
- DB: Supabase with RLS (use views/RPC; avoid ad-hoc SQL in routes).
- Auth: Supabase Auth JWT; every API path checks user/tenant ownership.
- Netlify Functions for webhooks/orchestration.

## Rules
- PRs < 400 LOC net change.
- No secrets in code; use `process.env.*`.
- Update tests & docs for any behavior change.
- Keep QUICKSTART, PROVIDER_INTEGRATION, DATABASE_SCHEMA in sync.

## When suggesting fixes
- Open **stacked PRs** by scope (Providers / Supabase / Auth).
- Add short rationale + file list + test notes.
- Apply labels: `PR-3: Providers`, `PR-1: Supabase`, `PR-5: Auth`.
- Link each PR to the **Phase-2** project.
