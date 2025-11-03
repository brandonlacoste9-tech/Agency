/**
 * Cache Metrics Integration
 * 
 * Provides telemetry integration for cache operations with automatic
 * performance tracking, stats reporting, and health monitoring
 */

import { telemetry } from '../telemetry';
import { CacheAdapter, CacheStats } from './cache-adapter';
import { cacheAdapter } from './netlify-cache-adapter';

export class CacheMetricsService {
  private adapter: CacheAdapter;
  private statsInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(cacheAdapter: CacheAdapter) {
    this.adapter = cacheAdapter;
  }

  /**
   * Start automated metrics collection
   */
  startMetricsCollection(options: {
    statsInterval?: number; // milliseconds
    healthCheckInterval?: number; // milliseconds
  } = {}): void {
    const {
      statsInterval = 5 * 60 * 1000, // 5 minutes
      healthCheckInterval = 60 * 1000 // 1 minute
    } = options;

    // Periodic stats reporting
    this.statsInterval = setInterval(async () => {
      try {
        await this.reportCacheStats();
      } catch (error) {
        console.warn('Failed to report cache stats:', error);
      }
    }, statsInterval);

    // Periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.reportHealthStatus();
      } catch (error) {
        console.warn('Failed to report cache health:', error);
      }
    }, healthCheckInterval);
  }

  /**
   * Stop automated metrics collection
   */
  stopMetricsCollection(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = undefined;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Report current cache statistics
   */
  async reportCacheStats(): Promise<void> {
    try {
      const stats = await this.adapter.getStats();
      const health = await this.adapter.healthCheck();

      telemetry.trackCacheStats({
        ...stats,
        healthStatus: health.healthy ? 'healthy' : 'unhealthy',
        reportedAt: Date.now()
      });
    } catch (error) {
      telemetry.trackCacheStats({
        totalEntries: 0,
        totalSizeBytes: 0,
        hitRate: 0,
        totalHits: 0,
        totalMisses: 0,
        totalEvictions: 0,
        entriesByType: {},
        averageAgeSeconds: 0,
        healthStatus: 'unhealthy',
        reportedAt: Date.now()
      });
    }
  }

  /**
   * Report cache health status
   */
  async reportHealthStatus(): Promise<void> {
    const startTime = Date.now();

    try {
      const health = await this.adapter.healthCheck();
      
      telemetry.track('cache_health_check', {
        healthy: health.healthy,
        latency_ms: health.latency,
        error: health.error,
        timestamp: startTime
      });
    } catch (error) {
      telemetry.track('cache_health_check', {
        healthy: false,
        latency_ms: Date.now() - startTime,
        error: (error as Error).message,
        timestamp: startTime
      });
    }
  }

  /**
   * Wrap cache operations with telemetry tracking
   */
  createInstrumentedAdapter(): CacheAdapter {
    const originalAdapter = this.adapter;
    const metricsService = this;

    return {
      generateKey: originalAdapter.generateKey.bind(originalAdapter),

      async get<T = any>(key: string): Promise<any> {
        const startTime = Date.now();
        const requestId = `cache_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        try {
          const result = await originalAdapter.get<T>(key);
          const latency = Date.now() - startTime;

          if (result) {
            telemetry.trackCacheHit(requestId, key, result.contentType, latency, {
              provider: result.provider,
              sizeBytes: result.sizeBytes
            });
          } else {
            telemetry.trackCacheMiss(requestId, key, 'unknown', latency, {
              reason: 'not_found'
            });
          }

          return result;
        } catch (error) {
          const latency = Date.now() - startTime;
          telemetry.trackCacheMiss(requestId, key, 'unknown', latency, {
            reason: (error as Error).message
          });
          throw error;
        }
      },

      async set<T = any>(key: string, value: T, options: any = {}): Promise<void> {
        const startTime = Date.now();
        const requestId = `cache_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        try {
          await originalAdapter.set(key, value, options);
          const latency = Date.now() - startTime;

          telemetry.trackCacheSet(requestId, key, options.contentType || 'unknown', latency, {
            sizeBytes: options.sizeBytes,
            ttl: options.ttl,
            provider: options.provider,
            userTier: options.metadata?.userTier,
            mode: options.metadata?.mode
          });
        } catch (error) {
          const latency = Date.now() - startTime;
          telemetry.trackCachePerformance({
            requestId,
            cacheKey: key,
            contentType: options.contentType || 'unknown',
            operation: 'set',
            latency_ms: latency,
            error: (error as Error).message
          });
          throw error;
        }
      },

      async exists(key: string): Promise<boolean> {
        return originalAdapter.exists(key);
      },

      async delete(key: string): Promise<boolean> {
        const startTime = Date.now();
        const requestId = `cache_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        try {
          const result = await originalAdapter.delete(key);
          const latency = Date.now() - startTime;

          telemetry.trackCachePerformance({
            requestId,
            cacheKey: key,
            contentType: 'metadata',
            operation: 'delete',
            latency_ms: latency
          });

          return result;
        } catch (error) {
          telemetry.trackCachePerformance({
            requestId,
            cacheKey: key,
            contentType: 'metadata',
            operation: 'delete',
            latency_ms: Date.now() - startTime,
            error: (error as Error).message
          });
          throw error;
        }
      },

      async clear(): Promise<void> {
        const startTime = Date.now();
        const requestId = `cache_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        try {
          await originalAdapter.clear();
          
          telemetry.track('cache_clear', {
            requestId,
            latency_ms: Date.now() - startTime,
            timestamp: startTime
          });
        } catch (error) {
          telemetry.track('cache_clear', {
            requestId,
            latency_ms: Date.now() - startTime,
            error: (error as Error).message,
            timestamp: startTime
          });
          throw error;
        }
      },

      async getStats(): Promise<CacheStats> {
        return originalAdapter.getStats();
      },

      async cleanup(): Promise<number> {
        const startTime = Date.now();
        const requestId = `cache_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        try {
          const cleanedCount = await originalAdapter.cleanup();
          
          telemetry.trackCachePerformance({
            requestId,
            cacheKey: 'cleanup_operation',
            contentType: 'metadata',
            operation: 'cleanup',
            latency_ms: Date.now() - startTime,
            sizeBytes: cleanedCount
          });

          return cleanedCount;
        } catch (error) {
          telemetry.trackCachePerformance({
            requestId,
            cacheKey: 'cleanup_operation',
            contentType: 'metadata',
            operation: 'cleanup',
            latency_ms: Date.now() - startTime,
            error: (error as Error).message
          });
          throw error;
        }
      },

      async warmCache(predictions: any[]): Promise<void> {
        const startTime = Date.now();
        
        try {
          await originalAdapter.warmCache(predictions);
          
          telemetry.track('cache_warm', {
            predictions_count: predictions.length,
            latency_ms: Date.now() - startTime,
            timestamp: startTime
          });
        } catch (error) {
          telemetry.track('cache_warm', {
            predictions_count: predictions.length,
            latency_ms: Date.now() - startTime,
            error: (error as Error).message,
            timestamp: startTime
          });
          throw error;
        }
      },

      async invalidate(pattern?: string, metadata?: Record<string, any>): Promise<number> {
        const startTime = Date.now();
        const requestId = `cache_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        try {
          const invalidatedCount = await originalAdapter.invalidate(pattern, metadata);
          
          telemetry.trackCachePerformance({
            requestId,
            cacheKey: pattern || 'pattern_invalidation',
            contentType: 'metadata',
            operation: 'invalidate',
            latency_ms: Date.now() - startTime,
            sizeBytes: invalidatedCount
          });

          return invalidatedCount;
        } catch (error) {
          telemetry.trackCachePerformance({
            requestId,
            cacheKey: pattern || 'pattern_invalidation',
            contentType: 'metadata',
            operation: 'invalidate',
            latency_ms: Date.now() - startTime,
            error: (error as Error).message
          });
          throw error;
        }
      },

      async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
        return originalAdapter.healthCheck();
      }
    };
  }

  /**
   * Generate cache performance report
   */
  async generatePerformanceReport(): Promise<{
    stats: CacheStats;
    health: { healthy: boolean; latency: number; error?: string };
    recommendations: string[];
  }> {
    const [stats, health] = await Promise.all([
      this.adapter.getStats(),
      this.adapter.healthCheck()
    ]);

    const recommendations: string[] = [];

    // Analyze hit rate
    if (stats.hitRate < 0.3) {
      recommendations.push('Cache hit rate is low (< 30%). Consider adjusting TTL or cache warming strategies.');
    } else if (stats.hitRate > 0.9) {
      recommendations.push('Excellent cache hit rate! Consider increasing cache size to maintain performance.');
    }

    // Analyze cache size
    if (stats.totalSizeBytes > 500 * 1024 * 1024) { // > 500MB
      recommendations.push('Cache size is large. Consider implementing more aggressive cleanup policies.');
    }

    // Analyze evictions
    if (stats.totalEvictions > stats.totalEntries * 0.5) {
      recommendations.push('High eviction rate detected. Consider increasing cache size or adjusting TTL.');
    }

    // Analyze health
    if (!health.healthy) {
      recommendations.push('Cache health check failed. Investigate storage backend issues.');
    } else if (health.latency > 100) {
      recommendations.push('Cache latency is high (> 100ms). Consider optimizing storage backend.');
    }

    // Analyze content distribution
    const totalContent = Object.values(stats.entriesByType).reduce((sum, count) => sum + count, 0);
    if (totalContent > 0) {
      const videoPercentage = (stats.entriesByType.video || 0) / totalContent;
      if (videoPercentage > 0.8) {
        recommendations.push('Cache is dominated by video content. Consider separate storage tiers for different content types.');
      }
    }

    return {
      stats,
      health,
      recommendations
    };
  }
}

// Export singleton instance with instrumentation
export const cacheMetrics = new CacheMetricsService(cacheAdapter);
export const instrumentedCacheAdapter = cacheMetrics.createInstrumentedAdapter();

// Auto-start metrics collection in production
if (process.env.NODE_ENV === 'production' && process.env.CACHE_METRICS_ENABLED !== 'false') {
  cacheMetrics.startMetricsCollection();
}