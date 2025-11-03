/**
 * Provider Selection Engine for AdGenXAI
 * 
 * Intelligently routes requests to optimal providers based on:
 * - Preview vs Production mode
 * - Budget constraints 
 * - Content type and duration
 * - Provider availability and cost
 */

export interface ProviderConfig {
  name: string;
  type: 'video' | 'image' | 'text' | '3d';
  costPerSecond?: number; // For video providers
  costPerGeneration?: number; // For image/text providers
  maxDuration?: number; // For video providers
  quality: 'preview' | 'standard' | 'premium';
  latency: 'fast' | 'medium' | 'slow';
  availability: 'always' | 'conditional' | 'experimental';
}

export interface SelectionCriteria {
  contentType: 'video' | 'image' | 'text' | '3d';
  mode: 'preview' | 'production';
  duration?: number; // For video requests
  budget?: number; // Max cost in USD
  priority: 'speed' | 'quality' | 'cost';
  userTier?: 'free' | 'pro' | 'enterprise';
}

export interface ProviderSelection {
  provider: string;
  confidence: number; // 0-1, how confident this choice is
  estimatedCost: number;
  estimatedLatency: number; // seconds
  reason: string;
  fallbacks: string[]; // Ordered list of fallback providers
}

export class ProviderSelector {
  private providers: Map<string, ProviderConfig> = new Map();
  private circuitBreaker: Map<string, { failures: number; lastFailure: number }> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // P0 Providers (Available)
    this.providers.set('longcat', {
      name: 'LongCat-Video',
      type: 'video',
      costPerSecond: 0.10, // Estimated
      maxDuration: 300, // 5 minutes
      quality: 'premium',
      latency: 'slow',
      availability: 'always'
    });

    this.providers.set('nitro-e', {
      name: 'AMD Nitro-E',
      type: 'video',
      costPerSecond: 0.01, // Very fast/cheap
      maxDuration: 10, // Thumbnails only
      quality: 'preview',
      latency: 'fast',
      availability: 'always'
    });

    this.providers.set('emu', {
      name: 'EMU 3.5',
      type: 'image',
      costPerGeneration: 0.05,
      quality: 'premium',
      latency: 'medium',
      availability: 'always'
    });

    this.providers.set('kimi', {
      name: 'Kimi-linear',
      type: 'text',
      costPerGeneration: 0.02,
      quality: 'premium',
      latency: 'fast',
      availability: 'always'
    });

    // P1 Providers (Coming Soon)
    this.providers.set('hunyuan-3d', {
      name: 'Hunyuan 3D 3.0',
      type: '3d',
      costPerGeneration: 0.25,
      quality: 'premium',
      latency: 'slow',
      availability: 'conditional'
    });
  }

  /**
   * Select the optimal provider for a request
   */
  selectProvider(criteria: SelectionCriteria): ProviderSelection {
    const availableProviders = this.getAvailableProviders(criteria.contentType);
    
    if (availableProviders.length === 0) {
      throw new Error(`No providers available for content type: ${criteria.contentType}`);
    }

    // Apply selection strategy
    const scored = availableProviders.map(provider => ({
      provider: provider.name,
      config: provider,
      score: this.calculateScore(provider, criteria)
    }));

    // Sort by score (higher is better)
    scored.sort((a, b) => b.score - a.score);
    
    const selected = scored[0];
    const fallbacks = scored.slice(1, 4).map(p => p.provider);

    return {
      provider: selected.provider,
      confidence: Math.min(selected.score / 100, 1.0),
      estimatedCost: this.estimateCost(selected.config, criteria),
      estimatedLatency: this.estimateLatency(selected.config, criteria),
      reason: this.explainSelection(selected.config, criteria),
      fallbacks
    };
  }

  private getAvailableProviders(contentType: string): ProviderConfig[] {
    return Array.from(this.providers.values())
      .filter(p => p.type === contentType)
      .filter(p => this.isProviderHealthy(p.name))
      .filter(p => p.availability === 'always' || 
                   (p.availability === 'conditional' && this.isProviderEnabled(p.name)));
  }

  private calculateScore(provider: ProviderConfig, criteria: SelectionCriteria): number {
    let score = 50; // Base score

    // Mode-based scoring
    if (criteria.mode === 'preview') {
      // Prefer fast, cheap providers for previews
      if (provider.latency === 'fast') score += 30;
      if (provider.quality === 'preview') score += 20;
      if (provider.costPerSecond && provider.costPerSecond < 0.05) score += 15;
    } else {
      // Prefer quality for production
      if (provider.quality === 'premium') score += 30;
      if (provider.quality === 'standard') score += 15;
      if (provider.latency === 'slow') score -= 5; // Slight penalty for slow in production
    }

    // Priority-based adjustments
    switch (criteria.priority) {
      case 'speed':
        if (provider.latency === 'fast') score += 25;
        if (provider.latency === 'slow') score -= 15;
        break;
      case 'quality':
        if (provider.quality === 'premium') score += 25;
        if (provider.quality === 'preview') score -= 15;
        break;
      case 'cost':
        if (provider.costPerSecond && provider.costPerSecond < 0.05) score += 25;
        if (provider.costPerGeneration && provider.costPerGeneration < 0.03) score += 25;
        break;
    }

    // Duration constraints for video
    if (criteria.contentType === 'video' && criteria.duration) {
      if (provider.maxDuration && criteria.duration > provider.maxDuration) {
        score -= 50; // Heavy penalty for insufficient duration
      }
    }

    // Budget constraints
    if (criteria.budget) {
      const estimatedCost = this.estimateCost(provider, criteria);
      if (estimatedCost > criteria.budget) {
        score -= 30; // Penalty for exceeding budget
      }
    }

    // User tier adjustments
    if (criteria.userTier === 'free' && provider.quality === 'premium') {
      score -= 20; // Free users get lower priority on premium providers
    }

    return Math.max(0, score);
  }

  private estimateCost(provider: ProviderConfig, criteria: SelectionCriteria): number {
    if (criteria.contentType === 'video' && provider.costPerSecond && criteria.duration) {
      return provider.costPerSecond * criteria.duration;
    }
    return provider.costPerGeneration || 0.05; // Default estimate
  }

  private estimateLatency(provider: ProviderConfig, criteria: SelectionCriteria): number {
    const baseLatency = {
      'fast': 2,
      'medium': 10,
      'slow': 30
    };

    let latency = baseLatency[provider.latency];

    // Add duration-based latency for video
    if (criteria.contentType === 'video' && criteria.duration) {
      latency += criteria.duration * 0.5; // Rough estimate: 0.5s processing per 1s video
    }

    return latency;
  }

  private explainSelection(provider: ProviderConfig, criteria: SelectionCriteria): string {
    const reasons = [];

    if (criteria.mode === 'preview' && provider.latency === 'fast') {
      reasons.push('fast preview generation');
    }
    
    if (criteria.mode === 'production' && provider.quality === 'premium') {
      reasons.push('high quality output');
    }

    if (criteria.priority === 'cost' && provider.costPerSecond && provider.costPerSecond < 0.05) {
      reasons.push('cost-effective');
    }

    if (criteria.priority === 'speed' && provider.latency === 'fast') {
      reasons.push('optimized for speed');
    }

    return reasons.length > 0 ? `Selected for ${reasons.join(', ')}` : 'Best available option';
  }

  private isProviderHealthy(providerName: string): boolean {
    const health = this.circuitBreaker.get(providerName);
    if (!health) return true;

    // Circuit breaker logic: fail if >5 failures in last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    if (health.failures >= 5 && health.lastFailure > fiveMinutesAgo) {
      return false;
    }

    return true;
  }

  private isProviderEnabled(providerName: string): boolean {
    // Check environment variables for conditional providers
    switch (providerName) {
      case 'hunyuan-3d':
        return process.env.ENABLE_HUNYUAN_3D === 'true';
      case 'wan-animate':
        return process.env.ENABLE_WAN_ANIMATE === 'true';
      default:
        return true;
    }
  }

  /**
   * Report a provider failure for circuit breaker tracking
   */
  reportFailure(providerName: string): void {
    const current = this.circuitBreaker.get(providerName) || { failures: 0, lastFailure: 0 };
    current.failures += 1;
    current.lastFailure = Date.now();
    this.circuitBreaker.set(providerName, current);
  }

  /**
   * Reset circuit breaker for a provider (manual recovery)
   */
  resetCircuitBreaker(providerName: string): void {
    this.circuitBreaker.delete(providerName);
  }

  /**
   * Get provider health status for monitoring
   */
  getProviderHealth(): Record<string, { healthy: boolean; failures: number; lastFailure?: number }> {
    const health: Record<string, any> = {};
    
    for (const [name] of this.providers) {
      const circuitState = this.circuitBreaker.get(name);
      health[name] = {
        healthy: this.isProviderHealthy(name),
        failures: circuitState?.failures || 0,
        lastFailure: circuitState?.lastFailure
      };
    }

    return health;
  }
}

// Singleton instance
export const providerSelector = new ProviderSelector();

/**
 * Convenience function for video provider selection
 */
export function selectVideoProvider(
  duration: number,
  mode: 'preview' | 'production' = 'production',
  priority: 'speed' | 'quality' | 'cost' = 'quality'
): ProviderSelection {
  return providerSelector.selectProvider({
    contentType: 'video',
    mode,
    duration,
    priority
  });
}

/**
 * Convenience function for image provider selection
 */
export function selectImageProvider(
  mode: 'preview' | 'production' = 'production',
  priority: 'speed' | 'quality' | 'cost' = 'quality'
): ProviderSelection {
  return providerSelector.selectProvider({
    contentType: 'image',
    mode,
    priority
  });
}