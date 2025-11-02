# Copilot Instructions for AdGenXAI - AI Sensory Cortex

## Project Overview
AdGenXAI is a Next.js AI-powered advertising platform with a "Sensory Cortex" architecture. The system generates ads/reels using AI agents, publishes to social platforms via Netlify functions, and provides a polished aurora-themed UI. Think of it as a webhook-driven AI advertising automation platform.

## Architecture ("Sensory Cortex" Pattern)
- **Frontend**: Next.js 14.2+ app with static export (`output: 'export'`) for Netlify hosting
- **Backend**: Netlify Functions act as the "sensory cortex" - serverless webhooks that orchestrate AI agents
- **AI Integration**: External "Bee Agent" API calls for content generation
- **Platform Publishing**: Modular platform adapters in `lib/platforms/` (Instagram, TikTok, YouTube)
- **Deployment**: Fully automated via "BEE-SHIP" batch scripts that commit → push → auto-deploy
- **CI/CD**: GitHub Actions with CodeQL security scanning, auto-labeling, and Copilot code reviews
- **Tech Stack**:
  - Next.js 14.2 with App Router
  - TypeScript (strict mode)
  - Tailwind CSS for styling
  - Framer Motion for animations
  - Vitest + Testing Library for testing
  - Netlify for hosting & serverless functions

## Key Developer Workflows

### Quick Development Start
```bash
npm run dev          # Start Next.js dev server
npm run test:watch   # Run Vitest in watch mode
npm run typecheck    # TypeScript validation
npm run build        # Production build
```

## Copilot quick-reference — AdGenXAI (concise)

Short orientation
- Frontend: Next.js (App Router) + Tailwind + Framer Motion (app/)
- Backend/orchestration: Netlify functions + app/api/* serve as server endpoints and webhooks
- AI: external "Bee Agent" API (BEE_API_URL) used for content generation

Where to look (high-value files/dirs)
- app/ — React pages & components (app/components/*, app/api/*)
- lib/platforms/ — platform adapters (instagram.ts, tiktok.ts) — follow the publishContent signature
- netlify/functions/ and app/api/ — serverless webhook patterns and CORS header usage
- docs/bee-ship/ & scripts/deployment/ — BEE-SHIP deploy conventions

Key commands (dev & CI)
- npm run dev           # Next dev server
- netlify dev           # Run Netlify functions locally (test webhooks)
- npm run build && npm run deploy  # manual build+deploy (project provides ship scripts too)
- npm run typecheck     # TypeScript strict checks
- npm run test / test:watch / test:ci  # Vitest suite

Project conventions you must follow
- TypeScript strict mode and path aliases (see tsconfig.json — use @/ components/imports)
- Use "use client" for components with state, browser APIs or Framer Motion (e.g., TopBar.tsx)
- Netlify function pattern: always include CORS headers + handle OPTIONS. Env var: NEXT_PUBLIC_SENSORY_CORTEX_URL
- Platform adapter contract (example):
  export type PlatformConfig = { accountId: string; accessToken: string };
  export async function publishContent(config: PlatformConfig, content: any): Promise<{ publishedId: string }>

Testing & debugging tips
- Unit tests use Vitest + @testing-library in jsdom. Tests live under app/components/__tests__ and similar folders.
- To test server functions locally, run `netlify dev` and POST to /.netlify/functions/<name>
- Use abortRef pattern (PromptCard.tsx) for cancellable fetches when making agent calls

Environment and integrations
- Look in netlify.toml and docs/ for required Netlify env vars: BEE_API_URL, BEE_API_KEY, SENSORY_CORTEX_URL, SUPABASE_*, INSTAGRAM_ACCOUNT_ID, FB_ACCESS_TOKEN
- Social platform code in lib/platforms/ — Instagram uses Facebook Graph flow; TikTok/YouTube are implemented as adapters/stubs

Editing guidelines for AI agents
- Make minimal, focused PRs. Run `npm run typecheck` and `npm run test` before pushing.
- If changing APIs or platform flows, add/modify a test in vitest and a short note in docs/ or the BEE-SHIP docs.

If anything above is unclear or you want a deeper example (e.g., a walkthrough for adding a new platform adapter), tell me which area and I will expand with step-by-step examples.

Last updated: 2025-11-02