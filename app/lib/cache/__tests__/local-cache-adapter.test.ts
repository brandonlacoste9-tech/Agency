/**
 * Local Cache Adapter Tests
 * 
 * Comprehensive test suite for the local filesystem cache adapter
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { LocalCacheAdapter } from '../local-cache-adapter';

const TEST_CACHE_DIR = '.test-cache';

describe('LocalCacheAdapter', () => {
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

  describe('Basic Operations', () => {
    it('should write and read cache entries', async () => {
      const key = 'test-key-1';
      const value = { message: 'Hello, World!', timestamp: Date.now() };

      await cache.set(key, value, {
        contentType: 'metadata',
        provider: 'test',
        ttl: 3600
      });

      const entry = await cache.get(key);

      expect(entry).not.toBeNull();
      expect(entry!.value).toEqual(value);
      expect(entry!.contentType).toBe('metadata');
      expect(entry!.provider).toBe('test');
      expect(entry!.sizeBytes).toBeGreaterThan(0);
    });

    it('should return null for non-existent keys', async () => {
      const entry = await cache.get('non-existent-key');
      expect(entry).toBeNull();
    });

    it('should check if key exists', async () => {
      const key = 'exists-test';
      const value = { test: true };

      expect(await cache.exists(key)).toBe(false);

      await cache.set(key, value);
      expect(await cache.exists(key)).toBe(true);
    });

    it('should delete entries', async () => {
      const key = 'delete-test';
      const value = { data: 'to-be-deleted' };

      await cache.set(key, value);
      expect(await cache.exists(key)).toBe(true);

      const deleted = await cache.delete(key);
      expect(deleted).toBe(true);
      expect(await cache.exists(key)).toBe(false);
    });

    it('should return false when deleting non-existent key', async () => {
      const deleted = await cache.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('TTL and Expiration', () => {
    it('should expire entries after TTL', async () => {
      const key = 'expire-test';
      const value = { data: 'expires-soon' };

      // Set with 50ms TTL
      await cache.set(key, value, { ttl: 0.05 });

      // Should exist immediately
      expect(await cache.get(key)).not.toBeNull();

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be expired and return null
      expect(await cache.get(key)).toBeNull();
    });

    it('should not expire entries with long TTL', async () => {
      const key = 'long-ttl-test';
      const value = { data: 'long-lived' };

      // Set with 10 second TTL
      await cache.set(key, value, { ttl: 10 });

      // Should still exist after short wait
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(await cache.get(key)).not.toBeNull();
    });

    it('should handle entries without explicit TTL', async () => {
      const key = 'default-ttl';
      const value = { data: 'default' };

      await cache.set(key, value); // Uses default TTL

      const entry = await cache.get(key);
      expect(entry).not.toBeNull();
      expect(entry!.expiresAt).toBeGreaterThan(Date.now());
    });
  });

  describe('Compression and Storage', () => {
    it('should compress data efficiently', async () => {
      const key = 'compression-test';
      const largeValue = {
        data: 'x'.repeat(1000), // 1KB of repeated data
        metadata: { type: 'large-text' }
      };

      await cache.set(key, largeValue);

      // Check that file exists and is compressed
      const filePath = path.join(TEST_CACHE_DIR, 'compression-test.gz');
      const stat = await fs.stat(filePath);
      
      // Compressed size should be much smaller than original
      expect(stat.size).toBeLessThan(500); // Should compress well

      // Should still retrieve correctly
      const entry = await cache.get(key);
      expect(entry!.value).toEqual(largeValue);
    });

    it('should handle binary-like data', async () => {
      const key = 'binary-test';
      const binaryLikeValue = {
        buffer: Buffer.from('binary data').toString('base64'),
        type: 'binary'
      };

      await cache.set(key, binaryLikeValue);
      const entry = await cache.get(key);

      expect(entry!.value).toEqual(binaryLikeValue);
    });
  });

  describe('Key Sanitization', () => {
    it('should handle special characters in keys', async () => {
      const specialKey = 'test/key:with*special?chars<>|';
      const value = { data: 'special-key-test' };

      await cache.set(specialKey, value);
      const entry = await cache.get(specialKey);

      expect(entry!.value).toEqual(value);
    });

    it('should handle very long keys', async () => {
      const longKey = 'very-long-key-' + 'x'.repeat(200);
      const value = { data: 'long-key-test' };

      await cache.set(longKey, value);
      const entry = await cache.get(longKey);

      expect(entry!.value).toEqual(value);
    });
  });

  describe('Cache Management', () => {
    it('should clear all entries', async () => {
      // Add multiple entries
      await cache.set('key1', { data: '1' });
      await cache.set('key2', { data: '2' });
      await cache.set('key3', { data: '3' });

      // Verify they exist
      expect(await cache.exists('key1')).toBe(true);
      expect(await cache.exists('key2')).toBe(true);
      expect(await cache.exists('key3')).toBe(true);

      // Clear all
      await cache.clear();

      // Verify they're gone
      expect(await cache.exists('key1')).toBe(false);
      expect(await cache.exists('key2')).toBe(false);
      expect(await cache.exists('key3')).toBe(false);
    });

    it('should cleanup expired entries', async () => {
      // Add expired and valid entries
      await cache.set('expired1', { data: 'old1' }, { ttl: 0.01 }); // 10ms
      await cache.set('expired2', { data: 'old2' }, { ttl: 0.01 }); // 10ms
      await cache.set('valid', { data: 'current' }, { ttl: 10 }); // 10s

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 50));

      const cleanedCount = await cache.cleanup();

      expect(cleanedCount).toBe(2); // Two expired entries
      expect(await cache.exists('valid')).toBe(true);
      expect(await cache.exists('expired1')).toBe(false);
      expect(await cache.exists('expired2')).toBe(false);
    });

    it('should get cache statistics', async () => {
      // Add some test data
      await cache.set('video1', { url: 'test.mp4' }, { contentType: 'video' });
      await cache.set('image1', { url: 'test.jpg' }, { contentType: 'image' });
      await cache.set('text1', { content: 'hello' }, { contentType: 'text' });

      const stats = await cache.getStats();

      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.totalSizeBytes).toBeGreaterThan(0);
      expect(stats.entriesByType).toHaveProperty('video');
      expect(stats.entriesByType).toHaveProperty('image');
      expect(stats.entriesByType).toHaveProperty('text');
    });
  });

  describe('Health Check', () => {
    it('should pass health check', async () => {
      const health = await cache.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThan(0);
      expect(health.error).toBeUndefined();
    });

    it('should report health check latency', async () => {
      const health = await cache.healthCheck();

      expect(health.latency).toBeGreaterThan(0);
      expect(health.latency).toBeLessThan(1000); // Should be fast for local cache
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted cache files gracefully', async () => {
      const key = 'corrupted-test';
      
      // Create a corrupted file manually
      await cache.set(key, { data: 'initial' });
      
      const filePath = path.join(TEST_CACHE_DIR, `${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.gz`);
      await fs.writeFile(filePath, 'corrupted-data');

      // Should return null for corrupted file
      const entry = await cache.get(key);
      expect(entry).toBeNull();
    });

    it('should handle missing cache directory', async () => {
      // Create cache with non-existent directory
      const newCache = new LocalCacheAdapter('./non-existent-cache');
      
      // Should create directory automatically
      await newCache.set('test', { data: 'auto-create' });
      const entry = await newCache.get('test');
      
      expect(entry!.value).toEqual({ data: 'auto-create' });
      
      // Cleanup
      await fs.rm('./non-existent-cache', { recursive: true }).catch(() => {});
    });
  });

  describe('Invalidation', () => {
    it('should invalidate by pattern', async () => {
      await cache.set('video_123', { type: 'video' });
      await cache.set('video_456', { type: 'video' });
      await cache.set('image_789', { type: 'image' });

      const invalidatedCount = await cache.invalidate('video_');

      expect(invalidatedCount).toBe(2);
      expect(await cache.exists('video_123')).toBe(false);
      expect(await cache.exists('video_456')).toBe(false);
      expect(await cache.exists('image_789')).toBe(true);
    });

    it('should invalidate by metadata', async () => {
      await cache.set('test1', { data: '1' }, { 
        metadata: { provider: 'longcat' }
      });
      await cache.set('test2', { data: '2' }, { 
        metadata: { provider: 'sora' }
      });
      await cache.set('test3', { data: '3' }, { 
        metadata: { provider: 'longcat' }
      });

      const invalidatedCount = await cache.invalidate(undefined, { provider: 'longcat' });

      expect(invalidatedCount).toBe(2);
      expect(await cache.exists('test1')).toBe(false);
      expect(await cache.exists('test2')).toBe(true);
      expect(await cache.exists('test3')).toBe(false);
    });
  });
});