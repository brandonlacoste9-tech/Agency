/**
 * Provider Selector Cache Integration Tests
 * 
 * Tests for cache-aware provider selection and integration scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProviderSelector, SelectionCriteria } from '../../providers/provider-selector';
import { CacheAdapter, CacheEntry } from '../cache-adapter';

// Mock cache adapter for testing
class MockCacheAdapter implements CacheAdapter {
  private storage = new Map<string, CacheEntry>();

  generateKey(params: any): string {
    return `mock_${JSON.stringify(params).replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  async get<T = any>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.storage.get(key);
    if (!entry) return null;
    
    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.storage.delete(key);
      return null;
    }
    
    return entry as CacheEntry<T>;
  }

  async set<T = any>(key: string, value: T, options: any = {}): Promise<void> {
    const now = Date.now();
    const ttl = options.ttl || 3600;
    
    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      expiresAt: now + (ttl * 1000),
      sizeBytes: JSON.stringify(value).length,
      contentType: options.contentType || 'metadata',
      provider: options.provider || 'mock',
      metadata: options.metadata
    };
    
    this.storage.set(key, entry);
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.has(key) && (await this.get(key)) !== null;
  }

  async delete(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async getStats(): Promise<any> {
    return {
      totalEntries: this.storage.size,
      totalSizeBytes: 0,
      hitRate: 0.8,
      totalHits: 100,
      totalMisses: 25,
      totalEvictions: 5,
      entriesByType: {},
      averageAgeSeconds: 1800
    };
  }

  async cleanup(): Promise<number> {
    return 0;
  }

  async warmCache(): Promise<void> {
    // Mock implementation
  }

  async invalidate(): Promise<number> {
    return 0;
  }

  async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    return { healthy: true, latency: 10 };
  }
}

describe('ProviderSelector Cache Integration', () => {
  let mockCache: MockCacheAdapter;
  let providerSelector: ProviderSelector;

  beforeEach(() => {
    mockCache = new MockCacheAdapter();
    providerSelector = new ProviderSelector(mockCache);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Cache-Aware Selection', () => {
    it('should return cached result when available', async () => {
      const criteria: SelectionCriteria = {
        contentType: 'video',
        mode: 'production',
        duration: 10,
        priority: 'quality',
        prompt: 'Test video prompt',
        userTier: 'pro'
      };

      // Pre-populate cache
      const cacheKey = mockCache.generateKey({
        prompt: criteria.prompt,
        contentType: criteria.contentType,
        parameters: {
          duration: criteria.duration,
          mode: criteria.mode,
          priority: criteria.priority
        },
        userContext: { tier: criteria.userTier }
      });

      await mockCache.set(cacheKey, { 
        videoUrl: 'https://cached-video.mp4',
        status: 'completed' 
      }, {
        provider: 'LongCat-Video',
        contentType: 'video'
      });

      const selection = await providerSelector.selectProvider(criteria);

      expect(selection.cacheStatus).toBe('hit');
      expect(selection.provider).toBe('LongCat-Video');
      expect(selection.estimatedCost).toBe(0);
      expect(selection.estimatedLatency).toBe(0.5);
      expect(selection.reason).toBe('Cached result available');
    });

    it('should proceed with provider selection on cache miss', async () => {
      const criteria: SelectionCriteria = {
        contentType: 'video',
        mode: 'production',
        duration: 10,
        priority: 'quality',
        prompt: 'New video prompt'
      };

      const selection = await providerSelector.selectProvider(criteria);

      expect(selection.cacheStatus).toBe('miss');
      expect(selection.provider).toBeTruthy();
      expect(selection.estimatedCost).toBeGreaterThan(0);
      expect(selection.cacheKey).toBeTruthy();
    });

    it('should handle cache errors gracefully', async () => {
      const faultyCacheAdapter = {
        ...mockCache,
        get: vi.fn().mockRejectedValue(new Error('Cache storage error'))
      } as any;

      const selector = new ProviderSelector(faultyCacheAdapter);
      
      const criteria: SelectionCriteria = {
        contentType: 'video',
        mode: 'production',
        duration: 10,
        priority: 'quality',
        prompt: 'Test prompt'
      };

      // Should not throw despite cache error
      const selection = await selector.selectProvider(criteria);
      
      expect(selection.cacheStatus).toBe('miss');
      expect(selection.provider).toBeTruthy();
    });
  });

  describe('Result Caching', () => {
    it('should cache successful generation results', async () => {
      const criteria: SelectionCriteria = {
        contentType: 'video',
        mode: 'production',
        duration: 15,
        priority: 'quality',
        prompt: 'Cache test video',
        userTier: 'enterprise'
      };

      const result = {
        id: 'job-123',
        status: 'completed',
        videoUrl: 'https://generated-video.mp4',
        duration: 15
      };

      // Should not throw
      await expect(
        providerSelector.cacheResult(criteria, result, 'LongCat-Video')
      ).resolves.not.toThrow();

      // Verify result was cached
      const cacheKey = mockCache.generateKey({
        prompt: criteria.prompt,
        contentType: criteria.contentType,
        parameters: {
          duration: criteria.duration,
          mode: criteria.mode,
          priority: criteria.priority
        },
        userContext: { tier: criteria.userTier }
      });

      const cached = await mockCache.get(cacheKey);
      expect(cached).toBeTruthy();
      expect(cached!.value).toEqual(result);
      expect(cached!.provider).toBe('LongCat-Video');
    });

    it('should not cache if cache is disabled', async () => {
      // Mock disabled cache
      const disabledCache = {
        ...mockCache,
        set: vi.fn()
      } as any;

      // Mock CACHE_CONFIG.enabled = false
      vi.doMock('../cache-config', () => ({
        CACHE_CONFIG: { enabled: false },
        getCacheStrategy: () => ({ enabled: false }),
        calculateDynamicTtl: () => 3600
      }));

      const selector = new ProviderSelector(disabledCache);
      
      const criteria: SelectionCriteria = {
        contentType: 'image',
        mode: 'preview',
        priority: 'speed',
        prompt: 'Test image'
      };

      await selector.cacheResult(criteria, { data: 'test' }, 'EMU 3.5');

      expect(disabledCache.set).not.toHaveBeenCalled();
    });

    it('should handle caching errors gracefully', async () => {
      const faultyCacheAdapter = {
        ...mockCache,
        set: vi.fn().mockRejectedValue(new Error('Storage full'))
      } as any;

      const selector = new ProviderSelector(faultyCacheAdapter);
      
      const criteria: SelectionCriteria = {
        contentType: 'video',
        mode: 'production',
        duration: 10,
        priority: 'quality',
        prompt: 'Test video'
      };

      // Should not throw despite cache error
      await expect(
        selector.cacheResult(criteria, { data: 'test' }, 'provider')
      ).resolves.not.toThrow();
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent keys for identical criteria', async () => {
      const criteria: SelectionCriteria = {
        contentType: 'video',
        mode: 'production',
        duration: 10,
        priority: 'quality',
        prompt: 'Consistent prompt',
        userTier: 'pro'
      };

      const selection1 = await providerSelector.selectProvider(criteria);
      const selection2 = await providerSelector.selectProvider(criteria);

      expect(selection1.cacheKey).toBe(selection2.cacheKey);
    });

    it('should generate different keys for different criteria', async () => {
      const criteria1: SelectionCriteria = {
        contentType: 'video',
        mode: 'production',
        duration: 10,
        priority: 'quality',
        prompt: 'First prompt'
      };

      const criteria2: SelectionCriteria = {
        contentType: 'video',
        mode: 'production',
        duration: 15, // Different duration
        priority: 'quality',
        prompt: 'First prompt'
      };

      const selection1 = await providerSelector.selectProvider(criteria1);
      const selection2 = await providerSelector.selectProvider(criteria2);

      expect(selection1.cacheKey).not.toBe(selection2.cacheKey);
    });
  });

  describe('TTL Calculation', () => {
    it('should use longer TTL for expensive content', async () => {
      const expensiveCriteria: SelectionCriteria = {
        contentType: '3d',
        mode: 'production',
        priority: 'quality',
        prompt: 'Complex 3D scene',
        userTier: 'enterprise'
      };

      const cheapCriteria: SelectionCriteria = {
        contentType: 'text',
        mode: 'preview',
        priority: 'speed',
        prompt: 'Simple text',
        userTier: 'free'
      };

      // Mock the caching to capture TTL values
      const ttlCapture: number[] = [];
      const spyCache = {
        ...mockCache,
        set: vi.fn(async (key, value, options) => {
          ttlCapture.push(options.ttl);
          return mockCache.set(key, value, options);
        })
      } as any;

      const selector = new ProviderSelector(spyCache);

      await selector.cacheResult(expensiveCriteria, { data: 'expensive' }, 'provider');
      await selector.cacheResult(cheapCriteria, { data: 'cheap' }, 'provider');

      expect(ttlCapture).toHaveLength(2);
      expect(ttlCapture[0]).toBeGreaterThan(ttlCapture[1]); // 3D should have longer TTL than text
    });
  });

  describe('User Tier Considerations', () => {
    it('should apply different cache strategies for different user tiers', async () => {
      const freeCriteria: SelectionCriteria = {
        contentType: 'video',
        mode: 'production',
        duration: 10,
        priority: 'quality',
        prompt: 'Test video',
        userTier: 'free'
      };

      const enterpriseCriteria: SelectionCriteria = {
        ...freeCriteria,
        userTier: 'enterprise'
      };

      // Both should work but with different cache strategies
      const freeSelection = await providerSelector.selectProvider(freeCriteria);
      const enterpriseSelection = await providerSelector.selectProvider(enterpriseCriteria);

      expect(freeSelection.cacheKey).not.toBe(enterpriseSelection.cacheKey);
    });
  });

  describe('Content Type Specific Behavior', () => {
    it('should handle video content with duration considerations', async () => {
      const shortVideo: SelectionCriteria = {
        contentType: 'video',
        mode: 'production',
        duration: 5,
        priority: 'quality',
        prompt: 'Short video'
      };

      const longVideo: SelectionCriteria = {
        contentType: 'video',
        mode: 'production',
        duration: 60,
        priority: 'quality',
        prompt: 'Long video'
      };

      const shortSelection = await providerSelector.selectProvider(shortVideo);
      const longSelection = await providerSelector.selectProvider(longVideo);

      expect(shortSelection.cacheKey).not.toBe(longSelection.cacheKey);
    });

    it('should handle image content without duration', async () => {
      const imageCriteria: SelectionCriteria = {
        contentType: 'image',
        mode: 'production',
        priority: 'quality',
        prompt: 'Beautiful landscape'
      };

      const selection = await providerSelector.selectProvider(imageCriteria);
      
      expect(selection.cacheKey).toBeTruthy();
      expect(selection.estimatedLatency).toBeGreaterThan(0);
    });

    it('should handle text content efficiently', async () => {
      const textCriteria: SelectionCriteria = {
        contentType: 'text',
        mode: 'production',
        priority: 'speed',
        prompt: 'Generate some text content'
      };

      const selection = await providerSelector.selectProvider(textCriteria);
      
      expect(selection.provider).toBe('Kimi-linear'); // Should select text provider
      expect(selection.cacheKey).toBeTruthy();
    });
  });
});