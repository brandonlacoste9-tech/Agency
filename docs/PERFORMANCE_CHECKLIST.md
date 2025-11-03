# Code Review Checklist for Performance

Use this checklist when reviewing code changes to ensure performance best practices are followed.

## React Components

### State & Props
- [ ] Are expensive calculations wrapped in `useMemo`?
- [ ] Are event handlers wrapped in `useCallback` when passed to child components?
- [ ] Are static components wrapped in `React.memo`?
- [ ] Does component avoid unnecessary state (derive from props when possible)?
- [ ] Are default props defined outside component to avoid recreation?

### Rendering
- [ ] Does component avoid inline function definitions in render?
- [ ] Are large lists using virtual scrolling (react-window/react-virtual)?
- [ ] Are below-the-fold components lazy-loaded with `lazy()` and `Suspense`?
- [ ] Are images using Next.js `<Image>` component for optimization?
- [ ] Is `key` prop stable and unique (not using array index for dynamic lists)?

### Effects
- [ ] Do `useEffect` hooks have correct dependency arrays?
- [ ] Are intervals/timeouts properly cleaned up in effect return function?
- [ ] Are event listeners removed in cleanup function?
- [ ] Does effect avoid running on every render unnecessarily?

## API Routes

### Data Fetching
- [ ] Are array operations optimized (single pass when possible)?
- [ ] Is pagination implemented for large datasets?
- [ ] Are database queries indexed and optimized?
- [ ] Is response data minimal (only return what's needed)?
- [ ] Are responses properly cached with appropriate headers?

### Error Handling
- [ ] Are errors caught and returned with proper HTTP status codes?
- [ ] Are error messages safe (no sensitive data exposure)?
- [ ] Is rate limiting implemented for expensive operations?

## Network Requests

### Client-Side
- [ ] Are polling intervals reasonable (use exponential backoff)?
- [ ] Are requests debounced/throttled when appropriate?
- [ ] Are concurrent identical requests deduplicated?
- [ ] Are pending requests cancelled when component unmounts?
- [ ] Is loading state shown to user during requests?

### Optimization
- [ ] Consider using React Query/SWR for automatic caching
- [ ] Are static assets cached appropriately?
- [ ] Is gzip/brotli compression enabled?
- [ ] Are API responses using HTTP caching headers?

## Bundle Size

### Imports
- [ ] Are large libraries imported lazily when possible?
- [ ] Are tree-shakeable imports used (`import { x } from 'lib'` not `import * as lib`)?
- [ ] Are unused dependencies removed from package.json?
- [ ] Are dev dependencies in devDependencies (not dependencies)?

### Code Splitting
- [ ] Are route components code-split?
- [ ] Are heavy libraries loaded dynamically when needed?
- [ ] Is bundle analyzed regularly (`npm run build && analyze`)?

## Database/Storage

### Queries
- [ ] Are frequently accessed data indexed?
- [ ] Are N+1 queries avoided (use joins/batch requests)?
- [ ] Are query results limited/paginated?
- [ ] Are queries selecting only needed columns?

### Caching
- [ ] Is frequently read data cached (Redis/memory)?
- [ ] Are cache keys properly namespaced?
- [ ] Is cache invalidation handled correctly?
- [ ] Are cache TTLs appropriate?

## Monitoring

### Metrics
- [ ] Are Core Web Vitals monitored (LCP, FID, CLS)?
- [ ] Are API response times tracked (p50, p95, p99)?
- [ ] Are error rates monitored?
- [ ] Is bundle size tracked over time?

### Logging
- [ ] Are performance logs added for slow operations?
- [ ] Are expensive operations logged with timing?
- [ ] Is logging production-safe (no PII)?

## Testing

### Performance Tests
- [ ] Are performance benchmarks written for optimizations?
- [ ] Are tests measuring actual performance impact?
- [ ] Are large data scenarios tested?
- [ ] Is memory usage tested for long-running operations?

## Red Flags to Watch For

### Immediate Issues
- 🚩 Multiple array iterations (filter → map → reduce) - combine into one
- 🚩 Calculations inside map/forEach - move outside or memoize
- 🚩 Component re-renders on every parent render - add React.memo
- 🚩 Polling interval < 5 seconds without backoff - add exponential backoff
- 🚩 Unbounded arrays in memory - add limits or pagination
- 🚩 Missing cleanup in useEffect - will cause memory leaks
- 🚩 Large bundle chunks (>500KB) - split or lazy load

### Should Investigate
- ⚠️ Synchronous operations in event handlers
- ⚠️ No loading states for async operations
- ⚠️ Missing error boundaries
- ⚠️ No request deduplication
- ⚠️ Inline styles (use CSS modules/Tailwind)
- ⚠️ Console.log statements in production code

## Quick Wins

When you see these patterns, suggest these quick fixes:

### Before → After Examples

```tsx
// ❌ Multiple iterations
const total = items.filter(x => x.active).map(x => x.value).reduce((a, b) => a + b, 0);

// ✅ Single iteration
const total = items.reduce((sum, x) => sum + (x.active ? x.value : 0), 0);
```

```tsx
// ❌ Calculation in render
{items.map(item => {
  const max = Math.max(...allItems.map(x => x.value)); // Recalculated for each item!
  return <div>{item.value / max}</div>;
})}

// ✅ Memoized calculation
const max = useMemo(() => Math.max(...allItems.map(x => x.value)), [allItems]);
{items.map(item => <div>{item.value / max}</div>)}
```

```tsx
// ❌ Polling without backoff
useEffect(() => {
  const interval = setInterval(fetchData, 1000); // Every second forever!
  return () => clearInterval(interval);
}, []);

// ✅ Exponential backoff
useEffect(() => {
  let delay = 1000;
  let timeoutId: NodeJS.Timeout;
  
  const poll = async () => {
    await fetchData();
    delay = Math.min(delay * 1.5, 30000); // Max 30s
    timeoutId = setTimeout(poll, delay);
  };
  
  poll();
  return () => clearTimeout(timeoutId);
}, []);
```

```tsx
// ❌ Heavy component always loaded
import HeavyChart from './HeavyChart';

// ✅ Lazy loaded below fold
const HeavyChart = lazy(() => import('./HeavyChart'));
<Suspense fallback={<div>Loading...</div>}>
  <HeavyChart />
</Suspense>
```

## Tools

### During Development
- Chrome DevTools Performance tab
- React DevTools Profiler
- Lighthouse in Chrome DevTools
- Bundle analyzer: `npm run build && npx webpack-bundle-analyzer`

### For Production
- Next.js Analytics
- Sentry Performance Monitoring
- Core Web Vitals monitoring
- Custom performance marks: `performance.mark('operation-start')`

## When to Optimize

### Optimize Now
- User-facing interactions (button clicks, form inputs)
- Initial page load
- API routes called frequently (>100/minute)
- Operations on large datasets (>1000 items)

### Optimize Later
- One-time setup operations
- Admin-only features
- Edge cases
- Operations on small datasets (<100 items)

### Measure First
Before optimizing, always:
1. Profile current performance
2. Identify bottleneck
3. Make change
4. Measure again
5. Document results

Don't optimize based on assumptions!
