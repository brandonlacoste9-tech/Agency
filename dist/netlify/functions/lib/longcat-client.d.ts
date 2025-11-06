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
export declare class LongCatClient {
    private apiKey;
    private baseUrl;
    private timeout;
    private retries;
    constructor(config: LongCatConfig);
    private withRetries;
    private fetchWithTimeout;
    generateVideo(request: VideoRequest): Promise<VideoResponse>;
    getVideoStatus(videoId: string): Promise<VideoResponse>;
    cancelVideo(videoId: string): Promise<void>;
}
export declare function createLongCatClient(config: LongCatConfig): LongCatClient;
export {};
