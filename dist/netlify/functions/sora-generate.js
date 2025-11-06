import { createLongCatClient } from './lib/longcat-client';
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
};
// Feature flag for safe rollback
const useLongCat = process.env.USE_LONGCAT !== '0'; // default to true
const client = createLongCatClient({
    apiKey: process.env.LONGCAT_API_KEY || '',
    baseUrl: process.env.LONGCAT_BASE_URL,
});
export const handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: '',
        };
    }
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
    // Feature flag fallback
    if (!useLongCat) {
        return {
            statusCode: 501,
            headers: corsHeaders,
            body: JSON.stringify({
                error: 'Sora service temporarily unavailable',
                message: 'LongCat adapter disabled via USE_LONGCAT=0'
            }),
        };
    }
    if (!process.env.LONGCAT_API_KEY) {
        console.error('LONGCAT_API_KEY not configured');
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Video service not configured' }),
        };
    }
    try {
        const request = JSON.parse(event.body || '{}');
        if (!request.prompt || request.prompt.trim().length === 0) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Prompt is required and cannot be empty' }),
            };
        }
        // Map Sora request format to LongCat format
        const longcatRequest = {
            prompt: request.prompt.trim(),
            duration: Math.min(Math.max(request.duration || 10, 5), 60), // 5-60s range
            aspectRatio: request.aspect_ratio || '16:9',
            style: request.style || 'cinematic',
            quality: request.quality || 'high',
        };
        console.log('📹 Video generation request:', {
            prompt: longcatRequest.prompt.substring(0, 100),
            duration: longcatRequest.duration,
            aspectRatio: longcatRequest.aspectRatio,
            timestamp: new Date().toISOString()
        });
        const result = await client.generateVideo(longcatRequest);
        // Map LongCat response to Sora-compatible format
        const response = {
            id: result.id,
            status: result.status,
            progress: result.progress || 0,
            video_url: result.videoUrl || result.video_url, // support both field names
            message: 'Video generation started successfully',
            provider: 'longcat', // for debugging
        };
        console.log('✅ Video generation initiated:', {
            id: result.id,
            status: result.status,
            timestamp: new Date().toISOString()
        });
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(response),
        };
    }
    catch (error) {
        console.error('❌ LongCat generation error:', {
            message: error.message,
            status: error.status,
            requestId: error.requestId,
            timestamp: new Date().toISOString()
        });
        const status = error.status || 500;
        const response = {
            error: error.message || 'Video generation failed',
            provider: 'longcat',
            requestId: error.requestId,
        };
        // Include debug details in development
        if (process.env.NODE_ENV === 'development' && error.responseBody) {
            response.details = error.responseBody;
        }
        return {
            statusCode: status,
            headers: corsHeaders,
            body: JSON.stringify(response),
        };
    }
};
