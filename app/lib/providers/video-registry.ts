/**
 * Video Provider Registry
 * 
 * Central registry for managing multiple AI video generation providers.
 * Supports dynamic provider switching, fallback chains, and cost optimization.
 */

import { LongCatClient, createLongCatClient, type LongCatVideoRequest, type LongCatVideoResponse } from './longcat-client';

// Provider identification
export type VideoProvider = 'sora' | 'longcat' | 'runway' | 'pika';

// Unified video request interface
export interface UnifiedVideoRequest {
  prompt: string;
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  style?: string;
  quality?: 'standard' | 'high' | 'ultra';
  provider?: VideoProvider;
  fallbackProviders?: VideoProvider[];
}

// Unified video response interface
export interface UnifiedVideoResponse {
  id: string;
  provider: VideoProvider;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  progress?: number;
  estimatedTimeRemaining?: number;
  metadata?: {
    prompt: string;
    style: string;
    aspectRatio: string;
    provider: VideoProvider;
    cost?: number;
  };
}

// Provider configuration
export interface VideoProviderConfig {
  enabled: boolean;
  priority: number; // Lower = higher priority
  costPerSecond?: number; // USD per second of video
  maxDuration?: number; // Max video duration in seconds
  supportedStyles?: string[];
  apiConfig?: Record<string, any>;
}

// Registry configuration
export interface VideoRegistryConfig {
  providers: Record<VideoProvider, VideoProviderConfig>;
  defaultProvider?: VideoProvider;
  fallbackEnabled?: boolean;
  costOptimization?: boolean;
}

/**
 * Video Provider Registry Class
 */
export class VideoProviderRegistry {
  private config: VideoRegistryConfig;
  private clients: Map<VideoProvider, any> = new Map();

  constructor(config: VideoRegistryConfig) {
    this.config = config;
    this.initializeClients();
  }

  /**
   * Generate video using the optimal provider
   */
  async generateVideo(request: UnifiedVideoRequest): Promise<UnifiedVideoResponse> {
    const provider = this.selectOptimalProvider(request);
    
    try {
      return await this.generateWithProvider(provider, request);
    } catch (error) {
      if (this.config.fallbackEnabled && request.fallbackProviders?.length) {
        console.warn(`Provider ${provider} failed, trying fallbacks:`, error);
        return await this.tryFallbackProviders(request, [provider]);
      }
      throw error;
    }
  }

  /**
   * Get video status from any provider
   */
  async getVideoStatus(videoId: string, provider: VideoProvider): Promise<UnifiedVideoResponse> {
    const client = this.clients.get(provider);
    if (!client) {
      throw new Error(`Provider ${provider} not available`);
    }

    const response = await this.callProviderMethod(client, provider, 'getVideoStatus', videoId);
    return this.normalizeResponse(response, provider);
  }

  /**
   * Wait for video completion with provider-specific polling
   */
  async waitForCompletion(
    videoId: string, 
    provider: VideoProvider,
    maxWaitTime?: number
  ): Promise<UnifiedVideoResponse> {
    const client = this.clients.get(provider);
    if (!client) {
      throw new Error(`Provider ${provider} not available`);
    }

    const response = await this.callProviderMethod(
      client, 
      provider, 
      'waitForCompletion', 
      videoId, 
      5000, // poll interval
      maxWaitTime || 600000 // 10 minutes default
    );
    
    return this.normalizeResponse(response, provider);
  }

  /**
   * Cancel video generation
   */
  async cancelVideo(videoId: string, provider: VideoProvider): Promise<void> {
    const client = this.clients.get(provider);
    if (!client) {
      throw new Error(`Provider ${provider} not available`);
    }

    await this.callProviderMethod(client, provider, 'cancelVideo', videoId);
  }

  /**
   * List available providers and their status
   */
  getAvailableProviders(): Array<{ provider: VideoProvider; config: VideoProviderConfig }> {
    return Object.entries(this.config.providers)
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => a.priority - b.priority)
      .map(([provider, config]) => ({ 
        provider: provider as VideoProvider, 
        config 
      }));
  }

  /**
   * Estimate cost for a video generation request
   */
  estimateCost(request: UnifiedVideoRequest): Array<{ provider: VideoProvider; cost: number }> {
    const duration = request.duration || 10;
    const estimates: Array<{ provider: VideoProvider; cost: number }> = [];

    Object.entries(this.config.providers).forEach(([provider, config]) => {
      if (config.enabled && config.costPerSecond) {
        estimates.push({
          provider: provider as VideoProvider,
          cost: duration * config.costPerSecond,
        });
      }
    });

    return estimates.sort((a, b) => a.cost - b.cost);
  }

  private initializeClients(): void {
    // Initialize LongCat client
    if (this.config.providers.longcat?.enabled) {
      try {
        const longcatClient = createLongCatClient(this.config.providers.longcat.apiConfig);
        this.clients.set('longcat', longcatClient);
      } catch (error) {
        console.warn('Failed to initialize LongCat client:', error);
      }
    }

    // TODO: Initialize other providers (Sora, Runway, Pika)
    // if (this.config.providers.sora?.enabled) {
    //   const soraClient = createSoraClient(this.config.providers.sora.apiConfig);
    //   this.clients.set('sora', soraClient);
    // }
  }

  private selectOptimalProvider(request: UnifiedVideoRequest): VideoProvider {
    // Use explicitly requested provider if available
    if (request.provider && this.config.providers[request.provider]?.enabled) {
      return request.provider;
    }

    // Use default provider if configured
    if (this.config.defaultProvider && this.config.providers[this.config.defaultProvider]?.enabled) {
      return this.config.defaultProvider;
    }

    // Cost optimization: select cheapest provider if enabled
    if (this.config.costOptimization) {
      const estimates = this.estimateCost(request);
      if (estimates.length > 0) {
        return estimates[0].provider;
      }
    }

    // Fallback: use highest priority provider
    const available = this.getAvailableProviders();
    if (available.length === 0) {
      throw new Error('No video providers are enabled');
    }

    return available[0].provider;
  }

  private async generateWithProvider(
    provider: VideoProvider, 
    request: UnifiedVideoRequest
  ): Promise<UnifiedVideoResponse> {
    const client = this.clients.get(provider);
    if (!client) {
      throw new Error(`Provider ${provider} not available`);
    }

    // Convert unified request to provider-specific format
    const providerRequest = this.convertRequest(request, provider);
    
    // Call provider-specific generate method
    const response = await this.callProviderMethod(client, provider, 'generateVideo', providerRequest);
    
    return this.normalizeResponse(response, provider);
  }

  private async tryFallbackProviders(
    request: UnifiedVideoRequest,
    failedProviders: VideoProvider[]
  ): Promise<UnifiedVideoResponse> {
    const fallbacks = request.fallbackProviders || this.getAvailableProviders().map(p => p.provider);
    
    for (const provider of fallbacks) {
      if (failedProviders.includes(provider)) continue;
      
      try {
        return await this.generateWithProvider(provider, request);
      } catch (error) {
        console.warn(`Fallback provider ${provider} also failed:`, error);
        failedProviders.push(provider);
      }
    }
    
    throw new Error(`All providers failed: ${failedProviders.join(', ')}`);
  }

  private convertRequest(request: UnifiedVideoRequest, provider: VideoProvider): any {
    switch (provider) {
      case 'longcat':
        return {
          prompt: request.prompt,
          duration: request.duration,
          aspectRatio: request.aspectRatio,
          style: request.style,
          quality: request.quality,
        } as LongCatVideoRequest;
      
      // TODO: Add conversions for other providers
      default:
        return request;
    }
  }

  private async callProviderMethod(client: any, provider: VideoProvider, method: string, ...args: any[]): Promise<any> {
    if (typeof client[method] !== 'function') {
      throw new Error(`Method ${method} not supported by provider ${provider}`);
    }
    
    return await client[method](...args);
  }

  private normalizeResponse(response: any, provider: VideoProvider): UnifiedVideoResponse {
    // Base normalization that works for LongCat format
    const normalized: UnifiedVideoResponse = {
      id: response.id,
      provider,
      status: response.status,
      videoUrl: response.videoUrl,
      thumbnailUrl: response.thumbnailUrl,
      duration: response.duration,
      progress: response.progress,
      estimatedTimeRemaining: response.estimatedTimeRemaining,
    };

    // Add metadata if available
    if (response.metadata) {
      normalized.metadata = {
        ...response.metadata,
        provider,
      };
    }

    return normalized;
  }
}

/**
 * Create a video registry with environment-based configuration
 */
export function createVideoRegistry(customConfig?: Partial<VideoRegistryConfig>): VideoProviderRegistry {
  const defaultConfig: VideoRegistryConfig = {
    providers: {
      longcat: {
        enabled: !!process.env.LONGCAT_API_KEY,
        priority: 1,
        costPerSecond: 0.12, // Estimated cost
        maxDuration: 60,
        supportedStyles: ['cinematic', 'artistic', 'realistic', 'animated', 'documentary'],
        apiConfig: {
          apiKey: process.env.LONGCAT_API_KEY,
        },
      },
      sora: {
        enabled: !!process.env.OPENAI_API_KEY,
        priority: 2,
        costPerSecond: 0.15, // Estimated cost
        maxDuration: 20,
        supportedStyles: ['realistic', 'cinematic'],
        apiConfig: {
          apiKey: process.env.OPENAI_API_KEY,
        },
      },
      runway: {
        enabled: false, // Not implemented yet
        priority: 3,
        costPerSecond: 0.10,
        maxDuration: 10,
        supportedStyles: ['artistic', 'animated'],
      },
      pika: {
        enabled: false, // Not implemented yet
        priority: 4,
        costPerSecond: 0.08,
        maxDuration: 4,
        supportedStyles: ['animated', 'artistic'],
      },
    },
    defaultProvider: 'longcat',
    fallbackEnabled: true,
    costOptimization: false,
  };

  const finalConfig = {
    ...defaultConfig,
    ...customConfig,
    providers: {
      ...defaultConfig.providers,
      ...customConfig?.providers,
    },
  };

  return new VideoProviderRegistry(finalConfig);
}