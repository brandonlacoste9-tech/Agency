export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    try {
        const githubEvent = event.headers['x-github-event'];
        const deliveryId = event.headers['x-github-delivery'];
        const payload = JSON.parse(event.body || '{}');
        console.log('📥 Webhook received:', {
            event: githubEvent,
            deliveryId,
            repository: payload.repository?.full_name,
            action: payload.action,
            timestamp: new Date().toISOString()
        });
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                received: true,
                deliveryId,
                event: githubEvent,
                message: '🧠 AdgenXAI Sensory Cortex - Event Processed',
                timestamp: new Date().toISOString()
            })
        };
    }
    catch (error) {
        console.error('❌ Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown'
            })
        };
    }
};
