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

### Local Testing with Netlify Functions
```bash
netlify dev          # Run Netlify functions locally (test webhooks)
# POST to /.netlify/functions/<name> for testing
```

## Essential Knowledge for AI Agents

### Architecture Patterns
- **"use client"** directive: Required for components with state, browser APIs, or Framer Motion (see `TopBar.tsx`, `PromptCard.tsx`)
- **Streaming Pattern**: AbortController with `abortRef` for cancellable AI agent calls (see `PromptCard.tsx` lines 15-20)
- **Platform Adapter Contract**: All platform integrations follow same signature:
  ```typescript
  export type PlatformConfig = { accountId: string; accessToken: string };
  export async function publishContent(config: PlatformConfig, content: any): Promise<{ publishedId: string }>
  ```

### Netlify Function Conventions (CRITICAL)
- **Always include CORS headers** in all functions
- **Handle OPTIONS method** for preflight requests
- **Environment variables**: Use `NEXT_PUBLIC_SENSORY_CORTEX_URL` for frontend/function communication
- **Error handling**: Return structured JSON with `{ error: string, details?: string }`
- **Example pattern**: See `netlify/functions/post-to-instagram.ts`

### File Structure Navigation
- `app/` — React pages & components (App Router)
  - `app/components/` — Reusable UI components
  - `app/api/` — Server endpoints (complement Netlify functions)
  - `app/components/__tests__/` — Component tests with accessibility checks
- `lib/platforms/` — Platform adapters (Instagram, TikTok, YouTube)
- `netlify/functions/` — Serverless webhook functions
- `docs/bee-ship/` — BEE-SHIP deployment documentation
- `scripts/deployment/` — Automated deployment scripts (.bat files)

### Testing Patterns
- **Unit tests**: Vitest + @testing-library in jsdom environment
- **Test naming**: `ComponentName.test.tsx` or `ComponentName.feature.test.tsx`
- **Accessibility**: All components have a11y smoke tests (see `a11y.smoke.test.tsx`)
- **Streaming tests**: Mock ReadableStream for testing streaming UI components
- **Coverage**: Run `npm run test:ci` for coverage reports

### Configuration & Environment
- **Static Export**: `next.config.mjs` has `output: 'export'` for Netlify
- **Path Aliases**: Use `@/` imports (see `tsconfig.json` and `vitest.config.ts`)
- **Required env vars**: `BEE_API_URL`, `BEE_API_KEY`, `INSTAGRAM_ACCOUNT_ID`, `FB_ACCESS_TOKEN`, `SUPABASE_*`
- **Netlify redirects**: API routes redirect from `/api/*` to `/.netlify/functions/*`

### BEE-SHIP Deployment System
- **One-click deployment**: Use `.bat` scripts in `scripts/deployment/`
- **Commit → Push → Auto-deploy**: GitHub Actions handle CI/CD pipeline
- **Documentation**: See `docs/bee-ship/` for complete deployment guides
- **Local testing**: Use `netlify dev` before shipping

## Common Development Tasks

### Adding a New Platform
1. Create adapter in `lib/platforms/newplatform.ts` following the contract
2. Add Netlify function in `netlify/functions/post-to-newplatform.ts`
3. Add environment variables to `netlify.toml`
4. Write tests in `__tests__/` directory
5. Update documentation in `docs/`

### Debugging Webhooks
- Use `netlify dev` to test functions locally
- Check browser network tab for CORS issues
- Verify environment variables are set correctly
- Test with `curl` or Postman for function endpoints

### Component Development
- Add `"use client"` for interactive components
- Include accessibility attributes and ARIA labels
- Write corresponding test in `__tests__/` directory
- Use Framer Motion for animations with proper reduced motion support

## TypeScript & Code Quality
- **Strict mode**: All TypeScript errors must be resolved
- **Path imports**: Use `@/components`, `@/lib` aliases
- **No any types**: Use proper typing or unknown/object
- **ESLint compliance**: Run `npm run typecheck` before committing

## Critical Integration Points
- **Instagram**: Uses Facebook Graph API v17.0 (two-step: create → publish)
- **AI Agents**: External BEE API with streaming response handling
- **Supabase**: Database integration for user data and analytics
- **Netlify**: Static hosting with serverless functions for backend logic

Last updated: 2025-11-02