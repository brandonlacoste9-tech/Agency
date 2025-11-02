import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LongCatClient, createLongCatClient, type LongCatVideoRequest } from '../longcat-client';

// Mock fetch globally
global.fetch = vi.fn();

describe('LongCatClient', () => {
  let client: LongCatClient;
  const mockConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.longcat.ai/v1',
    timeout: 30000,
    retryAttempts: 2,
  };

  beforeEach(() => {
    client = new LongCatClient(mockConfig);
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateVideo', () => {
    it('should generate a video with default parameters', async () => {
      const mockResponse = {
        id: 'video-123',
        status: 'queued',
        progress: 0,
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request: LongCatVideoRequest = {
        prompt: 'A majestic lion walking through the savanna at sunset',
      };

      const result = await client.generateVideo(request);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.longcat.ai/v1/videos/generate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            prompt: 'A majestic lion walking through the savanna at sunset',
            duration: 10,
            aspect_ratio: '16:9',
            style: 'cinematic',
            quality: 'high',
            guidance: 7.5,
          }),
        })
      );

      expect(result).toEqual({
        id: 'video-123',
        status: 'queued',
        progress: 0,
      });
    });

    it('should generate a video with custom parameters', async () => {
      const mockResponse = {
        id: 'video-456',
        status: 'processing',
        progress: 25,
        estimated_time_remaining: 120,
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const request: LongCatVideoRequest = {
        prompt: 'Futuristic city with flying cars',
        duration: 30,
        aspectRatio: '9:16',
        style: 'animated',
        quality: 'ultra',
        seed: 12345,
        guidance: 15,
      };

      const result = await client.generateVideo(request);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.longcat.ai/v1/videos/generate',
        expect.objectContaining({
          body: JSON.stringify({
            prompt: 'Futuristic city with flying cars',
            duration: 30,
            aspect_ratio: '9:16',
            style: 'animated',
            quality: 'ultra',
            seed: 12345,
            guidance: 15,
          }),
        })
      );

      expect(result).toEqual({
        id: 'video-456',
        status: 'processing',
        progress: 25,
        estimatedTimeRemaining: 120,
      });
    });

    it('should handle API errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Invalid prompt' }),
      });

      const request: LongCatVideoRequest = {
        prompt: '',
      };

      await expect(client.generateVideo(request)).rejects.toThrow(
        'LongCat API error: 400 - Invalid prompt'
      );
    });
  });

  describe('getVideoStatus', () => {
    it('should fetch video status', async () => {
      const mockResponse = {
        id: 'video-123',
        status: 'completed',
        video_url: 'https://storage.longcat.ai/videos/video-123.mp4',
        thumbnail_url: 'https://storage.longcat.ai/thumbnails/video-123.jpg',
        duration: 10,
        progress: 100,
        metadata: {
          prompt: 'A majestic lion',
          style: 'cinematic',
          aspect_ratio: '16:9',
          seed: 42,
        },
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.getVideoStatus('video-123');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.longcat.ai/v1/videos/video-123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );

      expect(result).toEqual({
        id: 'video-123',
        status: 'completed',
        videoUrl: 'https://storage.longcat.ai/videos/video-123.mp4',
        thumbnailUrl: 'https://storage.longcat.ai/thumbnails/video-123.jpg',
        duration: 10,
        progress: 100,
        metadata: {
          prompt: 'A majestic lion',
          style: 'cinematic',
          aspectRatio: '16:9',
          seed: 42,
        },
      });
    });
  });

  describe('waitForCompletion', () => {
    it('should poll until completion', async () => {
      const processingResponse = {
        id: 'video-123',
        status: 'processing',
        progress: 50,
      };

      const completedResponse = {
        id: 'video-123',
        status: 'completed',
        video_url: 'https://storage.longcat.ai/videos/video-123.mp4',
        progress: 100,
      };

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(processingResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(completedResponse),
        });

      // Mock setTimeout to avoid actual delays in tests
      vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return 1 as any;
      });

      const result = await client.waitForCompletion('video-123', 100, 1000);

      expect(result.status).toBe('completed');
      expect(result.videoUrl).toBe('https://storage.longcat.ai/videos/video-123.mp4');
    });

    it('should throw error if video generation fails', async () => {
      const failedResponse = {
        id: 'video-123',
        status: 'failed',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(failedResponse),
      });

      await expect(client.waitForCompletion('video-123')).rejects.toThrow(
        'Video generation failed for ID: video-123'
      );
    });
  });

  describe('cancelVideo', () => {
    it('should cancel a video generation', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await client.cancelVideo('video-123');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.longcat.ai/v1/videos/video-123/cancel',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('listVideos', () => {
    it('should list videos with pagination', async () => {
      const mockResponse = {
        videos: [
          {
            id: 'video-1',
            status: 'completed',
            video_url: 'https://storage.longcat.ai/videos/video-1.mp4',
          },
          {
            id: 'video-2',
            status: 'processing',
            progress: 75,
          },
        ],
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listVideos(10, 5);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.longcat.ai/v1/videos?limit=10&offset=5',
        expect.any(Object)
      );

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('video-1');
      expect(result[1].id).toBe('video-2');
    });
  });

  describe('retry logic', () => {
    it('should retry failed requests', async () => {
      // First call fails, second succeeds
      (fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'video-123', status: 'queued' }),
        });

      // Mock setTimeout to avoid delays
      vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return 1 as any;
      });

      const request: LongCatVideoRequest = {
        prompt: 'Test prompt',
      };

      const result = await client.generateVideo(request);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result.id).toBe('video-123');
    });

    it('should throw error after max retry attempts', async () => {
      // All calls fail
      (fetch as any).mockRejectedValue(new Error('Network error'));

      // Mock setTimeout to avoid delays
      vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        fn();
        return 1 as any;
      });

      const request: LongCatVideoRequest = {
        prompt: 'Test prompt',
      };

      await expect(client.generateVideo(request)).rejects.toThrow('Network error');
      expect(fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry (configured retryAttempts: 2)
    });
  });
});

describe('createLongCatClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create client with environment variable', () => {
    process.env.LONGCAT_API_KEY = 'env-api-key';

    const client = createLongCatClient();

    expect(client).toBeInstanceOf(LongCatClient);
  });

  it('should create client with config override', () => {
    process.env.LONGCAT_API_KEY = 'env-api-key';

    const client = createLongCatClient({
      apiKey: 'config-api-key',
      timeout: 60000,
    });

    expect(client).toBeInstanceOf(LongCatClient);
  });

  it('should throw error when no API key is provided', () => {
    delete process.env.LONGCAT_API_KEY;

    expect(() => createLongCatClient()).toThrow(
      'LongCat API key is required. Set LONGCAT_API_KEY environment variable or pass it in config.'
    );
  });
});