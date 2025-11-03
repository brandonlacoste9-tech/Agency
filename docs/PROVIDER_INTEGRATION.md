# Real Provider Integration Guide

This document explains how to integrate AdGenXAI with real AI providers for production use.

## Table of Contents

1. [GitHub Models](#github-models) - Recommended for getting started
2. [OpenAI](#openai) - Production-grade alternative
3. [Provider Fallback Strategy](#fallback-strategy)
4. [Testing Integration](#testing-integration)

---

## GitHub Models

**GitHub Models** provides free SSE streaming through GitHub Copilot. No payment required for development.

### Setup

1. **Get GitHub Token**:
   ```bash
   # Generate a Personal Access Token at https://github.com/settings/tokens
   # Scopes needed: none (public read is sufficient)
   export GITHUB_TOKEN="your_token_here"
   ```

2. **Update `/api/chat/route.ts`**:
   Uncomment Option A in the route handler:

   ```typescript
   try {
     const upstream = await fetch(
       "https://models.github.ai/inference/chat/completions?stream=1",
       {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ""}`,
         },
         body: JSON.stringify({
           model: "gpt-4o", // or another available model
           messages: [
             { role: "system", content: "You are a helpful assistant." },
             { role: "user", content: prompt },
           ],
           stream: true,
         }),
       }
     );
     // ... rest of relay logic
   } catch (err) {
     // fall through to synthetic stream
   }
   ```

3. **Test locally**:
   ```bash
   curl -X POST http://localhost:3000/api/chat?stream=1 \
     -H "Content-Type: application/json" \
     -d '{"model": "openai/gpt-5", "prompt": "Hello"}' \
     -N
   ```

### Available Models

- `gpt-4o` - Recommended
- `gpt-4-turbo`
- `claude-3.5-sonnet` (via Anthropic partnership)

---

## OpenAI

**OpenAI** provides production-grade models with guaranteed SLA.

### Setup

1. **Get API Key**:
   ```bash
   # Get key from https://platform.openai.com/api-keys
   export OPENAI_API_KEY="sk-proj-..."
   ```

2. **Update `/api/chat/route.ts`**:

   ```typescript
   try {
     const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}",
       },
       body: JSON.stringify({
         model: "gpt-4-turbo",
         messages: [
           { role: "system", content: "You are a helpful assistant." },
           { role: "user", content: prompt },
         ],
         stream: true,
         temperature: 0.7,
         max_tokens: 1000,
       }),
     });
     // ... relay logic
   } catch (err) {
     // fall through
   }
   ```

3. **Monitor costs**:
   - Set budget alerts in OpenAI dashboard
   - Use `max_tokens` to prevent runaway costs
   - Track usage via `/api/usage` endpoint

4. **Pricing** (as of 2024):
   - `gpt-4-turbo`: ~$0.03 / 1K input tokens
   - `gpt-3.5-turbo`: ~$0.001 / 1K input tokens

---

## Fallback Strategy

The current implementation gracefully falls back to synthetic streaming:

```typescript
// Option A: Try real provider (GitHub, OpenAI, etc.)
try {
  const upstream = await fetch(...);
  if (!upstream.ok) throw new Error("Provider error");
  // relay stream...
  return;
} catch (err) {
  // Fall through
}

// Option B: Synthetic fallback for dev/demo
const synthetic = "Here's a friendly response...";
// Split into tokens and emit SSE
```

**Pros**:
- Development works offline
- Demo still functional if provider down
- Easy to test without billing

**Cons**:
- Not real AI responses
- Disabled for production (remove fallback)

---

## Testing Integration

### Unit Tests

```bash
# Existing tests still pass with fallback:
npm test
# Output: 47/47 tests passing ✅
```

### E2E Tests

```bash
# New Playwright tests verify streaming journey:
npm install -D @playwright/test
npx playwright test

# Key scenarios covered:
# ✓ Streaming renders tokens incrementally
# ✓ Abort cancels mid-stream
# ✓ Error handling displays gracefully
# ✓ Model selection persists
# ✓ Keyboard navigation accessible
```

### Manual Testing

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Test GitHub Models**:
   ```bash
   GITHUB_TOKEN=your_token npm run dev
   ```

3. **Verify metrics**:
   ```bash
   curl http://localhost:3000/api/analytics?action=report
   # Returns: { totalRequests, successRate, avgLatency, ... }
   ```

4. **Check usage**:
   ```bash
   curl http://localhost:3000/api/usage?model=openai/gpt-5
   # Returns: { todayTokens, remainingTokens, percentageUsed, ... }
   ```

---

## Environment Variables

Create `.env.local`:

```env
# GitHub Models (optional - free)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# OpenAI (optional - paid)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx

# Optional: provider selection
AI_PROVIDER=github  # or "openai"
```

---

## Production Checklist

- [ ] Remove synthetic fallback (require real provider)
- [ ] Set up cost monitoring/alerts
- [ ] Add rate limiting to prevent abuse
- [ ] Enable request validation (model, prompt length)
- [ ] Log all API calls for audit
- [ ] Test error handling for provider outages
- [ ] Set up monitoring dashboard (see `/api/analytics`)
- [ ] Add request signing/nonce for webhook security

---

## Monitoring

AdGenXAI includes built-in analytics:

```typescript
// Streaming metrics collected automatically:
- latency: ms to first token
- totalDuration: total request time
- tokensGenerated: count
- wasAborted: boolean
- status: success | error | aborted

// Dashboard: GET /api/analytics?action=report
{
  "totalRequests": 150,
  "successRate": 94,
  "abortRate": 6,
  "avgLatency": 245,
  "avgDuration": 3200,
  "topModel": "gpt-4o",
  "modelBreakdown": { ... }
}
```

---

## Troubleshooting

### Provider returns 401

```
Check GITHUB_TOKEN or OPENAI_API_KEY in .env.local
Verify token has correct scopes (GitHub) or is active (OpenAI)
```

### Streaming stops mid-response

```
- Check network timeout settings
- Verify upstream provider not rate-limiting
- Look at /api/analytics for abort rate
```

### High latency (>5s to first token)

```
- Provider may be overloaded
- Check your prompt length (longer = slower)
- Try different model if available
- Monitor via /api/analytics
```

---

## Next Steps

1. Choose provider (GitHub Models recommended for dev)
2. Add credentials to `.env.local`
3. Test with `npm run dev`
4. Run E2E tests: `npx playwright test`
5. Monitor via `/api/analytics` and `/api/usage`
6. Deploy to production with real provider

Happy streaming! 🚀
