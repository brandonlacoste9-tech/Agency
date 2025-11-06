import { createLongCatClient } from './lib/longcat-client';
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
};
const client = createLongCatClient({
    apiKey: process.env.LONGCAT_API_KEY || '',
    baseUrl: process.env.LONGCAT_BASE_URL,
});
export const handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: '',
        };
    }
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
    const videoId = event.queryStringParameters?.id;
    if (!videoId) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
                error: 'Video ID is required',
                usage: 'GET /sora-status?id=VIDEO_ID'
            }),
        };
    }
    if (!process.env.LONGCAT_API_KEY) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Video service not configured' }),
        };
    }
    try {
        const result = await client.getVideoStatus(videoId);
        const response = {
            id: result.id,
            status: result.status,
            progress: result.progress || 0,
            video_url: result.videoUrl || result.video_url,
            provider: 'longcat',
        };
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(response),
        };
    }
    catch (error) {
        console.error('❌ LongCat status error:', {
            videoId,
            message: error.message,
            status: error.status,
            timestamp: new Date().toISOString()
        });
        return {
            statusCode: error.status || 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: error.message || 'Failed to get video status',
                videoId,
                provider: 'longcat',
            }),
        };
    }
};
