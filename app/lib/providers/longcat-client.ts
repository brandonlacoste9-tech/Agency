/**
 * LongCat Video Generation Client
 * 
 * Advanced AI video generation with cinematic quality and extended duration support.
 * Designed as a Sora alternative with enhanced prompt engineering and style controls.
 */

export interface LongCatConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface LongCatVideoRequest {
  prompt: string;
  duration?: number; // seconds, max 60 for LongCat
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  style?: 'cinematic' | 'artistic' | 'realistic' | 'animated' | 'documentary';
  quality?: 'standard' | 'high' | 'ultra';
  seed?: number;
  guidance?: number; // 1-20, controls adherence to prompt
}

export interface LongCatVideoResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  progress?: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  metadata?: {
    prompt: string;
    style: string;
    aspectRatio: string;
    seed: number;
  };
}

export class LongCatClient {
  private config: Required<LongCatConfig>;

  constructor(config: LongCatConfig) {
    this.config = {
      baseUrl: 'https://api.longcat.ai/v1',
      timeout: 300000, // 5 minutes
      retryAttempts: 3,
      ...config,
    };
  }

  /**
   * Generate a video from a text prompt
   */
  async generateVideo(request: LongCatVideoRequest): Promise<LongCatVideoResponse> {
    const response = await this.makeRequest('/videos/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: request.prompt,
        duration: request.duration || 10,
        aspect_ratio: request.aspectRatio || '16:9',
        style: request.style || 'cinematic',
        quality: request.quality || 'high',
        seed: request.seed,
        guidance: request.guidance || 7.5,
      }),
    });

    return this.transformResponse(response);
  }

  /**
   * Check the status of a video generation job
   */
  async getVideoStatus(videoId: string): Promise<LongCatVideoResponse> {
    const response = await this.makeRequest(`/videos/${videoId}`);
    return this.transformResponse(response);
  }

  /**
   * Wait for video generation to complete with polling
   */
  async waitForCompletion(
    videoId: string, 
    pollInterval = 5000,
    maxWaitTime = 600000 // 10 minutes
  ): Promise<LongCatVideoResponse> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getVideoStatus(videoId);
      
      if (status.status === 'completed') {
        return status;
      }
      
      if (status.status === 'failed') {
        throw new Error(`Video generation failed for ID: ${videoId}`);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error(`Video generation timed out for ID: ${videoId}`);
  }

  /**
   * Cancel a video generation job
   */
  async cancelVideo(videoId: string): Promise<void> {
    await this.makeRequest(`/videos/${videoId}/cancel`, {
      method: 'POST',
    });
  }

  /**
   * List recent video generations
   */
  async listVideos(limit = 20, offset = 0): Promise<LongCatVideoResponse[]> {
    const response = await this.makeRequest(`/videos?limit=${limit}&offset=${offset}`);
    return response.videos.map((video: any) => this.transformResponse(video));
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AdGenXAI/1.0',
      },
      timeout: this.config.timeout,
    };

    const requestOptions = { ...defaultOptions, ...options };
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`LongCat API error: ${response.status} - ${errorData.message || errorData.error || 'Unknown error'}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.config.retryAttempts) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  private transformResponse(rawResponse: any): LongCatVideoResponse {
    return {
      id: rawResponse.id,
      status: rawResponse.status,
      videoUrl: rawResponse.video_url,
      thumbnailUrl: rawResponse.thumbnail_url,
      duration: rawResponse.duration,
      progress: rawResponse.progress,
      estimatedTimeRemaining: rawResponse.estimated_time_remaining,
      metadata: rawResponse.metadata ? {
        prompt: rawResponse.metadata.prompt,
        style: rawResponse.metadata.style,
        aspectRatio: rawResponse.metadata.aspect_ratio,
        seed: rawResponse.metadata.seed,
      } : undefined,
    };
  }
}

/**
 * Convenience function to create a LongCat client with environment variables
 */
export function createLongCatClient(config?: Partial<LongCatConfig>): LongCatClient {
  const apiKey = config?.apiKey || process.env.LONGCAT_API_KEY;
  
  if (!apiKey) {
    throw new Error('LongCat API key is required. Set LONGCAT_API_KEY environment variable or pass it in config.');
  }
  
  return new LongCatClient({
    apiKey,
    ...config,
  });
}

// Export types for external use
export type { LongCatConfig, LongCatVideoRequest, LongCatVideoResponse };