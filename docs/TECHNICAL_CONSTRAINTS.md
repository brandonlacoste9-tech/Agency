# Technical Constraints and Integrations

## Overview

This document specifies the technical constraints, required frameworks, and third-party integrations that must be accommodated in the AdGenXAI project. These constraints ensure compatibility, security, and optimal performance of the AI-powered advertising platform.

---

## 1. Framework and Runtime Requirements

### 1.1 Core Framework Stack

| Component | Version | Constraint Type | Notes |
|-----------|---------|----------------|-------|
| **Node.js** | 20.x | Required | Specified in `netlify.toml` build environment |
| **npm** | 10.x | Required | Package manager version locked |
| **Next.js** | ^14.2.0 | Required | App Router architecture mandatory |
| **React** | ^18.3.0 | Required | Server Components + Client Components pattern |
| **TypeScript** | ^5.5.0 | Required | Strict mode enabled (`strict: true`) |

### 1.2 Next.js Configuration Constraints

```javascript
// next.config.mjs - MANDATORY settings
{
  output: 'export',           // Static export for Netlify hosting
  images: {
    unoptimized: true        // Required for static export
  },
  trailingSlash: true        // Netlify routing compatibility
}
```

**Constraints:**
- ✅ **MUST** use static export (`output: 'export'`)
- ✅ **MUST** disable image optimization for static builds
- ✅ **MUST** enable trailing slashes for Netlify routing
- ❌ **CANNOT** use Next.js server-side features (getServerSideProps, middleware, etc.) in pages
- ❌ **CANNOT** use Next.js Image Optimization API
- ⚠️ **MAY** use server-side logic in Netlify Functions only

### 1.3 TypeScript Configuration Constraints

```json
{
  "compilerOptions": {
    "strict": true,           // Mandatory - no exceptions
    "target": "ES2022",       // Modern JavaScript required
    "module": "esnext",       // ESM modules required
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["./app/components/*"],
      "@/lib/*": ["./lib/*"],
      "@/*": ["./*"]
    }
  }
}
```

**Constraints:**
- ✅ **MUST** enable strict mode
- ✅ **MUST** use path aliases (`@/components`, `@/lib`, `@/`)
- ✅ **MUST** target ES2022 or higher
- ❌ **CANNOT** disable strict null checks
- ❌ **CANNOT** use CommonJS modules

---

## 2. Deployment Platform: Netlify

### 2.1 Netlify Configuration Constraints

**Build Settings:**
```toml
[build]
  command = "npm run build"
  publish = "out"              # Next.js static export output directory

[build.environment]
  NODE_VERSION = "20"
  NPM_VERSION = "10"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"     # Fast bundling required
```

**Constraints:**
- ✅ **MUST** output to `out/` directory
- ✅ **MUST** use esbuild for function bundling
- ✅ **MUST** place serverless functions in `netlify/functions/`
- ✅ **MUST** include CORS headers in all API responses
- ❌ **CANNOT** exceed 50MB function bundle size
- ❌ **CANNOT** exceed 10-second function execution time (free tier)
- ⚠️ **MAY** use Netlify Blobs for file storage (recommended)

### 2.2 Netlify Functions Pattern

**Required Function Structure:**
```typescript
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  // MANDATORY: Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  }

  // Function logic here
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({ data: 'response' })
  };
};
```

**Constraints:**
- ✅ **MUST** handle OPTIONS requests for CORS
- ✅ **MUST** include CORS headers in responses
- ✅ **MUST** use `@netlify/functions` types
- ✅ **MUST** return JSON responses with proper Content-Type
- ❌ **CANNOT** use streaming responses in functions
- ⚠️ **MAY** use environment variables for configuration

---

## 3. AI Provider Integrations

### 3.1 Primary AI Providers

#### A. Bee Agent API (External Service)
**Purpose:** Content generation orchestration

**Environment Variables:**
```bash
BEE_API_URL=https://www.adgenxai.pro/api
BEE_API_KEY=<your-bee-key>
```

**Constraints:**
- ✅ **MUST** authenticate with API key
- ✅ **MUST** handle rate limits gracefully
- ✅ **MUST** implement retry logic with exponential backoff
- ⚠️ **MAY** implement fallback to other providers

#### B. OpenAI API
**Purpose:** GPT-4o content generation

**Environment Variables:**
```bash
OPENAI_API_KEY=sk-proj-...
```

**Models Supported:**
- `gpt-4o` (recommended)
- `gpt-4-turbo`
- `gpt-3.5-turbo` (cost optimization)

**Constraints:**
- ✅ **MUST** implement token usage tracking
- ✅ **MUST** set `max_tokens` to prevent runaway costs
- ✅ **MUST** implement cost monitoring
- ✅ **MUST** support streaming responses via SSE
- ❌ **CANNOT** exceed rate limits (tier-dependent)
- ⚠️ **MAY** implement model fallback (gpt-4o → gpt-3.5-turbo)

#### C. GitHub Models (Development)
**Purpose:** Free SSE streaming for development

**Environment Variables:**
```bash
GITHUB_TOKEN=ghp_...
```

**Constraints:**
- ✅ **MUST** use for development/testing only
- ✅ **MUST** implement production fallback
- ❌ **CANNOT** use for production workloads
- ⚠️ **MAY** use for demos

### 3.2 Video Generation: Sora API
**Purpose:** AI video generation (via OpenAI)

**Environment Variables:**
```bash
SORA_API_KEY=<your-sora-key>
SORA_API_URL=https://api.openai.com/v1/videos
```

**Constraints:**
- ✅ **MUST** validate video parameters (aspect ratio, duration)
- ✅ **MUST** implement job polling for async generation
- ✅ **MUST** handle long-running operations (>60s)
- ❌ **CANNOT** exceed 1080p resolution
- ❌ **CANNOT** exceed 60-second video duration
- ⚠️ **MAY** implement queue system for batch jobs

### 3.3 Agent Orchestration: CrewAI + MCP

**Purpose:** Multi-agent collaboration

**Dependencies:**
```bash
# Python dependencies (for agent runners - optional advanced feature)
# Note: AdGenXAI core is TypeScript/Node.js. Python agents are optional
# for advanced multi-agent orchestration if using CrewAI framework.
pip install crewai>=0.11.0 mcp-client>=1.0.0 openai>=1.0.0

# Alternative: Use Netlify Agent Runners (JavaScript-based)
# See: docs/AGENT_ORCHESTRATION.md for JS implementation
```

**Constraints:**
- ✅ **MUST** implement Badge ritual (agent authentication)
- ✅ **MUST** implement Metrics ritual (usage tracking)
- ✅ **MUST** implement Echo ritual (learning patterns)
- ✅ **MUST** implement History ritual (persistent context)
- ✅ **MUST** use hierarchical process with chief agent
- ✅ **MUST** set max_iterations (3-5) to control costs
- ⚠️ **MAY** use MCP servers for tool abstraction

---

## 4. Database: Supabase PostgreSQL

### 4.1 Connection Requirements

**Environment Variables:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-key>
```

**Constraints:**
- ✅ **MUST** use service role key for server-side operations
- ✅ **MUST** use anon key for client-side operations
- ✅ **MUST** enable Row Level Security (RLS) on all tables
- ✅ **MUST** implement connection pooling
- ❌ **CANNOT** expose service role key to client
- ❌ **CANNOT** disable RLS in production

### 4.2 Schema Constraints

**Required Tables:**
- `agents` - Agent registry
- `metrics_events` - Performance tracking
- `echo_entries` - Learning patterns
- `history_timeline` - Context persistence
- `executions` - Job tracking
- `approvals` - Human-in-the-loop workflow

**Constraints:**
- ✅ **MUST** follow BeeHive Codex schema (see `DATABASE_SCHEMA.md`)
- ✅ **MUST** implement audit trails
- ✅ **MUST** create indexes for performance
- ✅ **MUST** implement data retention policies
- ⚠️ **MAY** use Supabase Realtime for live updates

### 4.3 Performance Constraints

- **Max connections:** 25 (free tier) / 500 (pro tier)
- **Query timeout:** 8 seconds (recommended max)
- **Payload size:** 10MB (Supabase limit)
- **Storage:** 500MB (free tier) / Unlimited (pro tier)

---

## 5. Platform API Integrations

### 5.1 Instagram Graph API

**Purpose:** Post images and reels to Instagram

**Environment Variables:**
```bash
INSTAGRAM_ACCOUNT_ID=<your-ig-account-id>
FB_ACCESS_TOKEN=<facebook-access-token>
```

**API Version:** v17.0 (minimum)

**Endpoints Used:**
- `POST /{account-id}/media` - Create media container
- `POST /{account-id}/media_publish` - Publish container

**Constraints:**
- ✅ **MUST** use public image URLs (HTTPS)
- ✅ **MUST** validate image specs (1080x1080 min)
- ✅ **MUST** handle 2-step publish flow (create → publish)
- ✅ **MUST** refresh access tokens (60-day expiry)
- ❌ **CANNOT** publish videos >60 seconds
- ❌ **CANNOT** exceed 25 posts/day (default limit)
- ⚠️ **MAY** implement retry for rate limits (429 errors)

**Rate Limits:**
- 200 calls/hour per user (default)
- 25 posts/day per account

### 5.2 YouTube Data API v3

**Purpose:** Upload videos to YouTube

**Environment Variables:**
```bash
YOUTUBE_API_KEY=<your-api-key>
YOUTUBE_CLIENT_ID=<oauth-client-id>
YOUTUBE_CLIENT_SECRET=<oauth-secret>
```

**Dependencies:**
```json
{
  "googleapis": "^131.0.0"  // Required
}
```

**Endpoints Used:**
- `POST /upload/youtube/v3/videos` - Upload video

**Constraints:**
- ✅ **MUST** use OAuth 2.0 for authentication
- ✅ **MUST** validate video format (MP4, MOV)
- ✅ **MUST** implement resumable upload for large files
- ✅ **MUST** handle quota exceeded errors (403)
- ❌ **CANNOT** exceed 100MB video size (API limit)
- ❌ **CANNOT** exceed 10,000 quota units/day (default)
- ⚠️ **MAY** request quota increase from Google

**Quota Costs:**
- Upload video: 1,600 units
- Insert video: 50 units
- Daily quota: 10,000 units (default)

### 5.3 TikTok Content Posting API

**Purpose:** Post videos to TikTok

**Environment Variables:**
```bash
TIKTOK_CLIENT_KEY=<your-client-key>
TIKTOK_CLIENT_SECRET=<your-client-secret>
TIKTOK_ACCESS_TOKEN=<user-access-token>
```

**API Version:** v2 (latest)

**Constraints:**
- ✅ **MUST** obtain user consent via OAuth 2.0
- ✅ **MUST** validate video specs (9:16 aspect ratio)
- ✅ **MUST** handle async upload flow
- ⚠️ **NOTE:** Currently marked as stub/not implemented
- ❌ **CANNOT** exceed 5 videos/day (default limit)
- ❌ **CANNOT** upload videos >180 seconds

**Status:** ⚠️ Implementation pending - see `lib/platforms/tiktok.ts`

---

## 6. Security Constraints

### 6.1 Authentication & Authorization

**JWT Implementation:**
```bash
JWT_SECRET=<your-256-bit-secret>
JWT_EXPIRY=24h  # Default token lifetime
```

**Constraints:**
- ✅ **MUST** use HS256 or RS256 for signing
- ✅ **MUST** validate JWT on all protected endpoints
- ✅ **MUST** implement token refresh flow
- ✅ **MUST** store secrets in environment variables
- ❌ **CANNOT** commit secrets to source control
- ❌ **CANNOT** use weak secrets (<256 bits)

### 6.2 GitHub Webhooks

**Purpose:** Receive notifications from GitHub

**Environment Variables:**
```bash
GITHUB_WEBHOOK_SECRET=<your-webhook-secret>
GITHUB_PAT=<personal-access-token>
```

**Constraints:**
- ✅ **MUST** validate webhook signatures (HMAC-SHA256)
- ✅ **MUST** verify `X-Hub-Signature-256` header
- ✅ **MUST** process webhooks within 10 seconds
- ✅ **MUST** return 200 OK immediately (queue processing)
- ❌ **CANNOT** perform long operations synchronously
- ⚠️ **MAY** use Netlify Background Functions

### 6.3 CodeQL Security Scanning

**Workflow:** `.github/workflows/codeql.yml`

**Languages Scanned:**
- JavaScript/TypeScript
- Python (for agent runners)

**Constraints:**
- ✅ **MUST** run on every push to main
- ✅ **MUST** run on all pull requests
- ✅ **MUST** address critical/high severity alerts
- ✅ **MUST** use latest CodeQL version
- ⚠️ **MAY** suppress false positives with justification

### 6.4 Dependency Security

**Tools:**
- `npm audit` - Automated vulnerability scanning
- Dependabot - Automated dependency updates

**Constraints:**
- ✅ **MUST** audit dependencies before npm install
- ✅ **MUST** address moderate+ severity vulnerabilities
- ✅ **MUST** keep dependencies up-to-date (monthly)
- ❌ **CANNOT** use packages with known critical vulnerabilities
- ⚠️ **MAY** defer low-severity fixes to quarterly updates

---

## 7. CI/CD Pipeline Constraints

### 7.1 GitHub Actions Workflows

**Required Workflows:**
1. `ci.yml` - Continuous integration (test + lint)
2. `codeql.yml` - Security scanning
3. `test.yml` - Unit tests
4. `phase2.yml` - Integration tests

**Constraints:**
- ✅ **MUST** pass all checks before merge
- ✅ **MUST** run tests on Node 20.x
- ✅ **MUST** generate test coverage reports
- ✅ **MUST** validate TypeScript compilation
- ❌ **CANNOT** merge with failing tests
- ❌ **CANNOT** merge with TypeScript errors

### 7.2 BEE-SHIP Deployment Scripts

**Automated Deployment:**
```bash
# Windows
phase2-complete-setup.bat

# Unix/Linux
phase2-complete-setup.sh
```

**Deployment Flow:**
1. Commit changes
2. Push to GitHub
3. Trigger Netlify build
4. Deploy to production

**Constraints:**
- ✅ **MUST** use provided deployment scripts
- ✅ **MUST** verify build success before deployment
- ✅ **MUST** run tests locally before pushing
- ⚠️ **MAY** use manual Netlify CLI deployment for debugging

---

## 8. Testing Requirements

### 8.1 Unit Testing: Vitest

**Configuration:** `vitest.config.ts`

**Framework:**
```json
{
  "vitest": "^2.1.4",
  "@testing-library/react": "^16.0.0",
  "@testing-library/jest-dom": "^6.6.3"
}
```

**Constraints:**
- ✅ **MUST** achieve >80% code coverage
- ✅ **MUST** test all React components
- ✅ **MUST** test all API routes
- ✅ **MUST** test platform adapters
- ✅ **MUST** use jsdom environment
- ❌ **CANNOT** skip tests with `.skip` in production
- ⚠️ **MAY** use snapshot testing for UI components

**Coverage Targets:**
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

### 8.2 End-to-End Testing: Playwright

**Configuration:** `playwright.config.ts`

**Framework:**
```json
{
  "@playwright/test": "latest"
}
```

**Test Scenarios:**
- ✅ Streaming chat functionality
- ✅ Model selection persistence
- ✅ Abort mid-stream
- ✅ Error handling
- ✅ Keyboard navigation (a11y)

**Constraints:**
- ✅ **MUST** test on Chrome + Firefox
- ✅ **MUST** verify accessibility (ARIA)
- ✅ **MUST** test responsive layouts
- ⚠️ **MAY** test on Safari/WebKit

### 8.3 Test Execution Constraints

**Commands:**
```bash
npm test              # Unit tests (Vitest)
npm run test:watch    # Watch mode
npm run test:ci       # CI mode with coverage
npx playwright test   # E2E tests
```

**Constraints:**
- ✅ **MUST** run in CI environment (<5 minutes)
- ✅ **MUST** generate coverage reports
- ✅ **MUST** fail on console errors
- ❌ **CANNOT** mock external APIs in E2E tests
- ⚠️ **MAY** use VCR pattern for API recording

---

## 9. Performance Constraints

### 9.1 Build Performance

**Targets:**
- Next.js build: <3 minutes
- TypeScript compilation: <1 minute
- Test suite: <30 seconds
- E2E tests: <2 minutes

**Constraints:**
- ✅ **MUST** use code splitting
- ✅ **MUST** optimize bundle size (<500KB initial)
- ✅ **MUST** lazy-load components
- ✅ **MUST** tree-shake unused code
- ⚠️ **MAY** use SWC compiler (Next.js default)

### 9.2 Runtime Performance

**Metrics:**
- Time to First Byte (TTFB): <200ms
- First Contentful Paint (FCP): <1.5s
- Largest Contentful Paint (LCP): <2.5s
- Cumulative Layout Shift (CLS): <0.1
- First Input Delay (FID): <100ms

**Constraints:**
- ✅ **MUST** meet Core Web Vitals thresholds
- ✅ **MUST** implement lazy loading for images
- ✅ **MUST** minimize JavaScript bundle size
- ⚠️ **MAY** use service workers for caching

### 9.3 API Performance

**Targets:**
- API latency (p99): <500ms
- Function cold start: <3s
- Database query time: <100ms

**Constraints:**
- ✅ **MUST** implement connection pooling
- ✅ **MUST** use database indexes
- ✅ **MUST** cache frequent queries
- ⚠️ **MAY** use CDN for static assets

---

## 10. Accessibility Constraints

### 10.1 WCAG 2.1 Compliance

**Level:** AA (required)

**Requirements:**
- ✅ **MUST** provide text alternatives (alt text)
- ✅ **MUST** support keyboard navigation
- ✅ **MUST** maintain color contrast ratios (4.5:1)
- ✅ **MUST** use semantic HTML
- ✅ **MUST** implement ARIA landmarks
- ✅ **MUST** support screen readers

### 10.2 Testing Tools

**Automated:**
- `@testing-library/react` - Component testing
- Playwright accessibility checks

**Manual:**
- Screen reader testing (NVDA, JAWS)
- Keyboard-only navigation
- Color blindness simulation

**Constraints:**
- ✅ **MUST** pass axe-core accessibility audit
- ✅ **MUST** test with real assistive technology
- ⚠️ **MAY** use automated a11y linting

---

## 11. Environment Variables Summary

### 11.1 Required for Development

```bash
# GitHub (Development AI)
GITHUB_TOKEN=ghp_...

# Netlify
NETLIFY_AUTH_TOKEN=your_token
NETLIFY_SITE_ID=your_site_id

# Application
NODE_ENV=development
NEXT_PUBLIC_SENSORY_CORTEX_URL=http://localhost:3000
```

### 11.2 Required for Production

```bash
# AI Providers
BEE_API_URL=https://www.adgenxai.pro/api
BEE_API_KEY=<your-bee-key>
OPENAI_API_KEY=sk-proj-...

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-key>

# Social Platforms
INSTAGRAM_ACCOUNT_ID=<account-id>
FB_ACCESS_TOKEN=<facebook-token>
YOUTUBE_API_KEY=<api-key>
YOUTUBE_CLIENT_ID=<client-id>
YOUTUBE_CLIENT_SECRET=<client-secret>
TIKTOK_CLIENT_KEY=<client-key>
TIKTOK_CLIENT_SECRET=<client-secret>

# Security
GITHUB_WEBHOOK_SECRET=<webhook-secret>
GITHUB_PAT=<personal-access-token>
JWT_SECRET=<256-bit-secret>

# Deployment
NETLIFY_AUTH_TOKEN=<auth-token>
NETLIFY_SITE_ID=<site-id>
NODE_ENV=production
NEXT_PUBLIC_SENSORY_CORTEX_URL=https://adgenxai.netlify.app
```

### 11.3 Optional Configuration

```bash
# Feature Flags
ENABLE_WEBHOOK_PROCESSING=false
AI_PROVIDER=github  # or "openai"

# Monitoring
SENTRY_DSN=<sentry-dsn>  # Error tracking
ANALYTICS_ID=<ga4-id>    # Google Analytics

# Cost Controls
MAX_TOKENS_PER_REQUEST=2000
MAX_COST_PER_DAY=50.00
```

---

## 12. Browser Compatibility

### 12.1 Supported Browsers

**Desktop:**
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

**Mobile:**
- iOS Safari 14+ ✅
- Chrome Android 90+ ✅
- Samsung Internet 14+ ✅

**Constraints:**
- ✅ **MUST** support ES2022 features
- ✅ **MUST** use CSS Grid and Flexbox
- ✅ **MUST** polyfill critical features
- ❌ **CANNOT** support IE11
- ⚠️ **MAY** use progressive enhancement

---

## 13. Compliance and Legal

### 13.1 Data Privacy

**Regulations:**
- GDPR (EU)
- CCPA (California)
- SOC 2 (Enterprise)

**Constraints:**
- ✅ **MUST** implement data encryption at rest
- ✅ **MUST** implement data encryption in transit (TLS 1.3)
- ✅ **MUST** provide data export/deletion
- ✅ **MUST** obtain user consent for data collection
- ✅ **MUST** log data access for audit
- ❌ **CANNOT** store PII without encryption
- ❌ **CANNOT** share user data without consent

### 13.2 Content Licensing

**Platform Requirements:**
- ✅ **MUST** obtain rights to publish content
- ✅ **MUST** respect copyright/trademark law
- ✅ **MUST** implement DMCA takedown process
- ⚠️ **MAY** use watermarking for attribution

---

## 14. Monitoring and Observability

### 14.1 Required Metrics

**Application Metrics:**
- Request count
- Error rate
- Response time (p50, p95, p99)
- Token usage per model
- Cost per execution

**Infrastructure Metrics:**
- Function invocation count
- Cold start frequency
- Memory usage
- Database connection pool

**Constraints:**
- ✅ **MUST** track all metrics in real-time
- ✅ **MUST** implement alerting for anomalies
- ✅ **MUST** retain metrics for 90 days
- ⚠️ **MAY** use Netlify Analytics + custom dashboard

### 14.2 Logging

**Log Levels:**
- ERROR - Critical failures
- WARN - Degraded performance
- INFO - Normal operations
- DEBUG - Development only

**Constraints:**
- ✅ **MUST** log all errors with stack traces
- ✅ **MUST** log all API calls (request/response)
- ✅ **MUST** redact sensitive data (tokens, keys)
- ✅ **MUST** implement structured logging (JSON)
- ❌ **CANNOT** log PII or credentials
- ⚠️ **MAY** use log aggregation service

---

## 15. Scalability Constraints

### 15.1 Netlify Limits

**Free Tier:**
- Build minutes: 300/month
- Bandwidth: 100GB/month
- Functions: 125K invocations/month
- Function execution: 100 hours/month

**Pro Tier:**
- Build minutes: 1,000/month
- Bandwidth: 1TB/month
- Functions: Unlimited invocations
- Function execution: Unlimited

**Constraints:**
- ✅ **MUST** monitor usage against limits
- ✅ **MUST** implement rate limiting
- ✅ **MUST** optimize function execution time
- ⚠️ **MAY** upgrade tier based on usage

### 15.2 Database Scaling

**Supabase Free Tier:**
- Database size: 500MB
- File storage: 1GB
- Bandwidth: 2GB/month

**Constraints:**
- ✅ **MUST** implement data archival
- ✅ **MUST** optimize queries
- ✅ **MUST** use indexes
- ⚠️ **MAY** implement caching layer (Redis)

---

## 16. Development Workflow Constraints

### 16.1 Git Workflow

**Branch Strategy:**
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature development
- `bugfix/*` - Bug fixes
- `hotfix/*` - Emergency fixes

**Constraints:**
- ✅ **MUST** create feature branches from `develop`
- ✅ **MUST** use conventional commits
- ✅ **MUST** squash merge to `main`
- ✅ **MUST** tag releases (semver)
- ❌ **CANNOT** commit directly to `main`
- ❌ **CANNOT** force push to protected branches

### 16.2 Code Review Requirements

**PR Checklist:**
- [ ] Tests passing
- [ ] TypeScript compilation successful
- [ ] Code review approved
- [ ] CodeQL scan passed
- [ ] Coverage maintained/improved
- [ ] Documentation updated

**Constraints:**
- ✅ **MUST** obtain 1+ approval before merge
- ✅ **MUST** address all review comments
- ✅ **MUST** pass all CI checks
- ❌ **CANNOT** merge with failing tests
- ⚠️ **MAY** request Copilot code review

---

## 17. Documentation Requirements

### 17.1 Required Documentation

**Code-Level:**
- ✅ JSDoc comments for public APIs
- ✅ README for each major module
- ✅ Inline comments for complex logic
- ✅ TypeScript types for all functions

**Project-Level:**
- ✅ Architecture diagrams
- ✅ API documentation
- ✅ Deployment guides
- ✅ Troubleshooting guides

**Constraints:**
- ✅ **MUST** update docs with code changes
- ✅ **MUST** maintain changelog (CHANGELOG.md)
- ✅ **MUST** document breaking changes
- ⚠️ **MAY** use automated doc generation

---

## 18. Cost Constraints

### 18.1 Budget Targets

**Monthly Targets:**
- AI API costs: <$500/month
- Database: <$100/month
- Hosting: <$50/month
- Total: <$650/month

**Constraints:**
- ✅ **MUST** implement cost tracking
- ✅ **MUST** set budget alerts
- ✅ **MUST** optimize token usage
- ✅ **MUST** use cheaper models where possible
- ⚠️ **MAY** implement usage-based pricing

### 18.2 Cost Optimization Strategies

**AI Costs:**
- Use gpt-3.5-turbo for simple tasks
- Implement prompt caching
- Set max_tokens limits
- Use GitHub Models for development

**Infrastructure Costs:**
- Use static hosting (Netlify)
- Implement CDN caching
- Optimize function execution time
- Use connection pooling

---

## 19. Disaster Recovery

### 19.1 Backup Requirements

**Automated Backups:**
- Database: Daily (Supabase)
- File storage: Daily (Netlify Blobs)
- Code: Continuous (GitHub)

**Constraints:**
- ✅ **MUST** test restore procedures monthly
- ✅ **MUST** retain backups for 30 days
- ✅ **MUST** encrypt backups at rest
- ⚠️ **MAY** implement multi-region backups

### 19.2 Recovery Time Objectives

**RTO/RPO Targets:**
- RTO (Recovery Time): <4 hours
- RPO (Data Loss): <1 hour

**Constraints:**
- ✅ **MUST** document recovery procedures
- ✅ **MUST** maintain runbook
- ✅ **MUST** test disaster recovery quarterly

---

## 20. Future Constraints

### 20.1 Planned Integrations

**Q1 2025:**
- [ ] LinkedIn Publishing API
- [ ] Twitter/X API v2
- [ ] Facebook Business API

**Q2 2025:**
- [ ] Anthropic Claude API
- [ ] Google Gemini API
- [ ] Midjourney API (unofficial)

**Constraints:**
- ✅ **MUST** maintain backward compatibility
- ✅ **MUST** implement feature flags
- ⚠️ **MAY** deprecate old integrations with 90-day notice

---

## 21. Support and Maintenance

### 21.1 Support Channels

**Available:**
- GitHub Issues (bug reports)
- GitHub Discussions (Q&A)
- Email support (paid plans)

**Response Times:**
- Critical: <4 hours
- High: <24 hours
- Medium: <3 days
- Low: <1 week

**Constraints:**
- ✅ **MUST** acknowledge issues within 24 hours
- ✅ **MUST** provide workarounds for critical bugs
- ⚠️ **MAY** implement community support forum

---

## Summary

This document outlines all technical constraints and integrations for AdGenXAI. All constraints marked with ✅ **MUST** are mandatory and non-negotiable. Constraints marked with ⚠️ **MAY** are optional but recommended. Constraints marked with ❌ **CANNOT** are explicitly forbidden.

**Key Takeaways:**
1. **Static Export Required** - Next.js must use `output: 'export'`
2. **Netlify Functions Only** - No server-side Next.js features
3. **Strict TypeScript** - Type safety is mandatory
4. **CORS Headers Required** - All API responses must include CORS
5. **Security First** - CodeQL, JWT, RLS enforced
6. **Cost Monitoring** - Track all AI/infrastructure costs
7. **80% Test Coverage** - Unit + E2E tests required
8. **Accessibility** - WCAG 2.1 AA compliance mandatory

**Next Steps:**
1. Review this document during onboarding
2. Reference during development for constraints
3. Update as new integrations are added
4. Share with all team members

---

**Document Version:** 1.0  
**Last Updated:** November 2, 2025  
**Maintained By:** AdGenXAI Engineering Team  
**Review Cycle:** Quarterly
