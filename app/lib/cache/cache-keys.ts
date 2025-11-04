/**
 * Cache Key Utilities
 * 
 * Simplified, optimized cache key generation for specific content types.
 * Provides consistent hashing with minimal overhead.
 */

import { createHash } from 'crypto';

/**
 * Generate SHA-256 hex hash from string input
 */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Generate cache key for video content
 */
export function cacheKeyForVideo(
  prompt: string, 
  options: {
    duration?: number;
    aspectRatio?: string;
    quality?: string;
    model?: string;
    style?: string;
    userTier?: string;
  } = {}
): string {
  // Normalize and sort options for consistent hashing
  const normalized = {
    prompt: prompt.trim().toLowerCase(),
    duration: options.duration || 10,
    aspectRatio: options.aspectRatio || '16:9',
    quality: options.quality || 'standard',
    model: options.model || 'default',
    style: options.style || 'default',
    userTier: options.userTier || 'free'
  };

  const payload = JSON.stringify(normalized);
  const hash = sha256Hex(payload);
  
  // Use prefix for easy identification and 8-char short hash for readability
  return `video_${hash.substring(0, 8)}_${hash}`;
}

/**
 * Generate cache key for image content
 */
export function cacheKeyForImage(
  prompt: string,
  options: {
    style?: string;
    aspectRatio?: string;
    quality?: string;
    model?: string;
    userTier?: string;
  } = {}
): string {
  const normalized = {
    prompt: prompt.trim().toLowerCase(),
    style: options.style || 'default',
    aspectRatio: options.aspectRatio || '1:1',
    quality: options.quality || 'standard',
    model: options.model || 'default',
    userTier: options.userTier || 'free'
  };

  const payload = JSON.stringify(normalized);
  const hash = sha256Hex(payload);
  
  return `image_${hash.substring(0, 8)}_${hash}`;
}

/**
 * Generate cache key for text content
 */
export function cacheKeyForText(
  prompt: string,
  options: {
    maxLength?: number;
    style?: string;
    model?: string;
    userTier?: string;
  } = {}
): string {
  const normalized = {
    prompt: prompt.trim().toLowerCase(),
    maxLength: options.maxLength || 1000,
    style: options.style || 'default',
    model: options.model || 'default',
    userTier: options.userTier || 'free'
  };

  const payload = JSON.stringify(normalized);
  const hash = sha256Hex(payload);
  
  return `text_${hash.substring(0, 8)}_${hash}`;
}

/**
 * Generate cache key for 3D content
 */
export function cacheKeyFor3D(
  prompt: string,
  options: {
    format?: string;
    quality?: string;
    model?: string;
    userTier?: string;
  } = {}
): string {
  const normalized = {
    prompt: prompt.trim().toLowerCase(),
    format: options.format || 'obj',
    quality: options.quality || 'standard',
    model: options.model || 'default',
    userTier: options.userTier || 'free'
  };

  const payload = JSON.stringify(normalized);
  const hash = sha256Hex(payload);
  
  return `3d_${hash.substring(0, 8)}_${hash}`;
}

/**
 * Generate cache key for provider selection metadata
 */
export function cacheKeyForProviderSelection(
  contentType: string,
  criteria: {
    mode?: string;
    priority?: string;
    duration?: number;
    budget?: number;
    userTier?: string;
  }
): string {
  const normalized = {
    contentType,
    mode: criteria.mode || 'production',
    priority: criteria.priority || 'quality',
    duration: criteria.duration,
    budget: criteria.budget,
    userTier: criteria.userTier || 'free'
  };

  const payload = JSON.stringify(normalized);
  const hash = sha256Hex(payload);
  
  return `provider_${hash.substring(0, 8)}_${hash}`;
}

/**
 * Extract content type from cache key
 */
export function getContentTypeFromKey(key: string): string | null {
  const match = key.match(/^(video|image|text|3d|provider)_/);
  return match ? match[1] : null;
}

/**
 * Validate cache key format
 */
export function isValidCacheKey(key: string): boolean {
  // Check format: type_shortHash_fullHash
  const pattern = /^(video|image|text|3d|provider)_[a-f0-9]{8}_[a-f0-9]{64}$/;
  return pattern.test(key);
}

/**
 * Generate cache key with custom parameters (fallback)
 */
export function cacheKeyForCustom(
  type: string,
  params: Record<string, any>
): string {
  // Sort keys for consistent hashing
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {} as Record<string, any>);

  const payload = JSON.stringify({ type, ...sortedParams });
  const hash = sha256Hex(payload);
  
  return `${type}_${hash.substring(0, 8)}_${hash}`;
}