interface LongCatConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

interface VideoRequest {
  prompt: string;
  duration?: number;
  aspectRatio?: string;
  style?: string;
  quality?: string;
}

interface VideoResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  videoUrl?: string;
  video_url?: string;
}

export class LongCatClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config: LongCatConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.longcat.ai/v1';
    this.timeout = config.timeout || 30000; // 30s default
    this.retries = config.retries || 2;
  }

  private async withRetries<T>(fn: () => Promise<T>, operation: string): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx), only server errors and network issues
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        if (attempt < this.retries - 1) {
          const backoff = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
          if (process.env.DEBUG_LONGCAT === '1') {
            console.log(`[LongCat] ${operation} attempt ${attempt + 1} failed, retrying in ${backoff}ms:`, error.message);
          }
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }
    
    throw lastError;
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async generateVideo(request: VideoRequest): Promise<VideoResponse> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return this.withRetries(async () => {
      if (process.env.DEBUG_LONGCAT === '1') {
        console.log(`[LongCat] ${requestId} Generate request:`, {
          prompt: request.prompt.substring(0, 100),
          duration: request.duration,
          aspectRatio: request.aspectRatio
        });
      }

      const response = await this.fetchWithTimeout(`${this.baseUrl}/videos/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'User-Agent': 'AdGenXAI/1.0',
        },
        body: JSON.stringify(request),
      });

      const responseBody = await response.text();
      
      if (process.env.DEBUG_LONGCAT === '1') {
        console.log(`[LongCat] ${requestId} Response:`, {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          bodyLength: responseBody.length
        });
      }

      if (!response.ok) {
        const error = new Error(`LongCat API error: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).responseBody = responseBody;
        (error as any).requestId = requestId;
        throw error;
      }

      return JSON.parse(responseBody);
    }, `generateVideo-${requestId}`);
  }

  async getVideoStatus(videoId: string): Promise<VideoResponse> {
    const requestId = `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return this.withRetries(async () => {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/videos/${videoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Request-ID': requestId,
          'User-Agent': 'AdGenXAI/1.0',
        },
      });

      if (!response.ok) {
        const responseBody = await response.text();
        const error = new Error(`LongCat API error: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).responseBody = responseBody;
        (error as any).requestId = requestId;
        throw error;
      }

      return response.json() as Promise<VideoResponse>;
    }, `getVideoStatus-${videoId}`);
  }

  async cancelVideo(videoId: string): Promise<void> {
    return this.withRetries(async () => {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/videos/${videoId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'User-Agent': 'AdGenXAI/1.0',
        },
      });

      if (!response.ok) {
        const responseBody = await response.text();
        const error = new Error(`LongCat API error: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).responseBody = responseBody;
        throw error;
      }
    }, `cancelVideo-${videoId}`);
  }
}

export function createLongCatClient(config: LongCatConfig): LongCatClient {
  return new LongCatClient(config);
}