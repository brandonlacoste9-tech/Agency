import client from 'prom-client';

// Enhanced metrics for production monitoring
export const webhookCircuitOpenGauge = new client.Gauge({
  name: 'webhook_circuit_breaker_open',
  help: 'Whether the webhook circuit breaker is open (1) or closed (0)'
});

export const webhookQueueSizeGauge = new client.Gauge({
  name: 'webhook_queue_size',
  help: 'Current number of webhooks in processing queue'
});

export const webhookQueuePendingGauge = new client.Gauge({
  name: 'webhook_queue_pending',
  help: 'Current number of pending webhook jobs'
});

export const agentsEnabledGauge = new client.Gauge({
  name: 'agents_enabled',
  help: 'Whether agents are currently enabled (1) or disabled (0)'
});

export const deadLetterQueueSizeGauge = new client.Gauge({
  name: 'dead_letter_queue_size',
  help: 'Number of webhooks in dead letter queue awaiting retry'
});

export const webhookProcessingDurationHistogram = new client.Histogram({
  name: 'webhook_processing_duration_seconds',
  help: 'Time spent processing webhooks',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60] // seconds
});

export const githubApiCallsCounter = new client.Counter({
  name: 'github_api_calls_total',
  help: 'Total number of GitHub API calls made',
  labelNames: ['method', 'endpoint', 'status']
});

export const githubApiRateLimitGauge = new client.Gauge({
  name: 'github_api_rate_limit_remaining',
  help: 'Remaining GitHub API rate limit'
});

export const systemHealthGauge = new client.Gauge({
  name: 'system_health_score',
  help: 'Overall system health score (0-1)',
  labelNames: ['component']
});

// Circuit breaker specific metrics
export const circuitBreakerStatsGauge = new client.Gauge({
  name: 'circuit_breaker_stats',
  help: 'Circuit breaker statistics',
  labelNames: ['stat'] // success_rate, failure_rate, etc.
});

// Agent operation metrics
export const agentOperationsCounter = new client.Counter({
  name: 'agent_operations_total',
  help: 'Total number of agent operations performed',
  labelNames: ['operation', 'status'] // merge, comment, label, etc.
});

export const agentErrorsCounter = new client.Counter({
  name: 'agent_errors_total',
  help: 'Total number of agent errors encountered',
  labelNames: ['error_type', 'component']
});

// Update functions for real-time metrics
export function updateCircuitBreakerMetrics(breaker) {
  if (breaker && breaker.stats) {
    const stats = breaker.stats;
    circuitBreakerStatsGauge.set({ stat: 'success_rate' }, stats.successRate || 0);
    circuitBreakerStatsGauge.set({ stat: 'failure_rate' }, stats.failureRate || 0);
    circuitBreakerStatsGauge.set({ stat: 'request_count' }, stats.requests || 0);
  }
}

export function updateQueueMetrics(queueStats) {
  webhookQueueSizeGauge.set(queueStats.size || 0);
  webhookQueuePendingGauge.set(queueStats.pending || 0);
}

export function updateDeadLetterMetrics(deadLetterStats) {
  deadLetterQueueSizeGauge.set(deadLetterStats.queueSize || 0);
}

export function recordGitHubApiCall(method, endpoint, status) {
  githubApiCallsCounter.inc({ method, endpoint, status });
}

export function updateGitHubRateLimit(remaining) {
  githubApiRateLimitGauge.set(remaining);
}

export function recordAgentOperation(operation, status) {
  agentOperationsCounter.inc({ operation, status });
}

export function recordAgentError(errorType, component) {
  agentErrorsCounter.inc({ error_type: errorType, component });
}

export function updateSystemHealth(component, score) {
  systemHealthGauge.set({ component }, score);
}

// Metrics collection interval
let metricsInterval = null;

export function startMetricsCollection(getQueueStats, getDeadLetterStats, isAgentsEnabled, getCircuitBreaker) {
  if (metricsInterval) {
    clearInterval(metricsInterval);
  }

  metricsInterval = setInterval(async () => {
    try {
      // Update queue metrics
      if (getQueueStats) {
        const queueStats = getQueueStats();
        updateQueueMetrics(queueStats);
      }

      // Update dead letter queue metrics
      if (getDeadLetterStats) {
        const deadLetterStats = getDeadLetterStats();
        updateDeadLetterMetrics(deadLetterStats);
      }

      // Update agent status
      if (isAgentsEnabled) {
        const enabled = await isAgentsEnabled();
        agentsEnabledGauge.set(enabled ? 1 : 0);
      }

      // Update circuit breaker metrics
      if (getCircuitBreaker) {
        const breaker = getCircuitBreaker();
        if (breaker) {
          webhookCircuitOpenGauge.set(breaker.opened ? 1 : 0);
          updateCircuitBreakerMetrics(breaker);
        }
      }

    } catch (error) {
      console.error('Error updating metrics:', error.message);
    }
  }, 10000); // Update every 10 seconds

  console.info('📊 Enhanced metrics collection started');
}

export function stopMetricsCollection() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
    console.info('📊 Metrics collection stopped');
  }
}
