/**
 * Cache Adapter for AdGenXAI Platform
 * 
 * Provides hash-based caching for AI-generated content with support for:
 * - Video, image, text, and 3D content caching
 * - TTL-based expiration
 * - Size-aware storage management
 * - Netlify Blobs backend
 * - Cache warming and invalidation
 */

import { createHash } from 'crypto';

export interface CacheEntry<T = any> {
  /** Unique cache key (hash-based) */
  key: string;
  /** Cached content/data */
  value: T;
  /** Unix timestamp when entry was created */
  createdAt: number;
  /** Unix timestamp when entry expires */
  expiresAt: number;
  /** Size of cached content in bytes */
  sizeBytes: number;
  /** Content type for appropriate handling */
  contentType: 'video' | 'image' | 'text' | '3d' | 'metadata';
  /** Provider that generated this content */
  provider: string;
  /** Optional metadata */
  metadata?: Record<string, any>;
}

export interface CacheConfig {
  /** Default TTL in seconds */
  defaultTtl: number;
  /** Maximum size per entry in bytes */
  maxEntrySizeBytes: number;
  /** Maximum total cache size in bytes */
  maxCacheSizeBytes: number;
  /** Whether cache is enabled */
  enabled: boolean;
  /** TTL by content type */
  ttlByType: {
    video: number;
    image: number;
    text: number;
    '3d': number;
    metadata: number;
  };
  /** Compression settings */
  compression: {
    enabled: boolean;
    level: number; // 1-9
    types: string[]; // Content types to compress
  };
}

export interface CacheStats {
  /** Total number of entries */
  totalEntries: number;
  /** Total size in bytes */
  totalSizeBytes: number;
  /** Cache hit rate (0-1) */
  hitRate: number;
  /** Total hits since startup */
  totalHits: number;
  /** Total misses since startup */
  totalMisses: number;
  /** Total evictions due to size/TTL */
  totalEvictions: number;
  /** Entries by content type */
  entriesByType: Record<string, number>;
  /** Average entry age in seconds */
  averageAgeSeconds: number;
}

export interface CacheGenerationParams {
  /** Content prompt/input */
  prompt: string;
  /** Content type being generated */
  contentType: 'video' | 'image' | 'text' | '3d';
  /** Generation parameters (duration, quality, etc.) */
  parameters: Record<string, any>;
  /** User context (tier, preferences) */
  userContext?: {
    userId?: string;
    tier?: 'free' | 'pro' | 'enterprise';
    preferences?: Record<string, any>;
  };
}

export interface CacheAdapter {
  /**
   * Generate a deterministic cache key from generation parameters
   */
  generateKey(params: CacheGenerationParams): string;

  /**
   * Get cached content by key
   */
  get<T = any>(key: string): Promise<CacheEntry<T> | null>;

  /**
   * Store content in cache
   */
  set<T = any>(
    key: string, 
    value: T, 
    options?: {
      ttl?: number;
      contentType?: 'video' | 'image' | 'text' | '3d' | 'metadata';
      provider?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void>;

  /**
   * Check if key exists in cache
   */
  exists(key: string): Promise<boolean>;

  /**
   * Remove entry from cache
   */
  delete(key: string): Promise<boolean>;

  /**
   * Clear all cache entries (use with caution)
   */
  clear(): Promise<void>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;

  /**
   * Cleanup expired entries
   */
  cleanup(): Promise<number>; // Returns number of cleaned entries

  /**
   * Pre-warm cache with predicted content
   */
  warmCache(predictions: CacheGenerationParams[]): Promise<void>;

  /**
   * Invalidate cache entries by pattern or metadata
   */
  invalidate(pattern?: string, metadata?: Record<string, any>): Promise<number>;

  /**
   * Health check for cache backend
   */
  healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }>;
}

/**
 * Default cache configuration optimized for AI content generation
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTtl: 3600, // 1 hour
  maxEntrySizeBytes: 100 * 1024 * 1024, // 100MB per entry
  maxCacheSizeBytes: 1024 * 1024 * 1024, // 1GB total
  enabled: true,
  ttlByType: {
    video: 7200, // 2 hours (expensive to regenerate)
    image: 3600, // 1 hour
    text: 1800, // 30 minutes (cheap to regenerate)
    '3d': 14400, // 4 hours (very expensive)
    metadata: 300 // 5 minutes (for quick lookups)
  },
  compression: {
    enabled: true,
    level: 6, // Balanced compression
    types: ['text', 'metadata'] // Don't compress binary content
  }
};

/**
 * Utility function to generate cache key from generation parameters
 * Creates a deterministic hash that accounts for all relevant parameters
 */
export function generateCacheKey(params: CacheGenerationParams): string {
  // Create a normalized object for hashing
  const normalized = {
    prompt: params.prompt.trim().toLowerCase(),
    contentType: params.contentType,
    parameters: sortObject(params.parameters),
    userTier: params.userContext?.tier || 'free'
  };

  // Create SHA-256 hash
  const hash = createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');

  // Create human-readable prefix
  const prefix = `${params.contentType}_${hash.substring(0, 8)}`;
  
  return `${prefix}_${hash}`;
}

/**
 * Recursively sort object keys for consistent hashing
 */
function sortObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  }

  const sorted: Record<string, any> = {};
  Object.keys(obj)
    .sort()
    .forEach(key => {
      sorted[key] = sortObject(obj[key]);
    });

  return sorted;
}

/**
 * Calculate size of data in bytes
 */
export function calculateSizeBytes(data: any): number {
  if (typeof data === 'string') {
    return Buffer.byteLength(data, 'utf8');
  }
  
  if (Buffer.isBuffer(data)) {
    return data.length;
  }
  
  if (data instanceof ArrayBuffer) {
    return data.byteLength;
  }
  
  // For objects, estimate JSON size
  return Buffer.byteLength(JSON.stringify(data), 'utf8');
}

/**
 * Check if TTL is still valid
 */
export function isExpired(entry: CacheEntry): boolean {
  return Date.now() > entry.expiresAt;
}

/**
 * Create cache entry with automatic expiration calculation
 */
export function createCacheEntry<T>(
  key: string,
  value: T,
  options: {
    ttl: number;
    contentType: CacheEntry['contentType'];
    provider: string;
    metadata?: Record<string, any>;
  }
): CacheEntry<T> {
  const now = Date.now();
  return {
    key,
    value,
    createdAt: now,
    expiresAt: now + (options.ttl * 1000),
    sizeBytes: calculateSizeBytes(value),
    contentType: options.contentType,
    provider: options.provider,
    metadata: options.metadata
  };
}

/**
 * Cache miss error for tracking and debugging
 */
export class CacheMissError extends Error {
  constructor(key: string, reason: 'not_found' | 'expired' | 'corrupted') {
    super(`Cache miss for key ${key}: ${reason}`);
    this.name = 'CacheMissError';
  }
}

/**
 * Cache storage error for backend issues
 */
export class CacheStorageError extends Error {
  public readonly cause?: Error;
  
  constructor(operation: string, cause: Error) {
    super(`Cache storage error during ${operation}: ${cause.message}`);
    this.name = 'CacheStorageError';
    this.cause = cause;
  }
}