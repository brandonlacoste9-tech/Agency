/**
 * Simple telemetry utility for tracking video generation events
 * Fire-and-forget approach to avoid blocking request processing
 * Includes cache performance tracking for optimization insights
 */

export interface TelemetryEvent {
  event: string;
  properties: Record<string, any>;
  timestamp?: number;
}

export interface VideoGenerationRequestEvent {
  requestId: string;
  provider: 'longcat' | 'sora';
  prompt_length: number;
  duration?: number;
  model?: string;
  quality?: string;
  aspectRatio?: string;
}

export interface VideoGenerationResultEvent {
  requestId: string;
  provider: 'longcat' | 'sora';
  status: string;
  latency_ms: number;
  error?: string;
}

export interface CachePerformanceEvent {
  requestId: string;
  cacheKey: string;
  contentType: 'video' | 'image' | 'text' | '3d' | 'metadata';
  operation: 'hit' | 'miss' | 'set' | 'delete' | 'cleanup' | 'invalidate';
  latency_ms: number;
  sizeBytes?: number;
  ttl?: number;
  provider?: string;
  userTier?: 'free' | 'pro' | 'enterprise';
  mode?: 'preview' | 'production';
  error?: string;
}

export interface CacheStatsEvent {
  totalEntries: number;
  totalSizeBytes: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  totalEvictions: number;
  entriesByType: Record<string, number>;
  averageAgeSeconds: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  reportedAt: number;
}

class TelemetryClient {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.ENABLE_TELEMETRY !== 'false';
  }

  /**
   * Track an event - fire and forget, never throw
   */
  track(event: string, properties: Record<string, any>): void {
    if (!this.isEnabled) return;

    // Fire and forget - don't await this
    this.sendEvent({
      event,
      properties,
      timestamp: Date.now()
    }).catch((error) => {
      // Silent fail - telemetry should never break the app
      if (process.env.DEBUG_TELEMETRY === 'true') {
        console.warn('Telemetry error:', error);
      }
    });
  }

  /**
   * Track video generation request
   */
  trackVideoRequest(data: VideoGenerationRequestEvent): void {
    this.track('video_generation_request', data);
  }

  /**
   * Track video generation result
   */
  trackVideoResult(data: VideoGenerationResultEvent): void {
    this.track('video_generation_result', data);
  }

  /**
   * Track cache performance event
   */
  trackCachePerformance(data: CachePerformanceEvent): void {
    this.track('cache_performance', data);
  }

  /**
   * Track cache statistics snapshot
   */
  trackCacheStats(data: CacheStatsEvent): void {
    this.track('cache_stats', data);
  }

  /**
   * Track cache hit with timing
   */
  trackCacheHit(requestId: string, cacheKey: string, contentType: string, latency: number, options: {
    provider?: string;
    userTier?: 'free' | 'pro' | 'enterprise';
    mode?: 'preview' | 'production';
    sizeBytes?: number;
  } = {}): void {
    this.trackCachePerformance({
      requestId,
      cacheKey,
      contentType: contentType as any,
      operation: 'hit',
      latency_ms: latency,
      ...options
    });
  }

  /**
   * Track cache miss with provider fallback info
   */
  trackCacheMiss(requestId: string, cacheKey: string, contentType: string, latency: number, options: {
    provider?: string;
    userTier?: 'free' | 'pro' | 'enterprise';
    mode?: 'preview' | 'production';
    reason?: string;
  } = {}): void {
    this.trackCachePerformance({
      requestId,
      cacheKey,
      contentType: contentType as any,
      operation: 'miss',
      latency_ms: latency,
      error: options.reason,
      provider: options.provider,
      userTier: options.userTier,
      mode: options.mode
    });
  }

  /**
   * Track cache storage operations
   */
  trackCacheSet(requestId: string, cacheKey: string, contentType: string, latency: number, options: {
    sizeBytes?: number;
    ttl?: number;
    provider?: string;
    userTier?: 'free' | 'pro' | 'enterprise';
    mode?: 'preview' | 'production';
  } = {}): void {
    this.trackCachePerformance({
      requestId,
      cacheKey,
      contentType: contentType as any,
      operation: 'set',
      latency_ms: latency,
      ...options
    });
  }

  /**
   * Send event to telemetry backend
   * Override this method to integrate with your telemetry service
   */
  private async sendEvent(event: TelemetryEvent): Promise<void> {
    // Default implementation: log to console in debug mode
    if (process.env.DEBUG_TELEMETRY === 'true') {
      console.log('📊 Telemetry:', JSON.stringify(event, null, 2));
    }

    // Send to external telemetry endpoint if configured
    const endpoint = process.env.TELEMETRY_ENDPOINT;
    const apiKey = process.env.TELEMETRY_API_KEY;

    if (endpoint) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
          },
          body: JSON.stringify(event),
          // 5 second timeout for telemetry
          signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
          throw new Error(`Telemetry endpoint returned ${response.status}`);
        }
      } catch (error) {
        // Silent fail - telemetry should never break the app
        if (process.env.DEBUG_TELEMETRY === 'true') {
          console.warn('Telemetry endpoint error:', error);
        }
      }
    }

    // TODO: Add other integrations as needed:
    
    // Supabase:
    // await supabase.from('telemetry_events').insert(event);
    
    // Datadog:
    // await datadog.increment('video_generation.requests', 1, {
    //   provider: event.properties.provider,
    //   status: event.properties.status
    // });
    
    // Sentry:
    // Sentry.addBreadcrumb({
    //   message: event.event,
    //   data: event.properties,
    //   timestamp: event.timestamp
    // });
  }
}

// Export singleton instance
export const telemetry = new TelemetryClient();

/**
 * Utility to generate correlation IDs for request tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}