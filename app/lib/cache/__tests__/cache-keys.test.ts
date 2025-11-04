/**
 * Cache Keys Utilities Tests
 * 
 * Test suite for streamlined cache key generation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  cacheKeyForVideo,
  cacheKeyForImage,
  cacheKeyForText,
  cacheKeyFor3D,
  isValidCacheKey,
  hashCacheKey,
  extractPromptHash,
  getCacheKeyMetadata
} from '../cache-keys';

describe('Cache Key Utilities', () => {
  describe('Video Cache Keys', () => {
    it('should generate consistent video cache keys', () => {
      const prompt = 'A cat jumping over a fence';
      const params = { duration: 10, model: 'longcat' };

      const key1 = cacheKeyForVideo(prompt, params);
      const key2 = cacheKeyForVideo(prompt, params);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^video_[a-f0-9]{8}_[a-f0-9]{8}$/);
    });

    it('should generate different keys for different prompts', () => {
      const params = { duration: 10, model: 'longcat' };

      const key1 = cacheKeyForVideo('A cat jumping', params);
      const key2 = cacheKeyForVideo('A dog running', params);

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different parameters', () => {
      const prompt = 'A cat jumping';

      const key1 = cacheKeyForVideo(prompt, { duration: 10, model: 'longcat' });
      const key2 = cacheKeyForVideo(prompt, { duration: 20, model: 'longcat' });

      expect(key1).not.toBe(key2);
    });

    it('should handle special characters in prompts', () => {
      const prompt = 'A cat with "quotes" and special chars: @#$%';
      const params = { duration: 10, model: 'longcat' };

      const key = cacheKeyForVideo(prompt, params);

      expect(key).toMatch(/^video_[a-f0-9]{8}_[a-f0-9]{8}$/);
      expect(isValidCacheKey(key)).toBe(true);
    });

    it('should handle long prompts', () => {
      const prompt = 'A very long prompt that exceeds normal length limits '.repeat(10);
      const params = { duration: 10, model: 'longcat' };

      const key = cacheKeyForVideo(prompt, params);

      expect(key).toMatch(/^video_[a-f0-9]{8}_[a-f0-9]{8}$/);
      expect(isValidCacheKey(key)).toBe(true);
    });

    it('should handle nested parameters', () => {
      const prompt = 'A cat jumping';
      const params = {
        duration: 10,
        model: 'longcat',
        style: { color: 'vibrant', mood: 'happy' },
        settings: { fps: 30, quality: 'high' }
      };

      const key = cacheKeyForVideo(prompt, params);

      expect(key).toMatch(/^video_[a-f0-9]{8}_[a-f0-9]{8}$/);
      expect(isValidCacheKey(key)).toBe(true);
    });
  });

  describe('Image Cache Keys', () => {
    it('should generate consistent image cache keys', () => {
      const prompt = 'A beautiful sunset';
      const params = { width: 1024, height: 768, model: 'flux' };

      const key1 = cacheKeyForImage(prompt, params);
      const key2 = cacheKeyForImage(prompt, params);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^image_[a-f0-9]{8}_[a-f0-9]{8}$/);
    });

    it('should generate different keys for different dimensions', () => {
      const prompt = 'A sunset';

      const key1 = cacheKeyForImage(prompt, { width: 1024, height: 768 });
      const key2 = cacheKeyForImage(prompt, { width: 512, height: 512 });

      expect(key1).not.toBe(key2);
    });

    it('should handle style parameters', () => {
      const prompt = 'A sunset';
      const params = {
        width: 1024,
        height: 768,
        style: 'photorealistic',
        seed: 12345
      };

      const key = cacheKeyForImage(prompt, params);

      expect(key).toMatch(/^image_[a-f0-9]{8}_[a-f0-9]{8}$/);
      expect(isValidCacheKey(key)).toBe(true);
    });
  });

  describe('Text Cache Keys', () => {
    it('should generate consistent text cache keys', () => {
      const prompt = 'Write a story about adventure';
      const params = { model: 'gpt-4', maxTokens: 1000 };

      const key1 = cacheKeyForText(prompt, params);
      const key2 = cacheKeyForText(prompt, params);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^text_[a-f0-9]{8}_[a-f0-9]{8}$/);
    });

    it('should handle different text models', () => {
      const prompt = 'Write a story';

      const key1 = cacheKeyForText(prompt, { model: 'gpt-4' });
      const key2 = cacheKeyForText(prompt, { model: 'claude' });

      expect(key1).not.toBe(key2);
    });

    it('should handle conversation context', () => {
      const prompt = 'Continue the story';
      const params = {
        model: 'gpt-4',
        context: ['Previous message 1', 'Previous message 2']
      };

      const key = cacheKeyForText(prompt, params);

      expect(key).toMatch(/^text_[a-f0-9]{8}_[a-f0-9]{8}$/);
      expect(isValidCacheKey(key)).toBe(true);
    });
  });

  describe('3D Cache Keys', () => {
    it('should generate consistent 3D cache keys', () => {
      const prompt = 'A 3D model of a chair';
      const params = { format: 'gltf', quality: 'high' };

      const key1 = cacheKeyFor3D(prompt, params);
      const key2 = cacheKeyFor3D(prompt, params);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^3d_[a-f0-9]{8}_[a-f0-9]{8}$/);
    });

    it('should handle different 3D formats', () => {
      const prompt = 'A chair';

      const key1 = cacheKeyFor3D(prompt, { format: 'gltf' });
      const key2 = cacheKeyFor3D(prompt, { format: 'obj' });

      expect(key1).not.toBe(key2);
    });

    it('should handle material parameters', () => {
      const prompt = 'A chair';
      const params = {
        format: 'gltf',
        materials: ['wood', 'fabric'],
        lighting: 'studio'
      };

      const key = cacheKeyFor3D(prompt, params);

      expect(key).toMatch(/^3d_[a-f0-9]{8}_[a-f0-9]{8}$/);
      expect(isValidCacheKey(key)).toBe(true);
    });
  });

  describe('Cache Key Validation', () => {
    it('should validate correct cache keys', () => {
      expect(isValidCacheKey('video_abcd1234_efgh5678')).toBe(true);
      expect(isValidCacheKey('image_12345678_87654321')).toBe(true);
      expect(isValidCacheKey('text_aaaaaaaa_bbbbbbbb')).toBe(true);
      expect(isValidCacheKey('3d_cccccccc_dddddddd')).toBe(true);
    });

    it('should reject invalid cache keys', () => {
      expect(isValidCacheKey('invalid_key')).toBe(false);
      expect(isValidCacheKey('video_short_hash')).toBe(false);
      expect(isValidCacheKey('video_UPPERCASE_hash')).toBe(false);
      expect(isValidCacheKey('video_12345678_gggggggg')).toBe(false); // Invalid hex
      expect(isValidCacheKey('unknown_12345678_87654321')).toBe(false);
      expect(isValidCacheKey('')).toBe(false);
      expect(isValidCacheKey('video__87654321')).toBe(false); // Missing prompt hash
    });

    it('should handle edge cases', () => {
      expect(isValidCacheKey('video_12345678_')).toBe(false); // Missing param hash
      expect(isValidCacheKey('_12345678_87654321')).toBe(false); // Missing type
      expect(isValidCacheKey('video 12345678 87654321')).toBe(false); // Spaces instead of underscores
    });
  });

  describe('Hash Cache Key', () => {
    it('should create consistent hashes for cache keys', () => {
      const key = 'video_12345678_87654321';

      const hash1 = hashCacheKey(key);
      const hash2 = hashCacheKey(key);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{8}$/);
    });

    it('should create different hashes for different keys', () => {
      const hash1 = hashCacheKey('video_12345678_87654321');
      const hash2 = hashCacheKey('image_12345678_87654321');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle long cache keys', () => {
      const longKey = 'video_' + 'a'.repeat(100) + '_' + 'b'.repeat(100);
      const hash = hashCacheKey(longKey);

      expect(hash).toMatch(/^[a-f0-9]{8}$/);
    });
  });

  describe('Extract Prompt Hash', () => {
    it('should extract prompt hash from valid cache keys', () => {
      expect(extractPromptHash('video_abcd1234_efgh5678')).toBe('abcd1234');
      expect(extractPromptHash('image_12345678_87654321')).toBe('12345678');
      expect(extractPromptHash('text_aaaaaaaa_bbbbbbbb')).toBe('aaaaaaaa');
      expect(extractPromptHash('3d_cccccccc_dddddddd')).toBe('cccccccc');
    });

    it('should return null for invalid cache keys', () => {
      expect(extractPromptHash('invalid_key')).toBeNull();
      expect(extractPromptHash('video_short')).toBeNull();
      expect(extractPromptHash('')).toBeNull();
      expect(extractPromptHash('video_12345678_')).toBeNull();
    });
  });

  describe('Get Cache Key Metadata', () => {
    it('should extract metadata from valid cache keys', () => {
      const metadata1 = getCacheKeyMetadata('video_abcd1234_efgh5678');
      expect(metadata1).toEqual({
        type: 'video',
        promptHash: 'abcd1234',
        paramHash: 'efgh5678'
      });

      const metadata2 = getCacheKeyMetadata('image_12345678_87654321');
      expect(metadata2).toEqual({
        type: 'image',
        promptHash: '12345678',
        paramHash: '87654321'
      });
    });

    it('should return null for invalid cache keys', () => {
      expect(getCacheKeyMetadata('invalid_key')).toBeNull();
      expect(getCacheKeyMetadata('video_short')).toBeNull();
      expect(getCacheKeyMetadata('')).toBeNull();
    });

    it('should handle all supported content types', () => {
      const videoMeta = getCacheKeyMetadata('video_11111111_22222222');
      expect(videoMeta?.type).toBe('video');

      const imageMeta = getCacheKeyMetadata('image_33333333_44444444');
      expect(imageMeta?.type).toBe('image');

      const textMeta = getCacheKeyMetadata('text_55555555_66666666');
      expect(textMeta?.type).toBe('text');

      const d3Meta = getCacheKeyMetadata('3d_77777777_88888888');
      expect(d3Meta?.type).toBe('3d');
    });
  });

  describe('Parameter Handling', () => {
    it('should handle undefined parameters', () => {
      const key1 = cacheKeyForVideo('test prompt');
      const key2 = cacheKeyForVideo('test prompt', undefined);

      expect(key1).toBe(key2);
      expect(isValidCacheKey(key1)).toBe(true);
    });

    it('should handle null parameters', () => {
      // @ts-expect-error Testing null input
      const key = cacheKeyForVideo('test prompt', null);

      expect(isValidCacheKey(key)).toBe(true);
    });

    it('should handle empty parameters', () => {
      const key = cacheKeyForVideo('test prompt', {});

      expect(isValidCacheKey(key)).toBe(true);
    });

    it('should sort object keys for consistency', () => {
      const prompt = 'test';
      const params1 = { b: 2, a: 1, c: 3 };
      const params2 = { a: 1, b: 2, c: 3 };

      const key1 = cacheKeyForVideo(prompt, params1);
      const key2 = cacheKeyForVideo(prompt, params2);

      expect(key1).toBe(key2);
    });

    it('should handle arrays in parameters', () => {
      const prompt = 'test';
      const params = {
        tags: ['adventure', 'cat', 'jumping'],
        dimensions: [1920, 1080]
      };

      const key = cacheKeyForVideo(prompt, params);

      expect(isValidCacheKey(key)).toBe(true);
    });

    it('should handle nested objects consistently', () => {
      const prompt = 'test';
      const params1 = {
        style: { color: 'red', mood: 'happy' },
        settings: { quality: 'high' }
      };
      const params2 = {
        settings: { quality: 'high' },
        style: { mood: 'happy', color: 'red' }
      };

      const key1 = cacheKeyForVideo(prompt, params1);
      const key2 = cacheKeyForVideo(prompt, params2);

      expect(key1).toBe(key2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompt', () => {
      const key = cacheKeyForVideo('', { model: 'test' });

      expect(isValidCacheKey(key)).toBe(true);
    });

    it('should handle very long prompts', () => {
      const longPrompt = 'A'.repeat(10000);
      const key = cacheKeyForVideo(longPrompt, { model: 'test' });

      expect(isValidCacheKey(key)).toBe(true);
    });

    it('should handle unicode characters', () => {
      const unicodePrompt = '猫がジャンプする 🐱';
      const key = cacheKeyForVideo(unicodePrompt, { model: 'test' });

      expect(isValidCacheKey(key)).toBe(true);
    });

    it('should handle circular references in parameters', () => {
      const params: any = { model: 'test' };
      params.self = params; // Create circular reference

      // Should not throw error, but handle gracefully
      expect(() => {
        cacheKeyForVideo('test', params);
      }).not.toThrow();
    });

    it('should handle function values in parameters', () => {
      const params = {
        model: 'test',
        callback: () => console.log('test'), // Function value
        value: 123
      };

      const key = cacheKeyForVideo('test', params);

      expect(isValidCacheKey(key)).toBe(true);
    });
  });
});