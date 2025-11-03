/**
 * Cache Module for AdGenXAI Platform
 * 
 * Complete hash-based caching solution with:
 * - Netlify Blobs storage backend
 * - TTL-based expiration
 * - Size-aware management
 * - Intelligent provider integration
 * - Comprehensive telemetry
 */

// Core interfaces and utilities
export {
  CacheAdapter,
  CacheEntry,
  CacheConfig,
  CacheStats,
  CacheGenerationParams,
  CacheMissError,
  CacheStorageError,
  DEFAULT_CACHE_CONFIG,
  generateCacheKey,
  calculateSizeBytes,
  isExpired,
  createCacheEntry
} from './cache-adapter';

// Netlify Blobs implementation
export {
  NetlifyCacheAdapter,
  cacheAdapter
} from './netlify-cache-adapter';

// Configuration management
export {
  getCacheConfig,
  getCacheStrategy,
  calculateDynamicTtl,
  getCacheKeyPrefix,
  getCacheWarmingConfig,
  CACHE_INVALIDATION_PATTERNS,
  CACHE_CONFIG
} from './cache-config';

// Metrics and telemetry integration
export {
  CacheMetricsService,
  cacheMetrics,
  instrumentedCacheAdapter
} from './cache-metrics';

// Re-export telemetry interfaces for convenience
export type {
  CachePerformanceEvent,
  CacheStatsEvent
} from '../telemetry';

/**
 * Quick start guide for cache integration:
 * 
 * 1. Basic usage:
 *    ```typescript
 *    import { cacheAdapter } from '@/lib/cache';
 *    
 *    const key = cacheAdapter.generateKey({
 *      prompt: 'A beautiful sunset',
 *      contentType: 'video',
 *      parameters: { duration: 10 }
 *    });
 *    
 *    const cached = await cacheAdapter.get(key);
 *    if (!cached) {
 *      const result = await generateVideo();
 *      await cacheAdapter.set(key, result, { 
 *        contentType: 'video',
 *        provider: 'longcat'
 *      });
 *    }
 *    ```
 * 
 * 2. With metrics (recommended):
 *    ```typescript
 *    import { instrumentedCacheAdapter } from '@/lib/cache';
 *    
 *    // Use instrumentedCacheAdapter instead for automatic telemetry
 *    const cached = await instrumentedCacheAdapter.get(key);
 *    ```
 * 
 * 3. Provider integration:
 *    ```typescript
 *    import { selectVideoProvider } from '@/lib/providers/provider-selector';
 *    
 *    // Provider selector automatically checks cache and stores results
 *    const selection = await selectVideoProvider(
 *      prompt, duration, mode, priority, userTier, userId
 *    );
 *    
 *    if (selection.cacheStatus === 'hit') {
 *      // Cached result available
 *    }
 *    ```
 * 
 * 4. Configuration:
 *    ```typescript
 *    import { getCacheConfig, getCacheStrategy } from '@/lib/cache';
 *    
 *    const config = getCacheConfig(); // Environment-specific config
 *    const strategy = getCacheStrategy('enterprise', 'video', 'production');
 *    ```
 * 
 * 5. Health monitoring:
 *    ```typescript
 *    import { cacheMetrics } from '@/lib/cache';
 *    
 *    const report = await cacheMetrics.generatePerformanceReport();
 *    console.log('Cache recommendations:', report.recommendations);
 *    ```
 */