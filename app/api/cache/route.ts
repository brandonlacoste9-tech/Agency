/**
 * Cache Management API
 * 
 * Provides endpoints for cache operations, monitoring, and invalidation.
 * Secured with API key authentication for production use.
 */

import { NextRequest } from "next/server";
import { cacheAdapter } from "@/lib/cache/netlify-cache-adapter";
import { localCacheAdapter } from "@/lib/cache/local-cache-adapter";
import { telemetry, generateRequestId } from "@/lib/telemetry";

export const runtime = "nodejs";

// Use local cache for development, Netlify cache for production
const cache = process.env.NODE_ENV === 'development' ? localCacheAdapter : cacheAdapter;

/**
 * POST /api/cache/invalidate
 * Invalidate cache entries by pattern or metadata
 */
export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Check authentication
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.CACHE_API_KEY || process.env.ADMIN_API_KEY;
    
    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { pattern, metadata, contentType, provider, userTier } = body;

    // Validate input
    if (!pattern && !metadata && !contentType && !provider && !userTier) {
      return Response.json(
        { error: "At least one filter parameter is required" },
        { status: 400 }
      );
    }

    let invalidatedCount = 0;

    // Invalidate by pattern
    if (pattern) {
      invalidatedCount += await cache.invalidate(pattern);
    }

    // Invalidate by metadata
    if (metadata || contentType || provider || userTier) {
      const metadataFilter: Record<string, any> = {};
      if (metadata) Object.assign(metadataFilter, metadata);
      if (contentType) metadataFilter.contentType = contentType;
      if (provider) metadataFilter.provider = provider;
      if (userTier) metadataFilter.userTier = userTier;
      
      invalidatedCount += await cache.invalidate(undefined, metadataFilter);
    }

    const latency = Date.now() - startTime;

    // Track invalidation
    telemetry.track('cache_invalidation', {
      requestId,
      pattern,
      metadata,
      invalidated_count: invalidatedCount,
      latency_ms: latency
    });

    return Response.json({
      success: true,
      invalidatedCount,
      latency_ms: latency,
      requestId
    });

  } catch (error) {
    const latency = Date.now() - startTime;
    
    telemetry.track('cache_invalidation_error', {
      requestId,
      error: (error as Error).message,
      latency_ms: latency
    });

    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cache/stats
 * Get cache statistics and health information
 */
export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Check authentication for stats endpoint
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.CACHE_API_KEY || process.env.ADMIN_API_KEY;
    
    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [stats, health] = await Promise.all([
      cache.getStats(),
      cache.healthCheck()
    ]);

    const latency = Date.now() - startTime;

    // Track stats request
    telemetry.track('cache_stats_request', {
      requestId,
      latency_ms: latency,
      cache_healthy: health.healthy
    });

    return Response.json({
      success: true,
      stats,
      health,
      latency_ms: latency,
      requestId,
      timestamp: Date.now()
    });

  } catch (error) {
    const latency = Date.now() - startTime;
    
    telemetry.track('cache_stats_error', {
      requestId,
      error: (error as Error).message,
      latency_ms: latency
    });

    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cache/clear
 * Clear all cache entries (use with extreme caution)
 */
export async function DELETE(req: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // Check authentication and admin privileges
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.ADMIN_API_KEY; // Only admin can clear all cache
    
    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      return Response.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Require confirmation parameter
    const url = new URL(req.url);
    const confirm = url.searchParams.get('confirm');
    
    if (confirm !== 'yes-clear-all-cache') {
      return Response.json(
        { 
          error: "Confirmation required",
          hint: "Add ?confirm=yes-clear-all-cache to URL"
        },
        { status: 400 }
      );
    }

    await cache.clear();
    const latency = Date.now() - startTime;

    // Track cache clear (important for audit)
    telemetry.track('cache_clear_all', {
      requestId,
      latency_ms: latency,
      timestamp: Date.now(),
      admin_action: true
    });

    return Response.json({
      success: true,
      message: "All cache entries cleared",
      latency_ms: latency,
      requestId,
      timestamp: Date.now()
    });

  } catch (error) {
    const latency = Date.now() - startTime;
    
    telemetry.track('cache_clear_error', {
      requestId,
      error: (error as Error).message,
      latency_ms: latency
    });

    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}