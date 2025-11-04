import PQueue from 'p-queue';
import { createClient } from 'redis';

// Worker pool configuration
const WEBHOOK_WORKER_CONCURRENCY = Number(process.env.WEBHOOK_WORKER_CONCURRENCY || 8);
const QUEUE_SIZE_LIMIT = Number(process.env.QUEUE_SIZE_LIMIT || 1000);

// Create queue with backpressure control
export const webhookQueue = new PQueue({ 
  concurrency: WEBHOOK_WORKER_CONCURRENCY,
  // Throw error if queue gets too large (prevents memory exhaustion)
  throwOnTimeout: true,
  timeout: 60000 // 1 minute timeout per job
});

// Redis-based agent toggle system
let redisClient = null;
const AGENTS_ENABLED_KEY = 'agents:enabled';

export async function initializeRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    
    redisClient.on('connect', () => {
      console.info('Connected to Redis for agent control');
    });
    
    await redisClient.connect();
  }
  return redisClient;
}

export async function isAgentsEnabled() {
  try {
    if (!redisClient) {
      await initializeRedis();
    }
    
    const value = await redisClient.get(AGENTS_ENABLED_KEY);
    
    // Default to true if not set (fail-open for availability)
    if (value === null) return true;
    
    return value === '1' || value.toLowerCase() === 'true';
  } catch (error) {
    console.warn('Failed to check agent status from Redis, defaulting to enabled:', error.message);
    return true; // Fail-open for availability
  }
}

export async function setAgentsEnabled(enabled) {
  try {
    if (!redisClient) {
      await initializeRedis();
    }
    
    await redisClient.set(AGENTS_ENABLED_KEY, enabled ? '1' : '0');
    console.info(`Agents ${enabled ? 'ENABLED' : 'DISABLED'} via Redis toggle`);
    return true;
  } catch (error) {
    console.error('Failed to set agent status in Redis:', error.message);
    throw error;
  }
}

// Queue job processor with error handling
export async function addWebhookJob(processor, payload) {
  // Check if agents are enabled before processing
  if (!(await isAgentsEnabled())) {
    console.info('Agents disabled - skipping webhook processing');
    return { status: 'agents-disabled', message: 'Webhook processing is currently disabled' };
  }

  // Check queue size for backpressure
  if (webhookQueue.size >= QUEUE_SIZE_LIMIT) {
    console.warn(`Queue size limit reached (${QUEUE_SIZE_LIMIT}), rejecting webhook`);
    throw new Error('Queue overloaded - try again later');
  }

  // Add job to queue with error handling
  return webhookQueue.add(async () => {
    try {
      console.debug(`Processing webhook job. Queue size: ${webhookQueue.size}, pending: ${webhookQueue.pending}`);
      const result = await processor(payload);
      console.debug('Webhook job completed successfully');
      return result;
    } catch (error) {
      console.error('Webhook job failed:', error.message);
      // Re-throw to trigger circuit breaker
      throw error;
    }
  });
}

// Queue monitoring and stats
export function getQueueStats() {
  return {
    size: webhookQueue.size,
    pending: webhookQueue.pending,
    concurrency: webhookQueue.concurrency,
    isPaused: webhookQueue.isPaused,
    sizeLimit: QUEUE_SIZE_LIMIT
  };
}

// Graceful queue draining
export async function drainQueue() {
  console.info('Draining webhook queue...');
  await webhookQueue.onIdle();
  console.info('Webhook queue drained successfully');
}

// Pause/resume queue operations
export function pauseQueue() {
  webhookQueue.pause();
  console.info('Webhook queue paused');
}

export function resumeQueue() {
  webhookQueue.start();
  console.info('Webhook queue resumed');
}

// Cleanup function
export async function cleanup() {
  if (redisClient) {
    await redisClient.quit();
    console.info('Redis connection closed');
  }
}
