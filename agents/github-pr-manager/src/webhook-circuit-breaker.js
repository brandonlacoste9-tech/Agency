import CircuitBreaker from 'opossum';
import client from 'prom-client';

// Create metrics if they don't exist
const processedCounter = new client.Counter({
  name: 'webhooks_processed_total',
  help: 'Total number of webhooks processed successfully'
});

const errorCounter = new client.Counter({
  name: 'webhooks_errors_total',
  help: 'Total number of webhook processing errors'
});

// Circuit breaker configuration for webhook processing
const breakerOpts = {
  timeout: 10000,                 // fail slow requests (10s)
  errorThresholdPercentage: 50,   // open after 50% errors
  resetTimeout: 30000,            // try half-open after 30s
  rollingCountTimeout: 60000,     // time window for error threshold
  rollingCountBuckets: 10,        // number of buckets in rolling window
  volumeThreshold: 10,            // minimum calls before circuit can open
  allowWarmUp: true,              // allow gradual ramp-up after reset
  capacity: 100                   // maximum queue size
};

// Dead letter queue for failed webhook processing
const deadLetterQueue = [];

async function enqueueDeadLetter(payload) {
  deadLetterQueue.push({
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0
  });
  console.warn(`Enqueued webhook to dead letter queue. Queue size: ${deadLetterQueue.length}`);
}

// Create the circuit breaker (will be initialized with processor function)
export function createWebhookBreaker(processWebhook) {
  const webhookBreaker = new CircuitBreaker(processWebhook, breakerOpts);

  // Observability hooks
  webhookBreaker.on('success', () => {
    processedCounter.inc();
    console.debug('Webhook processed successfully');
  });

  webhookBreaker.on('failure', (err) => {
    errorCounter.inc();
    console.error('Webhook processing failed:', err.message);
  });

  webhookBreaker.on('open', () => {
    console.warn('🔴 Circuit breaker OPEN for webhook processor - too many failures');
  });

  webhookBreaker.on('halfOpen', () => {
    console.info('🟡 Circuit breaker HALF-OPEN - testing recovery');
  });

  webhookBreaker.on('close', () => {
    console.info('🟢 Circuit breaker CLOSED - system recovered');
  });

  webhookBreaker.on('reject', () => {
    console.warn('Circuit breaker rejected request - system overloaded');
  });

  // Fallback: best-effort enqueue to dead-letter queue for later reprocessing
  webhookBreaker.fallback(async (args) => {
    const payload = Array.isArray(args) ? args[0] : args;
    await enqueueDeadLetter(payload);
    return { 
      status: 'enqueued-dead-letter',
      message: 'Webhook processing circuit open - enqueued for retry'
    };
  });

  return webhookBreaker;
}

// Dead letter queue management
export function getDeadLetterStats() {
  return {
    queueSize: deadLetterQueue.length,
    items: deadLetterQueue.slice(-10) // last 10 items for inspection
  };
}

export function clearDeadLetterQueue() {
  const count = deadLetterQueue.length;
  deadLetterQueue.length = 0;
  console.info(`Cleared ${count} items from dead letter queue`);
  return count;
}
