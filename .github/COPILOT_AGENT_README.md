# Copilot coding agent — repository onboarding (adgenxai)

This file documents expectations for an automated coding agent (Copilot coding agent) and for humans reviewing agent-created changes.

Repository at-a-glance
- Framework: Next.js (app router)
- Language: TypeScript
- Styling: Tailwind CSS
- Test runner: Vitest

Key npm scripts (defined in package.json):
- npm run dev       # start development server
- npm run build     # production build
- npm run typecheck # tsc type-check
- npm run test      # run tests (vitest)

Agent behavior guidelines
- Make minimal, local changes. Prefer editing files under `app/` and `lib/`.
- Run type-check and build before opening a PR or producing changes related to functionality.
- Add or update tests for behavioral changes (Vitest). Keep tests small and deterministic.
- Do not commit secrets, credentials, or environment variables.

Quality gates for agent-created PRs
1. Type check: `npm run typecheck` — must pass
2. Build: `npm run build` — must succeed
3. Unit tests: run relevant Vitest tests (fast subset) — prefer green

Reviewer checklist
- Confirm the change is minimal and scoped.
- Confirm typecheck and build passed (locally or CI).
- If new behavior added, ensure tests were added or updated.

How to run locally (quick)
1. Install deps: `npm ci`
2. Typecheck: `npm run typecheck`
3. Run a quick test: `npm run test -- -t "TopBar|ShareButton"` (use test name filters as needed)

Contact/owners
- Primary: @brandonlacoste9-tech
