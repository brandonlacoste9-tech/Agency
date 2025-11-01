# Copilot Guardrails (AdGenXAI)

- Keep PRs **< 400 LOC** net change.
- Never commit secrets; use `process.env`.
- ESLint clean + TypeScript strict required.
- Tests & docs must be updated with behavior changes.
- Propose a plan (affected files + diff summary) before broad edits.
- Apply labels and link PRs to **Phase-2** project:
  - `PR-3: Providers` / `PR-1: Supabase` / `PR-5: Auth`
