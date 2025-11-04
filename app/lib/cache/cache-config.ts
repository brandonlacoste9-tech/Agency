/**
 * Cache Configuration for AdGenXAI Platform
 * 
 * Centralized configuration for cache behavior, TTLs, and size limits
 * with environment-specific overrides and runtime adjustments
 */

import { CacheConfig } from './cache-adapter';

/**
 * Environment-based cache configuration
 */
export function getCacheConfig(): CacheConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Base configuration
  const baseConfig: CacheConfig = {
    defaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '3600'), // 1 hour
    maxEntrySizeBytes: parseInt(process.env.CACHE_MAX_ENTRY_SIZE || '104857600'), // 100MB
    maxCacheSizeBytes: parseInt(process.env.CACHE_MAX_TOTAL_SIZE || '1073741824'), // 1GB
    enabled: process.env.CACHE_ENABLED !== 'false', // Enabled by default
    ttlByType: {
      video: parseInt(process.env.CACHE_TTL_VIDEO || '7200'), // 2 hours
      image: parseInt(process.env.CACHE_TTL_IMAGE || '3600'), // 1 hour
      text: parseInt(process.env.CACHE_TTL_TEXT || '1800'), // 30 minutes
      '3d': parseInt(process.env.CACHE_TTL_3D || '14400'), // 4 hours
      metadata: parseInt(process.env.CACHE_TTL_METADATA || '300') // 5 minutes
    },
    compression: {
      enabled: process.env.CACHE_COMPRESSION_ENABLED !== 'false',
      level: parseInt(process.env.CACHE_COMPRESSION_LEVEL || '6'),
      types: (process.env.CACHE_COMPRESSION_TYPES || 'text,metadata').split(',')
    }
  };

  // Environment-specific overrides
  if (isDevelopment) {
    return {
      ...baseConfig,
      // Shorter TTLs for development
      defaultTtl: 300, // 5 minutes
      ttlByType: {
        video: 600, // 10 minutes
        image: 300, // 5 minutes
        text: 120, // 2 minutes
        '3d': 900, // 15 minutes
        metadata: 60 // 1 minute
      },
      // Smaller cache for development
      maxCacheSizeBytes: 100 * 1024 * 1024, // 100MB
      // Disable compression for faster development
      compression: {
        ...baseConfig.compression,
        enabled: false
      }
    };
  }

  if (isProduction) {
    return {
      ...baseConfig,
      // Longer TTLs for production cost savings
      ttlByType: {
        video: 14400, // 4 hours
        image: 7200, // 2 hours
        text: 3600, // 1 hour
        '3d': 28800, // 8 hours
        metadata: 600 // 10 minutes
      },
      // Larger cache for production
      maxCacheSizeBytes: 2 * 1024 * 1024 * 1024, // 2GB
      // Enable aggressive compression
      compression: {
        enabled: true,
        level: 9, // Maximum compression
        types: ['text', 'metadata', 'image'] // Compress more types
      }
    };
  }

  return baseConfig;
}

/**
 * Cache strategy configuration based on user tier and content type
 */
export interface CacheStrategy {
  enabled: boolean;
  ttlMultiplier: number; // Multiply base TTL
  priorityLevel: 'low' | 'medium' | 'high';
  maxSizeOverride?: number;
}

export function getCacheStrategy(
  userTier: 'free' | 'pro' | 'enterprise',
  contentType: 'video' | 'image' | 'text' | '3d',
  mode: 'preview' | 'production'
): CacheStrategy {
  
  // Free tier: Limited caching, shorter TTLs
  if (userTier === 'free') {
    return {
      enabled: true,
      ttlMultiplier: mode === 'preview' ? 0.5 : 0.7, // Shorter TTLs
      priorityLevel: 'low',
      maxSizeOverride: contentType === 'video' ? 50 * 1024 * 1024 : undefined // 50MB for videos
    };
  }

  // Pro tier: Standard caching
  if (userTier === 'pro') {
    return {
      enabled: true,
      ttlMultiplier: mode === 'preview' ? 0.8 : 1.0, // Slightly shorter for previews
      priorityLevel: 'medium'
    };
  }

  // Enterprise tier: Extended caching for cost efficiency
  if (userTier === 'enterprise') {
    return {
      enabled: true,
      ttlMultiplier: mode === 'preview' ? 1.0 : 1.5, // Longer TTLs for production
      priorityLevel: 'high'
    };
  }

  // Default fallback
  return {
    enabled: true,
    ttlMultiplier: 1.0,
    priorityLevel: 'medium'
  };
}

/**
 * Dynamic TTL calculation based on content characteristics
 */
export function calculateDynamicTtl(
  baseConfig: CacheConfig,
  contentType: 'video' | 'image' | 'text' | '3d',
  options: {
    duration?: number; // For video content
    complexity?: 'simple' | 'medium' | 'complex'; // Content complexity
    userTier?: 'free' | 'pro' | 'enterprise';
    mode?: 'preview' | 'production';
    estimatedCost?: number; // Higher cost = longer TTL
  } = {}
): number {
  
  const baseTtl = baseConfig.ttlByType[contentType];
  const strategy = getCacheStrategy(
    options.userTier || 'free',
    contentType,
    options.mode || 'production'
  );

  let ttl = baseTtl * strategy.ttlMultiplier;

  // Adjust based on content complexity (more complex = longer TTL)
  if (options.complexity === 'complex') {
    ttl *= 1.5;
  } else if (options.complexity === 'simple') {
    ttl *= 0.7;
  }

  // Adjust based on estimated cost (higher cost = longer TTL)
  if (options.estimatedCost) {
    if (options.estimatedCost > 1.0) { // Expensive generation
      ttl *= 2.0;
    } else if (options.estimatedCost > 0.5) {
      ttl *= 1.3;
    }
  }

  // Video-specific adjustments
  if (contentType === 'video' && options.duration) {
    // Longer videos get longer TTL (more expensive to regenerate)
    const durationMultiplier = Math.min(2.0, 1 + (options.duration / 60)); // Max 2x for 60+ seconds
    ttl *= durationMultiplier;
  }

  // Ensure minimum and maximum bounds
  const minTtl = 60; // 1 minute minimum
  const maxTtl = 86400; // 24 hours maximum

  return Math.max(minTtl, Math.min(maxTtl, Math.round(ttl)));
}

/**
 * Cache key prefixes for different content types and environments
 */
export function getCacheKeyPrefix(
  contentType: 'video' | 'image' | 'text' | '3d',
  environment: string = process.env.NODE_ENV || 'development'
): string {
  return `${environment}_${contentType}_v1_`;
}

/**
 * Cache invalidation patterns for different scenarios
 */
export const CACHE_INVALIDATION_PATTERNS = {
  // Invalidate all video content for a provider
  PROVIDER_VIDEO: (provider: string) => `video_.*_${provider}`,
  
  // Invalidate all content for a user
  USER_CONTENT: (userId: string) => `.*_user_${userId}_.*`,
  
  // Invalidate all preview content
  PREVIEW_CONTENT: 'preview_.*',
  
  // Invalidate by model version
  MODEL_VERSION: (model: string, version: string) => `.*_${model}_${version}_.*`,
  
  // Invalidate expired entries (handled automatically)
  EXPIRED: 'expired',
  
  // Emergency invalidation (all cache)
  EMERGENCY: '.*'
} as const;

/**
 * Cache warming predictions based on usage patterns
 */
export interface CacheWarmingConfig {
  enabled: boolean;
  maxPredictions: number;
  warmingInterval: number; // milliseconds
  popularPrompts: string[];
  commonDurations: number[];
  popularStyles: string[];
}

export function getCacheWarmingConfig(): CacheWarmingConfig {
  return {
    enabled: process.env.CACHE_WARMING_ENABLED === 'true',
    maxPredictions: parseInt(process.env.CACHE_WARMING_MAX_PREDICTIONS || '10'),
    warmingInterval: parseInt(process.env.CACHE_WARMING_INTERVAL || '3600000'), // 1 hour
    popularPrompts: [
      'A beautiful sunset over mountains',
      'Person walking in a city',
      'Abstract colorful patterns',
      'Nature scene with flowing water'
    ],
    commonDurations: [5, 10, 15, 30], // seconds
    popularStyles: ['cinematic', 'realistic', 'artistic', 'abstract']
  };
}

/**
 * Export the default cache configuration
 */
export const CACHE_CONFIG = getCacheConfig();