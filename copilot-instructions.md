# Copilot Code Review — AdGenXAI

## Priorities
1) Security: RLS, auth checks, webhook validation, secrets safety.
2) Cost Optimization: Cache-first architecture with 50-80% API call reduction.
3) Correctness: provider adapters, streaming, fallback logic.
4) Quality: ESLint clean, TypeScript strict, mobile-first Aurora styling.

## Repo Context
- Providers: LongCat-Video primary with intelligent ProviderSelector (11 models).
- Cache: Hash-based Netlify Blobs caching with TTL, compression, auto-cleanup.
- DB: Supabase with RLS (use views/RPC; avoid ad-hoc SQL in routes).
- Auth: Supabase Auth JWT; every API path checks user/tenant ownership.
- Netlify Functions for webhooks/orchestration.
- Telemetry: Comprehensive cache/provider metrics for cost optimization.

## Rules
- PRs < 400 LOC net change.
- No secrets in code; use `process.env.*`.
- Update tests & docs for any behavior change.
- Keep QUICKSTART, PROVIDER_INTEGRATION, DATABASE_SCHEMA in sync.
- **Cache-First**: Always check cache before expensive provider calls.
- **Test Coverage**: Include cache tests for any provider/API changes.
- **TTL Strategy**: Use dynamic TTL based on content type and user tier.

## When suggesting fixes
- Open **stacked PRs** by scope (Cache / Providers / Supabase / Auth).
- Add short rationale + file list + test notes.
- Apply labels: `PR-4: Cache`, `PR-3: Providers`, `PR-1: Supabase`, `PR-5: Auth`.
- Link each PR to the **Phase-2** project.

## Cache Architecture (Critical)
- **Location**: `app/lib/cache/` - Hash-based caching with Netlify Blobs
- **Performance**: Sub-second cache hits vs 30+ second generation times
- **Cost Impact**: 50-80% reduction in provider API calls
- **Key Components**:
  - `CacheAdapter` interface with get/set/delete operations
  - `NetlifyCacheAdapter` with compression and TTL management
  - `ProviderSelector` integration for cache-first selection
  - `CacheMetrics` for telemetry and performance monitoring
- **Usage**: Provider selection automatically checks cache, stores results
- **TTL Strategy**: Dynamic based on content type, user tier, complexity
- **Monitoring**: Real-time cache hit/miss rates, size tracking, health checks
