# Copilot Instructions for AdGenXAI - AI Sensory Cortex

## Project Overview
AdGenXAI is a Next.js AI-powered advertising platform with a "Sensory Cortex" architecture. The system generates ads/reels using AI agents, publishes to social platforms via Netlify functions, and provides a polished aurora-themed UI. Think of it as a webhook-driven AI advertising automation platform.

## Architecture ("Sensory Cortex" Pattern)
- **Frontend**: Next.js app with static export (`output: 'export'`) for Netlify hosting
- **Backend**: Netlify Functions act as the "sensory cortex" - serverless webhooks that orchestrate AI agents
- **AI Integration**: External "Bee Agent" API calls for content generation
- **Platform Publishing**: Modular platform adapters in `lib/platforms/` (Instagram, TikTok, YouTube)
- **Deployment**: Fully automated via "BEE-SHIP" batch scripts that commit → push → auto-deploy

## Key Developer Workflows

### Quick Development Start
```bash
npm run dev          # Start Next.js dev server
npm run test:watch   # Run Vitest in watch mode
npm run typecheck    # TypeScript validation
```

### BEE-SHIP Deployment (Project Convention)
```bash
# One-click deploy - use the batch scripts:
SHIP_BEE_SWARM_NOW.bat    # Complete deployment pipeline
SHIP_IT_NOW_COMPLETE.bat  # Alternative deploy script
```
These scripts auto-create platform modules, commit changes, push to GitHub, and trigger Netlify auto-deploy.

### Testing Webhooks Locally
```bash
netlify dev  # Serves functions at /.netlify/functions/
```
Test webhook endpoint: `POST /.netlify/functions/webhook` with JSON payload.

## Project-Specific Conventions

### Component Architecture
- **Aurora Theme**: All UI uses animated aurora gradients (see `AuroraField.tsx`)
  - Custom aurora colors: `aurora-cyan`, `aurora-violet`, `aurora-gold`
- **Framer Motion**: Heavy use for animations, especially scroll-based transforms
- **Mobile-First**: Components like `MobileCreateDock.tsx` for mobile UX
- **Command Palette**: Cmd+K opens `CommandPalette.tsx` (universal pattern)
- **TypeScript Path Aliases**: Use `@/components/*`, `@/lib/*`, `@/*` for imports

### Netlify Functions Pattern
All functions follow this structure:
```typescript
// Always include CORS headers and OPTIONS handling
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Route to external "Sensory Cortex" URL if configured
const cortexUrl = process.env.NEXT_PUBLIC_SENSORY_CORTEX_URL || process.env.SENSORY_CORTEX_URL;
```

### Platform Module Pattern (`lib/platforms/`)
Each platform (Instagram, TikTok, YouTube) follows this interface:
```typescript
export type PlatformConfig = {
  accountId: string;
  accessToken: string;
};

export async function publishContent(
  config: PlatformConfig,
  content: ContentData
): Promise<{ publishedId: string }>;
```

### Environment Variables (Netlify Dashboard)
```env
BEE_API_URL=https://www.adgenxai.pro/api
BEE_API_KEY=your_bee_agent_api_key
SENSORY_CORTEX_URL=https://separate-cortex-site.netlify.app
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
INSTAGRAM_ACCOUNT_ID=17841xxx
FB_ACCESS_TOKEN=EAABxxx...
```

## Critical Integration Points

### AI Agent Communication
- External "Bee Agent" at `BEE_API_URL` handles content generation
- Functions send structured payloads with `processing_id` for tracking
- Graceful fallback when Bee Agent is unavailable

### Social Platform APIs
- **Instagram**: Uses Facebook Graph API v17.0 (create → publish flow)
- **TikTok/YouTube**: Stub implementations need platform-specific SDKs
- All platform calls are async with error handling

### Supabase Integration
- Asset storage for generated images/videos
- Telemetry data storage for webhook analytics

## Testing Strategy
- **Vitest**: Component testing with jsdom environment
- **@testing-library/react**: Component interaction testing
- **Coverage**: Excludes layout/page files, focuses on components
- **Run**: `npm run test:ci` for coverage reports

## Key Files to Understand First
- `netlify/functions/webhook.ts` - Main AI orchestration endpoint
- `app/components/AuroraField.tsx` - Core visual theme component
- `lib/platforms/instagram.ts` - Platform publishing pattern
- `BEE_SHIP_QUICK_REF.md` - Deployment workflow documentation
- `netlify.toml` - Critical routing config (`/api/*` → functions)

## Common Debugging
- Check Netlify function logs for webhook errors
- Verify environment variables in Netlify dashboard
- Test platform APIs independently before integration
- Use `netlify dev` for local function debugging
- Monitor external Sensory Cortex health via `/health` endpoint

## Project Naming Conventions
- "Legendary" status responses indicate successful operations
- "Sensory Cortex" refers to the distributed AI processing architecture
- "Bee Agent" is the external AI content generation service
- "Aurora" theme applies to all visual components