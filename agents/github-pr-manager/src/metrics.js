// src/metrics.js
const client = require('prom-client');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Collect default metrics (memory, CPU, etc.)
client.collectDefaultMetrics({ timeout: 5000 });

// Custom metrics for GitHub webhook processing
const queueGauge = new client.Gauge({
  name: 'github_webhook_queue_length',
  help: 'Length of the Redis queue for incoming webhooks (LLEN queue:github-webhook)'
});

const processedCounter = new client.Counter({
  name: 'github_webhook_processed_total',
  help: 'Total number of processed webhook events',
  labelNames: ['event_type', 'status']
});

const errorCounter = new client.Counter({
  name: 'github_webhook_errors_total',
  help: 'Total number of webhook processing errors',
  labelNames: ['error_type', 'component']
});

const processingDuration = new client.Histogram({
  name: 'github_webhook_processing_duration_seconds',
  help: 'Time spent processing webhook events',
  labelNames: ['event_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

const activeConnections = new client.Gauge({
  name: 'github_webhook_active_connections',
  help: 'Number of active webhook connections'
});

const rateLimitGauge = new client.Gauge({
  name: 'github_api_rate_limit_remaining',
  help: 'GitHub API rate limit remaining',
  labelNames: ['resource']
});

async function updateQueueLength() {
  try {
    const key = process.env.WEBHOOK_QUEUE_KEY || 'queue:github-webhook';
    const len = await redis.llen(key);
    queueGauge.set(len);
  } catch (err) {
    // don't crash on metrics errors
    console.error('metrics:updateQueueLength error', err && err.message);
    errorCounter.inc({ error_type: 'metrics_collection', component: 'redis' });
  }
}

async function updateQueueStats() {
  try {
    const key = process.env.WEBHOOK_QUEUE_KEY || 'queue:github-webhook';
    
    // Get queue length
    const len = await redis.llen(key);
    queueGauge.set(len);
    
    // Check for stuck/old items (optional - requires timestamp tracking)
    const oldestItem = await redis.lindex(key, -1);
    if (oldestItem) {
      try {
        const parsed = JSON.parse(oldestItem);
        if (parsed.timestamp) {
          const age = Date.now() - parsed.timestamp;
          const ageMinutes = age / (1000 * 60);
          if (ageMinutes > 30) { // Alert if items are older than 30 minutes
            console.warn(`Old webhook item in queue: ${ageMinutes.toFixed(1)} minutes old`);
          }
        }
      } catch (e) {
        // Ignore parsing errors for legacy items
      }
    }
  } catch (err) {
    console.error('metrics:updateQueueStats error', err && err.message);
    errorCounter.inc({ error_type: 'metrics_collection', component: 'redis' });
  }
}

// Poll every 5 seconds
const POLL_MS = Number(process.env.METRICS_POLL_MS) || 5000;
const poll = setInterval(updateQueueStats, POLL_MS);
updateQueueStats(); // Initial call

function attachMetricsEndpoint(app) {
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    } catch (err) {
      console.error('Error collecting metrics:', err);
      res.status(500).send('Error collecting metrics');
    }
  });
  
  // Health check endpoint that includes metric collection health
  app.get('/health', async (req, res) => {
    try {
      // Test Redis connection
      await redis.ping();
      
      // Test queue access
      const queueKey = process.env.WEBHOOK_QUEUE_KEY || 'queue:github-webhook';
      await redis.llen(queueKey);
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          redis: 'ok',
          metrics: 'ok',
          queue: 'accessible'
        }
      });
    } catch (err) {
      console.error('Health check failed:', err);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: err.message,
        checks: {
          redis: err.message.includes('redis') ? 'failed' : 'unknown',
          metrics: 'degraded',
          queue: 'unknown'
        }
      });
    }
  });

  // Readiness check - similar to health but for Kubernetes readiness probe
  app.get('/ready', async (req, res) => {
    try {
      // Test Redis connection
      await redis.ping();
      
      // Check if we can process webhooks
      const queueKey = process.env.WEBHOOK_QUEUE_KEY || 'queue:github-webhook';
      const queueLen = await redis.llen(queueKey);
      
      // Consider ready if queue is accessible and not overwhelmed
      const isReady = queueLen < 1000; // Adjust threshold as needed
      
      if (isReady) {
        res.json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          queue_length: queueLen
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          reason: 'queue_overwhelmed',
          queue_length: queueLen
        });
      }
    } catch (err) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: err.message
      });
    }
  });
}

// Helper functions for instrumentation
function recordWebhookProcessed(eventType, status = 'success') {
  processedCounter.inc({ event_type: eventType, status });
}

function recordWebhookError(errorType, component = 'processor') {
  errorCounter.inc({ error_type: errorType, component });
}

function recordProcessingTime(eventType, durationSeconds) {
  processingDuration.observe({ event_type: eventType }, durationSeconds);
}

function setActiveConnections(count) {
  activeConnections.set(count);
}

function updateRateLimit(resource, remaining) {
  rateLimitGauge.set({ resource }, remaining);
}

// Graceful shutdown
function gracefulShutdown() {
  if (poll) {
    clearInterval(poll);
  }
  if (redis) {
    redis.disconnect();
  }
}

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = {
  attachMetricsEndpoint,
  recordWebhookProcessed,
  recordWebhookError,
  recordProcessingTime,
  setActiveConnections,
  updateRateLimit,
  processedCounter,
  errorCounter,
  queueGauge,
  gracefulShutdown,
  _internal: { redis, poll } // for tests or manual cleanup
};
