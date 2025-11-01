# Copilot Instructions for AdGenXAI - AI Sensory Cortex

## Project Overview
AdGenXAI is a Next.js AI-powered advertising platform with a "Sensory Cortex" architecture. The system generates ads/reels using AI agents, publishes to social platforms via Netlify functions, and provides a polished aurora-themed UI. Think of it as a webhook-driven AI advertising automation platform.

## Architecture ("Sensory Cortex" Pattern)
- **Frontend**: Next.js 15+ app with static export (`output: 'export'`) for Netlify hosting
- **Backend**: Netlify Functions act as the "sensory cortex" - serverless webhooks that orchestrate AI agents
- **AI Integration**: External "Bee Agent" API calls for content generation
- **Platform Publishing**: Modular platform adapters in `lib/platforms/` (Instagram, TikTok, YouTube)
- **Deployment**: Fully automated via "BEE-SHIP" batch scripts that commit → push → auto-deploy
- **Tech Stack**:
  - Next.js 15 with App Router
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
  - Custom aurora colors: `#35E3FF` (cyan), `#7C4DFF` (violet), `#FFD76A` (gold)
  - Gradient pattern: `radial-gradient(60% 60% at 50% 50%, #35E3FF 0%, #7C4DFF 50%, #FFD76A 100%)`
- **Framer Motion**: Heavy use for animations, especially scroll-based transforms
- **Mobile-First**: Components like `MobileCreateDock.tsx` for mobile UX
- **Command Palette**: Cmd+K opens `CommandPalette.tsx` (universal pattern)
- **TypeScript Path Aliases**: Use `@/components/*`, `@/lib/*`, `@/*` for imports

### Client vs Server Components
- **"use client"** directive for components with:
  - State hooks (`useState`, `useEffect`, `useRef`)
  - Browser APIs (localStorage, window events)
  - Animation libraries (Framer Motion)
  - Event handlers
- **Server components** by default for:
  - Static content
  - Layouts
  - Dashboard pages that don't need interactivity

Example pattern from `TopBar.tsx`:
```typescript
"use client";
import { useEffect, useState } from "react";
import { getInitialTheme, setTheme, applyTheme, Theme } from "@/lib/theme";

export default function TopBar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [theme, setLocalTheme] = useState<Theme>("light");

  useEffect(() => {
    const t = getInitialTheme();
    setLocalTheme(t);
    applyTheme(t);
  }, []);

  // Component implementation...
}
```

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

**Example: TikTok Publishing Flow** (`lib/platforms/tiktok.ts`)
```typescript
export async function publishVideo(
  config: TikTokConfig,
  videoUrl: string,
  metadata: TikTokVideoMetadata
): Promise<{ shareId: string; publishId: string }> {
  // Step 1: Initialize upload
  const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ post_info: { title: metadata.title, /*...*/ } }),
  });

  if (!initResponse.ok) {
    const errorData = await initResponse.json();
    throw new Error(`TikTok init failed: ${JSON.stringify(errorData)}`);
  }

  // Step 2: Upload video
  // Step 3: Confirm and publish
  // Returns { shareId, publishId }
}
```

### State Management Patterns

**Local Component State** (most common):
```typescript
const [loading, setLoading] = useState(false);
const [data, setData] = useState<MyData | null>(null);
const abortRef = useRef<AbortController | null>(null);
```

**Theme Management** (`lib/theme.ts`):
- Uses localStorage for persistence
- CSS custom properties for dynamic theming
- System preference detection with `matchMedia`
```typescript
export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
```

**Data Fetching Pattern** (from `app/dashboard/page.tsx`):
```typescript
const [stats, setStats] = useState<DashboardStats | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };
  fetchStats();
}, []);
```

### Error Handling Patterns

**API Error Handling**:
```typescript
// Always check response.ok before parsing
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(`Operation failed: ${JSON.stringify(errorData)}`);
}
```

**Try-Catch with Fallbacks** (from `lib/theme.ts`):
```typescript
export function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light"; // Fallback if localStorage unavailable
  }
}
```

**Abort Controller Pattern** (from `PromptCard.tsx`):
```typescript
const abortRef = useRef<AbortController | null>(null);

const resetAbort = () => {
  if (abortRef.current) {
    abortRef.current.abort();
  }
  abortRef.current = new AbortController();
  return abortRef.current;
};

// Use in fetch:
const response = await fetch("/api/chat", {
  signal: abortRef.current.signal,
  // ...
});
```

### Animation Patterns with Framer Motion

**Scroll-Based Animations** (`AuroraField.tsx`):
```typescript
import { motion, useScroll, useTransform } from "framer-motion";

export default function AuroraField() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 1], [1, 0.8, 0.4]);

  return (
    <motion.div style={{ y, opacity }} className="fixed inset-0 -z-10">
      {/* Aurora gradients */}
    </motion.div>
  );
}
```

**Mouse Interaction Animations**:
```typescript
const [mouse, setMouse] = useState({ x: 50, y: 50 });

useEffect(() => {
  const move = (e: MouseEvent) =>
    setMouse({
      x: (e.clientX / window.innerWidth) * 100,
      y: (e.clientY / window.innerHeight) * 100
    });
  window.addEventListener("mousemove", move);
  return () => window.removeEventListener("mousemove", move);
}, []);

// Use in SVG gradient:
<radialGradient id="aurora" cx={`${mouse.x}%`} cy={`${mouse.y}%`} r="60%">
  <stop offset="0%" stopColor="#35E3FF" stopOpacity="0.35" />
  <stop offset="50%" stopColor="#7C4DFF" stopOpacity="0.22" />
  <stop offset="100%" stopColor="#FFD76A" stopOpacity="0.15" />
</radialGradient>
```

### Accessibility Patterns

**Keyboard Navigation** (`CommandPalette.tsx`):
```typescript
useEffect(() => {
  const onKey = (e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      onClose();
    }
    if (e.key === "Escape") onClose();
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [onClose]);
```

**ARIA Attributes**:
```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-label="Command palette"
  onClick={onClose}
>
  {/* Dialog content */}
</div>
```

**Semantic Buttons with Labels**:
```typescript
<button
  aria-label="Open command palette"
  title="Open palette (⌘K)"
  onClick={onOpenPalette}
>
  ⌘K
</button>
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

### Testing Stack
- **Vitest**: Fast unit test runner with jsdom environment
- **@testing-library/react**: Component interaction testing
- **@testing-library/user-event**: Simulating user interactions
- **@testing-library/jest-dom**: Enhanced matchers

### Testing Patterns

**Component Testing Example** (`CommandPalette.test.tsx`):
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommandPalette from "@/components/CommandPalette";

describe("CommandPalette", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    // Mock browser APIs
    delete (window as any).location;
    window.location = { assign: vi.fn() } as any;
  });

  it("renders when open is true", () => {
    render(<CommandPalette open={true} onClose={mockOnClose} />);
    expect(screen.getByRole("dialog", { name: /command palette/i })).toBeInTheDocument();
  });

  it("executes command action when clicked", async () => {
    render(<CommandPalette open={true} onClose={mockOnClose} />);
    const button = screen.getByRole("button", { name: /create new ad/i });
    await userEvent.click(button);
    expect(window.location.assign).toHaveBeenCalledWith("#create");
  });

  it("closes when Escape key is pressed", async () => {
    render(<CommandPalette open={true} onClose={mockOnClose} />);
    await userEvent.keyboard("{Escape}");
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
```

**Accessibility Testing**:
```typescript
it("has proper accessibility attributes", () => {
  render(<CommandPalette open={true} onClose={mockOnClose} />);
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(dialog).toHaveAttribute("aria-label", "Command palette");
});
```

**Testing User Interactions**:
```typescript
it("does not close when clicking inside dialog content", async () => {
  render(<CommandPalette open={true} onClose={mockOnClose} />);
  const input = screen.getByPlaceholderText(/type a command/i);
  await userEvent.click(input);
  expect(mockOnClose).not.toHaveBeenCalled();
});
```

### Test Configuration (`vitest.config.ts`)
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    coverage: {
      exclude: [
        'app/layout.tsx',
        'app/**/page.tsx',
        '**/*.config.*',
      ],
    },
  },
});
```

### Running Tests
```bash
npm run test          # Run all tests once
npm run test:watch    # Watch mode
npm run test:ci       # With coverage report
```

## TypeScript Patterns

### Type Definitions

**Component Props**:
```typescript
interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: string;
}

function MetricCard({ title, value, unit, icon }: MetricCardProps) {
  // Component implementation
}
```

**API Response Types**:
```typescript
interface DashboardStats {
  totalGenerations: number;
  successRate: number;
  avgLatency: number;
  totalTokens: number;
  mostUsedModel: string;
  recentProjects: Array<{
    id: string;
    title: string;
    model: string;
    tokensUsed: number;
    createdAt: number;
    status: "success" | "failed" | "pending";
  }>;
}
```

**Platform Types** (from `lib/platforms/tiktok.ts`):
```typescript
export type TikTokConfig = {
  clientKey: string;
  clientSecret: string;
  accessToken: string;
  openId?: string; // Optional fields use ?
};

export type TikTokVideoMetadata = {
  title: string;
  description?: string;
  privacy_level?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY";
  disable_duet?: boolean;
  disable_comment?: boolean;
  disable_stitch?: boolean;
};
```

### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "strict": true,              // Strict type checking
    "target": "ES2022",          // Modern JavaScript
    "baseUrl": ".",              // For path aliases
    "paths": {
      "@/components/*": ["./app/components/*"],
      "@/lib/*": ["./lib/*"],
      "@/*": ["./*"]
    },
    "forceConsistentCasingInFileNames": true
  }
}
```

## Styling Patterns

### Tailwind + CSS Variables Approach
The project combines Tailwind utilities with CSS custom properties for dynamic theming:

**Theme Variables** (set by `lib/theme.ts`):
```css
--bg: #ffffff;        /* Background color */
--card: #f8f9fa;      /* Card background */
--border: #e9ecef;    /* Border color */
--text: #212529;      /* Text color */
```

**Usage in Components**:
```typescript
<div
  className="rounded-xl border p-6"
  style={{
    background: "var(--card)",
    borderColor: "var(--border)",
    color: "var(--text)"
  }}
>
  {/* Component content */}
</div>
```

### Aurora Gradient Pattern
```typescript
// Hero gradient background
<div className="absolute -top-24 -left-24 h-[80vh] w-[90vw] rounded-full blur-3xl
                bg-[radial-gradient(60%_60%_at_40%_40%,rgba(53,227,255,.28),transparent)]" />
```

### Responsive Design
```typescript
// Mobile-first with md: breakpoint
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <input className="hidden md:block w-64 rounded-lg" />
</div>
```

### Shadow Patterns
```typescript
// Aurora-themed shadows
className="shadow-[0_8px_40px_rgba(53,227,255,.35)]"
className="shadow-[0_10px_60px_rgba(124,77,255,.2)]"
```

## Performance Considerations

### Code Splitting
- Next.js automatically code-splits pages
- Use dynamic imports for heavy components:
```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>
});
```

### Image Optimization
```typescript
<img
  src="/hero-aurora-studio@1792x1024.svg"
  alt="Descriptive alt text"
  loading="eager"  // or "lazy" for below-fold images
  className="w-full rounded-2xl"
/>
```

### Cleanup Patterns
Always clean up event listeners and subscriptions:
```typescript
useEffect(() => {
  const handler = (e: MouseEvent) => { /* ... */ };
  window.addEventListener("mousemove", handler);
  return () => window.removeEventListener("mousemove", handler); // Cleanup!
}, []);
```

### Abort Requests on Unmount
```typescript
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/data", { signal: controller.signal })
    .then(res => res.json())
    .then(setData);

  return () => controller.abort(); // Cancel on unmount
}, []);
```

## Common Pitfalls & Gotchas

### 1. Static Export Limitations
Since the app uses `output: 'export'`, you **cannot** use:
- Server-side rendering (SSR)
- Incremental Static Regeneration (ISR)
- API routes in `app/api/` (use Netlify functions instead)

### 2. Environment Variables
- **Browser-accessible**: Must be prefixed with `NEXT_PUBLIC_`
- **Server-only**: No prefix (only available in Netlify functions)
- **Never commit**: Keep `.env` out of git

### 3. Netlify Functions Context
- Functions run in a serverless environment
- No persistent state between invocations
- Cold starts can add latency
- Use environment variables from Netlify dashboard

### 4. Type Safety
Always type your state and props:
```typescript
// ❌ Bad
const [data, setData] = useState(null);

// ✅ Good
const [data, setData] = useState<MyData | null>(null);
```

### 5. Async/Await Error Handling
Always wrap async calls in try-catch:
```typescript
// ❌ Bad
const data = await fetch("/api/data").then(r => r.json());

// ✅ Good
try {
  const response = await fetch("/api/data");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  setData(data);
} catch (error) {
  console.error("Fetch failed:", error);
  setError(error);
}
```

### 6. SSR vs Client Components
Remember the "use client" directive for:
- Browser APIs (window, localStorage)
- Event handlers
- State hooks
- Framer Motion components

## Key Files to Understand First
- `netlify/functions/webhook.ts` - Main AI orchestration endpoint
- `app/components/AuroraField.tsx` - Core visual theme component
- `lib/theme.ts` - Theme management system
- `lib/platforms/instagram.ts` - Platform publishing pattern
- `app/components/CommandPalette.tsx` - Command palette pattern
- `BEE_SHIP_QUICK_REF.md` - Deployment workflow documentation
- `netlify.toml` - Critical routing config (`/api/*` → functions)
- `tsconfig.json` - TypeScript path aliases
- `vitest.config.ts` - Test configuration

## Common Debugging
- Check Netlify function logs for webhook errors
- Verify environment variables in Netlify dashboard
- Test platform APIs independently before integration
- Use `netlify dev` for local function debugging
- Monitor external Sensory Cortex health via `/health` endpoint

## Security Best Practices

### API Keys & Secrets
- **Never hardcode** API keys in code
- Use environment variables from Netlify dashboard
- Keep `.env` files out of version control
- Prefix browser-accessible vars with `NEXT_PUBLIC_`

### Input Validation
```typescript
// Validate webhook payloads
if (!payload.processing_id || typeof payload.prompt !== 'string') {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Invalid payload' })
  };
}
```

### CORS Configuration
Always include proper CORS headers in Netlify functions:
```typescript
const headers = {
  'Access-Control-Allow-Origin': '*', // Or specific domain
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};
```

### Error Messages
Don't leak sensitive information in error messages:
```typescript
// ❌ Bad
throw new Error(`Database connection failed: ${dbPassword}`);

// ✅ Good
console.error('Database connection failed:', error); // Log internally
throw new Error('Database connection failed'); // Generic message to user
```

## Project Naming Conventions
- "Legendary" status responses indicate successful operations
- "Sensory Cortex" refers to the distributed AI processing architecture
- "Bee Agent" is the external AI content generation service
- "Aurora" theme applies to all visual components
- "BEE-SHIP" refers to the automated deployment scripts

## Quick Reference

### Essential Commands
```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run typecheck        # TypeScript validation
netlify dev              # Test functions locally

# Testing
npm run test             # Run tests once
npm run test:watch       # Watch mode
npm run test:ci          # With coverage

# Deployment
# Use BEE-SHIP batch scripts or push to GitHub (auto-deploys via Netlify)
```

### File Structure
```
adgenxai-2/
├── app/                      # Next.js App Router
│   ├── components/           # UI components
│   │   ├── AuroraField.tsx   # Background animation
│   │   ├── CommandPalette.tsx # Cmd+K palette
│   │   ├── TopBar.tsx        # Navigation
│   │   └── __tests__/        # Component tests
│   ├── dashboard/            # Dashboard pages
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── lib/                      # Utilities & logic
│   ├── platforms/            # Social platform APIs
│   │   ├── instagram.ts
│   │   ├── tiktok.ts
│   │   └── youtube.ts
│   └── theme.ts              # Theme management
├── netlify/
│   ├── functions/            # Serverless functions
│   │   ├── webhook.ts        # Main AI endpoint
│   │   └── health.ts         # Health check
│   └── edge-functions/       # Edge functions (if any)
├── public/                   # Static assets
├── .github/
│   └── copilot-instructions.md # This file!
├── netlify.toml              # Netlify config
├── next.config.mjs           # Next.js config
├── tsconfig.json             # TypeScript config
├── vitest.config.ts          # Test config
└── package.json              # Dependencies
```

### Path Aliases (tsconfig.json)
```typescript
import Component from '@/components/Component';  // app/components/Component
import { util } from '@/lib/util';               // lib/util
import something from '@/anything';               // Root-level imports
```

### Color Palette
- **Aurora Cyan**: `#35E3FF` - Primary accent
- **Aurora Violet**: `#7C4DFF` - Secondary accent
- **Aurora Gold**: `#FFD76A` - Tertiary accent
- Theme variables: `--bg`, `--card`, `--border`, `--text`

### Useful Resources
- BEE_SHIP_QUICK_REF.md - Deployment guide
- BEE_SHIP_COMPLETE_GUIDE.md - Complete deployment documentation
- BUILD_SUMMARY.md - Build configuration summary
- Netlify Functions docs: https://docs.netlify.com/functions/overview/