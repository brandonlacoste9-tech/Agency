/**
 * Cache System Integration Tests
 * 
 * Test suite to verify all cache components work together properly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import {
  LocalCacheAdapter,
  cacheKeyForVideo,
  cacheKeyForImage,
  cacheKeyForText,
  isValidCacheKey,
  getCacheKeyMetadata
} from '../index';

const TEST_CACHE_DIR = '.integration-test-cache';

describe('Cache System Integration', () => {
  let cache: LocalCacheAdapter;

  beforeEach(async () => {
    // Clean up any existing test cache
    try {
      await fs.rm(TEST_CACHE_DIR, { recursive: true });
    } catch {}
    
    cache = new LocalCacheAdapter(TEST_CACHE_DIR);
  });

  afterEach(async () => {
    // Clean up test cache
    try {
      await fs.rm(TEST_CACHE_DIR, { recursive: true });
    } catch {}
  });

  describe('End-to-End Cache Operations', () => {
    it('should handle complete video generation workflow', async () => {
      const prompt = 'A cat jumping over a rainbow';
      const params = {
        duration: 10,
        model: 'longcat',
        style: 'cartoon',
        quality: 'high'
      };

      // Generate cache key using utility
      const cacheKey = cacheKeyForVideo(prompt, params);
      expect(isValidCacheKey(cacheKey)).toBe(true);

      // Verify key metadata
      const metadata = getCacheKeyMetadata(cacheKey);
      expect(metadata?.type).toBe('video');

      // Simulate cache miss - generate content
      let cachedResult = await cache.get(cacheKey);
      expect(cachedResult).toBeNull();

      // Store generated result
      const generatedVideo = {
        url: 'https://example.com/video.mp4',
        duration: 10,
        thumbnail: 'https://example.com/thumb.jpg',
        metadata: { model: 'longcat', style: 'cartoon' }
      };

      await cache.set(cacheKey, generatedVideo, {
        contentType: 'video',
        provider: 'longcat',
        ttl: 3600
      });

      // Verify cache hit
      cachedResult = await cache.get(cacheKey);
      expect(cachedResult).not.toBeNull();
      expect(cachedResult!.value).toEqual(generatedVideo);
      expect(cachedResult!.contentType).toBe('video');
      expect(cachedResult!.provider).toBe('longcat');
    });

    it('should handle image generation workflow', async () => {
      const prompt = 'A beautiful sunset over mountains';
      const params = {
        width: 1024,
        height: 768,
        model: 'flux',
        style: 'photorealistic'
      };

      const cacheKey = cacheKeyForImage(prompt, params);
      expect(isValidCacheKey(cacheKey)).toBe(true);

      const generatedImage = {
        url: 'https://example.com/image.jpg',
        width: 1024,
        height: 768,
        format: 'jpeg'
      };

      await cache.set(cacheKey, generatedImage, {
        contentType: 'image',
        provider: 'flux'
      });

      const cachedResult = await cache.get(cacheKey);
      expect(cachedResult!.value).toEqual(generatedImage);
    });

    it('should handle text generation workflow', async () => {
      const prompt = 'Write a short story about adventure';
      const params = {
        model: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.7
      };

      const cacheKey = cacheKeyForText(prompt, params);
      expect(isValidCacheKey(cacheKey)).toBe(true);

      const generatedText = {
        content: 'Once upon a time, in a land far away...',
        tokens: 256,
        model: 'gpt-4'
      };

      await cache.set(cacheKey, generatedText, {
        contentType: 'text',
        provider: 'openai'
      });

      const cachedResult = await cache.get(cacheKey);
      expect(cachedResult!.value).toEqual(generatedText);
    });
  });

  describe('Multi-Type Cache Management', () => {
    it('should manage different content types together', async () => {
      // Add different content types
      const videoKey = cacheKeyForVideo('cat video', { duration: 5 });
      const imageKey = cacheKeyForImage('cat image', { width: 512 });
      const textKey = cacheKeyForText('cat story', { maxTokens: 100 });

      await cache.set(videoKey, { url: 'video.mp4' }, { contentType: 'video' });
      await cache.set(imageKey, { url: 'image.jpg' }, { contentType: 'image' });
      await cache.set(textKey, { content: 'A cat story' }, { contentType: 'text' });

      // Verify all exist
      expect(await cache.exists(videoKey)).toBe(true);
      expect(await cache.exists(imageKey)).toBe(true);
      expect(await cache.exists(textKey)).toBe(true);

      // Check stats
      const stats = await cache.getStats();
      expect(stats.totalEntries).toBe(3);
      expect(stats.entriesByType.video).toBe(1);
      expect(stats.entriesByType.image).toBe(1);
      expect(stats.entriesByType.text).toBe(1);
    });

    it('should handle cache invalidation by content type', async () => {
      // Add mixed content
      const videoKey1 = cacheKeyForVideo('video 1', { duration: 5 });
      const videoKey2 = cacheKeyForVideo('video 2', { duration: 10 });
      const imageKey = cacheKeyForImage('image 1', { width: 512 });

      await cache.set(videoKey1, { url: 'video1.mp4' }, { 
        contentType: 'video',
        metadata: { provider: 'longcat' }
      });
      await cache.set(videoKey2, { url: 'video2.mp4' }, { 
        contentType: 'video',
        metadata: { provider: 'sora' }
      });
      await cache.set(imageKey, { url: 'image.jpg' }, { 
        contentType: 'image',
        metadata: { provider: 'flux' }
      });

      // Invalidate by provider
      const invalidatedCount = await cache.invalidate(undefined, { provider: 'longcat' });
      expect(invalidatedCount).toBe(1);

      // Verify selective invalidation
      expect(await cache.exists(videoKey1)).toBe(false);
      expect(await cache.exists(videoKey2)).toBe(true);
      expect(await cache.exists(imageKey)).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    it('should compress large content efficiently', async () => {
      const prompt = 'Large content test';
      const largeContent = {
        data: 'x'.repeat(10000), // 10KB of data
        metadata: { size: 'large' }
      };

      const cacheKey = cacheKeyForText(prompt, { size: 'large' });
      await cache.set(cacheKey, largeContent, { contentType: 'text' });

      const stats = await cache.getStats();
      expect(stats.totalSizeBytes).toBeGreaterThan(0);
      expect(stats.totalSizeBytes).toBeLessThan(10000); // Should be compressed

      // Should still retrieve correctly
      const cached = await cache.get(cacheKey);
      expect(cached!.value).toEqual(largeContent);
    });

    it('should handle rapid cache operations', async () => {
      const operations: Promise<void>[] = [];

      // Create multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        const key = cacheKeyForVideo(`test video ${i}`, { index: i });
        const value = { url: `video${i}.mp4`, index: i };
        
        operations.push(
          cache.set(key, value, { contentType: 'video' })
        );
      }

      // Wait for all operations to complete
      await Promise.all(operations);

      // Verify all were stored
      const stats = await cache.getStats();
      expect(stats.totalEntries).toBe(10);
      expect(stats.entriesByType.video).toBe(10);
    });
  });

  describe('Cache Key Consistency', () => {
    it('should generate consistent keys across sessions', () => {
      const prompt = 'Consistency test';
      const params = { model: 'test', value: 123 };

      // Generate keys multiple times
      const keys = Array.from({ length: 5 }, () => 
        cacheKeyForVideo(prompt, params)
      );

      // All should be identical
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(1);
      expect(isValidCacheKey(keys[0])).toBe(true);
    });

    it('should generate different keys for different inputs', () => {
      const basePrompt = 'Test prompt';
      const baseParams = { model: 'test' };

      const keys = [
        cacheKeyForVideo(basePrompt, baseParams),
        cacheKeyForVideo(basePrompt + ' modified', baseParams),
        cacheKeyForVideo(basePrompt, { ...baseParams, extra: 'param' }),
        cacheKeyForImage(basePrompt, baseParams),
        cacheKeyForText(basePrompt, baseParams)
      ];

      // All should be unique
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);

      // All should be valid
      keys.forEach(key => {
        expect(isValidCacheKey(key)).toBe(true);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle cache corruption gracefully', async () => {
      const key = cacheKeyForVideo('corruption test', { test: true });
      
      // Store valid entry
      await cache.set(key, { url: 'test.mp4' }, { contentType: 'video' });
      expect(await cache.exists(key)).toBe(true);

      // Simulate corruption by writing invalid data
      const filePath = `${TEST_CACHE_DIR}/${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.gz`;
      await fs.writeFile(filePath, 'corrupted data');

      // Should handle gracefully and return null
      const result = await cache.get(key);
      expect(result).toBeNull();

      // Should be able to overwrite corrupted entry
      await cache.set(key, { url: 'recovered.mp4' }, { contentType: 'video' });
      const recovered = await cache.get(key);
      expect(recovered!.value).toEqual({ url: 'recovered.mp4' });
    });

    it('should maintain system health during errors', async () => {
      // Health check should pass even after errors
      let health = await cache.healthCheck();
      expect(health.healthy).toBe(true);

      // Attempt operations that might fail
      try {
        await cache.get('non-existent-key');
        await cache.delete('another-non-existent-key');
      } catch {}

      // Health should still be good
      health = await cache.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThan(0);
    });
  });
});