import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderSelector, selectVideoProvider, selectImageProvider } from '../provider-selector';

describe('ProviderSelector', () => {
  let selector: ProviderSelector;

  beforeEach(() => {
    selector = new ProviderSelector();
  });

  describe('Video Provider Selection', () => {
    it('should select Nitro-E for preview mode', () => {
      const selection = selector.selectProvider({
        contentType: 'video',
        mode: 'preview',
        duration: 5,
        priority: 'speed'
      });

      expect(selection.provider).toBe('AMD Nitro-E');
      expect(selection.confidence).toBeGreaterThan(0.7);
      expect(selection.estimatedCost).toBeLessThan(0.50); // Should be cheap
      expect(selection.reason).toContain('fast');
    });

    it('should select LongCat for production mode', () => {
      const selection = selector.selectProvider({
        contentType: 'video',
        mode: 'production',
        duration: 30,
        priority: 'quality'
      });

      expect(selection.provider).toBe('LongCat-Video');
      expect(selection.confidence).toBeGreaterThan(0.6);
      expect(selection.reason).toContain('quality');
    });

    it('should reject providers that cannot handle duration', () => {
      const selection = selector.selectProvider({
        contentType: 'video',
        mode: 'production',
        duration: 120, // 2 minutes
        priority: 'quality'
      });

      // Should select LongCat since Nitro-E max is 10s
      expect(selection.provider).toBe('LongCat-Video');
    });

    it('should respect budget constraints', () => {
      const selection = selector.selectProvider({
        contentType: 'video',
        mode: 'production',
        duration: 60,
        budget: 2.00, // Low budget should prefer cheaper option
        priority: 'cost'
      });

      // Should prefer cheaper provider even in production mode
      expect(selection.estimatedCost).toBeLessThanOrEqual(2.00);
    });

    it('should provide fallback providers', () => {
      const selection = selector.selectProvider({
        contentType: 'video',
        mode: 'production',
        duration: 10,
        priority: 'quality'
      });

      expect(selection.fallbacks).toBeInstanceOf(Array);
      expect(selection.fallbacks.length).toBeGreaterThan(0);
      expect(selection.fallbacks).not.toContain(selection.provider);
    });
  });

  describe('Image Provider Selection', () => {
    it('should select EMU for image generation', () => {
      const selection = selector.selectProvider({
        contentType: 'image',
        mode: 'production',
        priority: 'quality'
      });

      expect(selection.provider).toBe('EMU 3.5');
      expect(selection.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Text Provider Selection', () => {
    it('should select Kimi for text generation', () => {
      const selection = selector.selectProvider({
        contentType: 'text',
        mode: 'production',
        priority: 'quality'
      });

      expect(selection.provider).toBe('Kimi-linear');
      expect(selection.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Circuit Breaker', () => {
    it('should track provider failures', () => {
      // Report multiple failures
      for (let i = 0; i < 6; i++) {
        selector.reportFailure('LongCat-Video');
      }

      const health = selector.getProviderHealth();
      expect(health['LongCat-Video'].healthy).toBe(false);
      expect(health['LongCat-Video'].failures).toBe(6);
    });

    it('should exclude unhealthy providers from selection', () => {
      // Make LongCat unhealthy
      for (let i = 0; i < 6; i++) {
        selector.reportFailure('LongCat-Video');
      }

      const selection = selector.selectProvider({
        contentType: 'video',
        mode: 'production',
        duration: 30,
        priority: 'quality'
      });

      // Should fallback to Nitro-E since LongCat is unhealthy
      expect(selection.provider).toBe('AMD Nitro-E');
    });

    it('should reset circuit breaker', () => {
      // Make provider unhealthy
      for (let i = 0; i < 6; i++) {
        selector.reportFailure('LongCat-Video');
      }

      expect(selector.getProviderHealth()['LongCat-Video'].healthy).toBe(false);

      // Reset circuit breaker
      selector.resetCircuitBreaker('LongCat-Video');
      
      expect(selector.getProviderHealth()['LongCat-Video'].healthy).toBe(true);
      expect(selector.getProviderHealth()['LongCat-Video'].failures).toBe(0);
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate video costs correctly', () => {
      const selection = selector.selectProvider({
        contentType: 'video',
        mode: 'production',
        duration: 10,
        priority: 'quality'
      });

      expect(selection.estimatedCost).toBeGreaterThan(0);
      expect(typeof selection.estimatedCost).toBe('number');
    });

    it('should estimate latency correctly', () => {
      const selection = selector.selectProvider({
        contentType: 'video',
        mode: 'preview',
        duration: 5,
        priority: 'speed'
      });

      expect(selection.estimatedLatency).toBeGreaterThan(0);
      expect(typeof selection.estimatedLatency).toBe('number');
    });
  });

  describe('Priority Handling', () => {
    it('should prioritize speed when requested', () => {
      const selection = selector.selectProvider({
        contentType: 'video',
        mode: 'production',
        duration: 8,
        priority: 'speed'
      });

      // Should prefer faster provider even in production
      expect(selection.estimatedLatency).toBeLessThan(15);
    });

    it('should prioritize cost when requested', () => {
      const selection = selector.selectProvider({
        contentType: 'video',
        mode: 'production',
        duration: 10,
        priority: 'cost'
      });

      // Should select cheaper option
      expect(selection.estimatedCost).toBeLessThan(0.50);
    });

    it('should prioritize quality when requested', () => {
      const selection = selector.selectProvider({
        contentType: 'video',
        mode: 'production',
        duration: 30,
        priority: 'quality'
      });

      // Should select premium provider
      expect(selection.provider).toBe('LongCat-Video');
      expect(selection.reason).toContain('quality');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when no providers available', () => {
      expect(() => {
        selector.selectProvider({
          contentType: '3d' as any, // No 3D providers configured yet
          mode: 'production',
          priority: 'quality'
        });
      }).toThrow('No providers available for content type: 3d');
    });
  });

  describe('Convenience Functions', () => {
    it('should work with selectVideoProvider helper', () => {
      const selection = selectVideoProvider(10, 'preview', 'speed');
      
      expect(selection.provider).toBeDefined();
      expect(selection.confidence).toBeGreaterThan(0);
    });

    it('should work with selectImageProvider helper', () => {
      const selection = selectImageProvider('production', 'quality');
      
      expect(selection.provider).toBe('EMU 3.5');
      expect(selection.confidence).toBeGreaterThan(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle typical preview workflow', () => {
      // User requests preview of 30s video
      const selection = selectVideoProvider(30, 'preview', 'speed');
      
      expect(selection.provider).toBe('AMD Nitro-E');
      expect(selection.estimatedLatency).toBeLessThan(10);
      expect(selection.estimatedCost).toBeLessThan(0.50);
    });

    it('should handle typical production workflow', () => {
      // User requests final 60s video
      const selection = selectVideoProvider(60, 'production', 'quality');
      
      expect(selection.provider).toBe('LongCat-Video');
      expect(selection.reason).toContain('quality');
      expect(selection.fallbacks).toContain('AMD Nitro-E');
    });

    it('should handle budget-constrained requests', () => {
      const selection = selector.selectProvider({
        contentType: 'video',
        mode: 'production',
        duration: 45,
        budget: 1.00,
        priority: 'cost',
        userTier: 'free'
      });

      expect(selection.estimatedCost).toBeLessThanOrEqual(1.00);
    });
  });
});

describe('Provider Selection Integration', () => {
  it('should provide reasonable selections for all content types', () => {
    const videoSelection = selectVideoProvider(20, 'production');
    const imageSelection = selectImageProvider('production');
    
    expect(videoSelection.provider).toBeDefined();
    expect(imageSelection.provider).toBeDefined();
    
    expect(videoSelection.confidence).toBeGreaterThan(0.5);
    expect(imageSelection.confidence).toBeGreaterThan(0.5);
  });

  it('should handle edge cases gracefully', () => {
    // Very short video should still work
    const shortVideo = selectVideoProvider(1, 'preview', 'speed');
    expect(shortVideo.provider).toBeDefined();
    
    // Very long video should select appropriate provider
    const longVideo = selectVideoProvider(180, 'production', 'quality');
    expect(longVideo.provider).toBe('LongCat-Video');
  });
});