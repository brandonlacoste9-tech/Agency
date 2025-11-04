/**
 * Cache Adapter Test Suite
 * 
 * Comprehensive tests for cache functionality including:
 * - Basic operations (get, set, delete)
 * - TTL behavior and expiration
 * - Hash generation consistency
 * - Size limits and eviction
 * - Cache configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  generateCacheKey, 
  calculateSizeBytes, 
  isExpired, 
  createCacheEntry,
  CacheGenerationParams,
  CacheEntry,
  DEFAULT_CACHE_CONFIG
} from '../cache-adapter';
import { NetlifyCacheAdapter } from '../netlify-cache-adapter';
import { getCacheConfig, getCacheStrategy, calculateDynamicTtl } from '../cache-config';

// Mock Netlify Blobs
const mockStore = {
  get: vi.fn(),
  set: vi.fn(),
  getMetadata: vi.fn(),
  setMetadata: vi.fn(),
  delete: vi.fn(),
  list: vi.fn()
};

vi.mock('@netlify/blobs', () => ({
  getStore: () => mockStore
}));

describe('Cache Key Generation', () => {
  it('should generate consistent cache keys for identical parameters', () => {
    const params: CacheGenerationParams = {
      prompt: 'A beautiful sunset',
      contentType: 'video',
      parameters: { duration: 10, quality: 'high' },
      userContext: { tier: 'pro' }
    };

    const key1 = generateCacheKey(params);
    const key2 = generateCacheKey(params);

    expect(key1).toBe(key2);
    expect(key1).toContain('video_');
    expect(key1).toHaveLength(72); // video_ + 8 chars + _ + 64 char hash
  });

  it('should generate different keys for different prompts', () => {
    const params1: CacheGenerationParams = {
      prompt: 'A beautiful sunset',
      contentType: 'video',
      parameters: { duration: 10 }
    };

    const params2: CacheGenerationParams = {
      prompt: 'A stormy ocean',
      contentType: 'video',
      parameters: { duration: 10 }
    };

    const key1 = generateCacheKey(params1);
    const key2 = generateCacheKey(params2);

    expect(key1).not.toBe(key2);
  });

  it('should normalize prompts for consistent hashing', () => {
    const params1: CacheGenerationParams = {
      prompt: '  A Beautiful Sunset  ',
      contentType: 'video',
      parameters: { duration: 10 }
    };

    const params2: CacheGenerationParams = {
      prompt: 'a beautiful sunset',
      contentType: 'video',
      parameters: { duration: 10 }
    };

    const key1 = generateCacheKey(params1);
    const key2 = generateCacheKey(params2);

    expect(key1).toBe(key2);
  });

  it('should account for parameter order independence', () => {
    const params1: CacheGenerationParams = {
      prompt: 'test',
      contentType: 'video',
      parameters: { duration: 10, quality: 'high', style: 'cinematic' }
    };

    const params2: CacheGenerationParams = {
      prompt: 'test',
      contentType: 'video',
      parameters: { style: 'cinematic', quality: 'high', duration: 10 }
    };

    const key1 = generateCacheKey(params1);
    const key2 = generateCacheKey(params2);

    expect(key1).toBe(key2);
  });
});

describe('Cache Entry Management', () => {
  it('should calculate size correctly for different data types', () => {
    expect(calculateSizeBytes('hello')).toBe(5);
    expect(calculateSizeBytes({ key: 'value' })).toBeGreaterThan(10);
    expect(calculateSizeBytes(Buffer.from('test'))).toBe(4);
  });

  it('should create cache entries with correct expiration', () => {
    const now = Date.now();
    const ttl = 3600; // 1 hour

    const entry = createCacheEntry('test-key', { data: 'test' }, {
      ttl,
      contentType: 'video',
      provider: 'longcat'
    });

    expect(entry.key).toBe('test-key');
    expect(entry.createdAt).toBeCloseTo(now, -2); // Within 100ms
    expect(entry.expiresAt).toBeCloseTo(now + (ttl * 1000), -2);
    expect(entry.contentType).toBe('video');
    expect(entry.provider).toBe('longcat');
    expect(entry.sizeBytes).toBeGreaterThan(0);
  });

  it('should correctly identify expired entries', () => {
    const expiredEntry: CacheEntry = {
      key: 'test',
      value: 'data',
      createdAt: Date.now() - 7200000, // 2 hours ago
      expiresAt: Date.now() - 3600000, // 1 hour ago
      sizeBytes: 100,
      contentType: 'video',
      provider: 'test'
    };

    const validEntry: CacheEntry = {
      key: 'test',
      value: 'data',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour from now
      sizeBytes: 100,
      contentType: 'video',
      provider: 'test'
    };

    expect(isExpired(expiredEntry)).toBe(true);
    expect(isExpired(validEntry)).toBe(false);
  });
});

describe('NetlifyCacheAdapter', () => {
  let adapter: NetlifyCacheAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new NetlifyCacheAdapter({
      enabled: true,
      defaultTtl: 3600,
      maxEntrySizeBytes: 1024 * 1024, // 1MB
      maxCacheSizeBytes: 10 * 1024 * 1024, // 10MB
      ttlByType: {
        video: 7200,
        image: 3600,
        text: 1800,
        '3d': 14400,
        metadata: 300
      },
      compression: {
        enabled: true,
        level: 6,
        types: ['text', 'metadata']
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values', async () => {
      const testData = { message: 'Hello, World!' };
      const key = 'test-key';

      // Mock successful storage
      mockStore.set.mockResolvedValue(undefined);
      mockStore.get.mockResolvedValue(JSON.stringify({
        key,
        value: testData,
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        sizeBytes: 100,
        contentType: 'metadata',
        provider: 'test'
      }));
      mockStore.getMetadata.mockResolvedValue({
        contentType: 'metadata',
        provider: 'test',
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        compressed: false
      });

      await adapter.set(key, testData, {
        contentType: 'metadata',
        provider: 'test'
      });

      const retrieved = await adapter.get(key);

      expect(retrieved).toBeTruthy();
      expect(retrieved!.value).toEqual(testData);
      expect(retrieved!.provider).toBe('test');
    });

    it('should return null for non-existent keys', async () => {
      mockStore.get.mockResolvedValue(null);
      mockStore.getMetadata.mockResolvedValue(null);

      const result = await adapter.get('non-existent-key');
      
      expect(result).toBeNull();
    });

    it('should handle cache misses for expired entries', async () => {
      const expiredTime = Date.now() - 3600000; // 1 hour ago
      
      mockStore.get.mockResolvedValue(JSON.stringify({
        key: 'expired-key',
        value: 'data',
        createdAt: expiredTime - 3600000,
        expiresAt: expiredTime,
        sizeBytes: 100,
        contentType: 'video',
        provider: 'test'
      }));
      mockStore.getMetadata.mockResolvedValue({
        contentType: 'video',
        expiresAt: expiredTime
      });
      mockStore.delete.mockResolvedValue(true);

      const result = await adapter.get('expired-key');
      
      expect(result).toBeNull();
      expect(mockStore.delete).toHaveBeenCalledWith('expired-key');
    });

    it('should check existence correctly', async () => {
      mockStore.getMetadata.mockResolvedValue({
        expiresAt: Date.now() + 3600000 // Not expired
      });

      const exists = await adapter.exists('test-key');
      
      expect(exists).toBe(true);
    });

    it('should delete entries and update stats', async () => {
      mockStore.getMetadata.mockResolvedValue({
        sizeBytes: 100,
        contentType: 'video'
      });
      mockStore.delete.mockResolvedValue(true);

      const deleted = await adapter.delete('test-key');
      
      expect(deleted).toBe(true);
      expect(mockStore.delete).toHaveBeenCalledWith('test-key');
    });
  });

  describe('TTL and Expiration', () => {
    it('should use content-specific TTL', async () => {
      mockStore.set.mockResolvedValue(undefined);

      await adapter.set('video-key', { data: 'video' }, {
        contentType: 'video',
        provider: 'longcat'
      });

      // Should use video TTL (7200 seconds)
      const setCall = mockStore.set.mock.calls[0];
      const storedData = JSON.parse(setCall[1]);
      const expectedExpiry = storedData.createdAt + (7200 * 1000);
      
      expect(storedData.expiresAt).toBeCloseTo(expectedExpiry, -2);
    });

    it('should use custom TTL when provided', async () => {
      mockStore.set.mockResolvedValue(undefined);
      const customTtl = 1800; // 30 minutes

      await adapter.set('custom-key', { data: 'test' }, {
        ttl: customTtl,
        contentType: 'video',
        provider: 'test'
      });

      const setCall = mockStore.set.mock.calls[0];
      const storedData = JSON.parse(setCall[1]);
      const expectedExpiry = storedData.createdAt + (customTtl * 1000);
      
      expect(storedData.expiresAt).toBeCloseTo(expectedExpiry, -2);
    });
  });

  describe('Size Limits', () => {
    it('should reject entries exceeding size limit', async () => {
      const largeData = 'x'.repeat(2 * 1024 * 1024); // 2MB > 1MB limit

      await expect(adapter.set('large-key', largeData, {
        contentType: 'video',
        provider: 'test'
      })).rejects.toThrow('Entry size');
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up expired entries', async () => {
      const now = Date.now();
      
      mockStore.list.mockResolvedValue(['key1', 'key2', 'key3']);
      mockStore.getMetadata
        .mockResolvedValueOnce({ expiresAt: now - 1000 }) // Expired
        .mockResolvedValueOnce({ expiresAt: now + 1000 }) // Valid
        .mockResolvedValueOnce({ expiresAt: now - 2000 }); // Expired
      
      mockStore.delete.mockResolvedValue(true);

      const cleanedCount = await adapter.cleanup();
      
      expect(cleanedCount).toBe(2);
      expect(mockStore.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('Health Check', () => {
    it('should pass health check with working storage', async () => {
      mockStore.set.mockResolvedValue(undefined);
      mockStore.get.mockResolvedValue(JSON.stringify({
        key: '_health_check_123',
        value: { test: true, timestamp: Date.now() },
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000,
        sizeBytes: 50,
        contentType: 'metadata',
        provider: 'health-check'
      }));
      mockStore.getMetadata.mockResolvedValue({
        contentType: 'metadata',
        compressed: false
      });
      mockStore.delete.mockResolvedValue(true);

      const health = await adapter.healthCheck();
      
      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThan(0);
      expect(health.error).toBeUndefined();
    });

    it('should fail health check on storage errors', async () => {
      mockStore.set.mockRejectedValue(new Error('Storage unavailable'));

      const health = await adapter.healthCheck();
      
      expect(health.healthy).toBe(false);
      expect(health.error).toContain('Storage unavailable');
    });
  });
});

describe('Cache Configuration', () => {
  it('should provide environment-specific configuration', () => {
    // Mock development environment
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const devConfig = getCacheConfig();
    
    expect(devConfig.defaultTtl).toBe(300); // Shorter TTL for dev
    expect(devConfig.compression.enabled).toBe(false); // Disabled for dev

    process.env.NODE_ENV = originalEnv;
  });

  it('should calculate cache strategy by user tier', () => {
    const freeStrategy = getCacheStrategy('free', 'video', 'production');
    const enterpriseStrategy = getCacheStrategy('enterprise', 'video', 'production');

    expect(freeStrategy.ttlMultiplier).toBeLessThan(enterpriseStrategy.ttlMultiplier);
    expect(freeStrategy.priorityLevel).toBe('low');
    expect(enterpriseStrategy.priorityLevel).toBe('high');
  });

  it('should calculate dynamic TTL based on complexity and cost', () => {
    const baseTtl = calculateDynamicTtl(DEFAULT_CACHE_CONFIG, 'video', {
      complexity: 'simple',
      estimatedCost: 0.1,
      userTier: 'free',
      mode: 'preview'
    });

    const complexTtl = calculateDynamicTtl(DEFAULT_CACHE_CONFIG, 'video', {
      complexity: 'complex',
      estimatedCost: 2.0,
      userTier: 'enterprise',
      mode: 'production'
    });

    expect(complexTtl).toBeGreaterThan(baseTtl);
  });

  it('should respect TTL bounds', () => {
    // Test minimum bound
    const shortTtl = calculateDynamicTtl(DEFAULT_CACHE_CONFIG, 'text', {
      complexity: 'simple',
      estimatedCost: 0.01,
      userTier: 'free'
    });

    // Test maximum bound  
    const longTtl = calculateDynamicTtl(DEFAULT_CACHE_CONFIG, '3d', {
      complexity: 'complex',
      estimatedCost: 10.0,
      userTier: 'enterprise',
      duration: 300 // 5 minutes
    });

    expect(shortTtl).toBeGreaterThanOrEqual(60); // 1 minute minimum
    expect(longTtl).toBeLessThanOrEqual(86400); // 24 hours maximum
  });
});

describe('Integration Scenarios', () => {
  let adapter: NetlifyCacheAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new NetlifyCacheAdapter();
  });

  it('should handle concurrent cache operations', async () => {
    mockStore.set.mockResolvedValue(undefined);
    mockStore.get.mockResolvedValue(null);

    // Simulate concurrent set operations
    const promises = Array.from({ length: 5 }, (_, i) => 
      adapter.set(`key-${i}`, { data: `value-${i}` }, {
        contentType: 'metadata',
        provider: 'test'
      })
    );

    await expect(Promise.all(promises)).resolves.not.toThrow();
    expect(mockStore.set).toHaveBeenCalledTimes(5);
  });

  it('should handle cache warming scenarios', async () => {
    const predictions = [
      {
        prompt: 'Popular video prompt',
        contentType: 'video' as const,
        parameters: { duration: 10 }
      },
      {
        prompt: 'Common image request',
        contentType: 'image' as const,
        parameters: { style: 'realistic' }
      }
    ];

    // Cache warming should not throw errors
    await expect(adapter.warmCache(predictions)).resolves.not.toThrow();
  });

  it('should handle invalidation patterns', async () => {
    mockStore.list.mockResolvedValue(['video_123_hash1', 'image_456_hash2', 'video_789_hash3']);
    mockStore.delete.mockResolvedValue(true);

    // Invalidate all video content
    const invalidated = await adapter.invalidate('video_');
    
    expect(invalidated).toBe(2); // Should match 2 video entries
  });
});