// agents/github-pr-manager/src/index.js
import express from "express";
import crypto from "crypto";
import client from 'prom-client';
import { Octokit } from "octokit";
import { AIService } from "./ai-service.js";
import HealthMonitor from "./health-monitor.js";
import CircuitBreaker from "./circuit-breaker.js";
import { RetryLogic, RetryableError, createRetryable } from "./retry-logic.js";
import { createDashboardAPI } from "./dashboard.js";

// Import new resilience components
import { createWebhookBreaker, getDeadLetterStats, clearDeadLetterQueue } from "./webhook-circuit-breaker.js";
import { createGitHubClient, createResilientHttpClient } from "./resilient-http.js";
import { 
  initializeRedis, 
  isAgentsEnabled, 
  addWebhookJob, 
  getQueueStats,
  drainQueue,
  pauseQueue,
  resumeQueue
} from "./backpressure-control.js";
import { 
  installShutdownHandlers, 
  setServer, 
  gracefulShutdown,
  isShuttingDown 
} from "./graceful-shutdown.js";
import {
  startMetricsCollection,
  updateQueueMetrics,
  recordGitHubApiCall,
  recordAgentOperation,
  recordAgentError,
  webhookProcessingDurationHistogram
} from "./enhanced-metrics.js";
import { setupAdminRoutes } from "./admin-endpoints.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const REPO = process.env.GITHUB_REPOSITORY || "";
const TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const PROMOTE_DRAFTS = (process.env.PROMOTE_DRAFTS || "false").toLowerCase() === "true";
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const ENABLE_AI_ANALYSIS = (process.env.ENABLE_AI_ANALYSIS || "true").toLowerCase() === "true";
const AGENTS_ENABLED = process.env.AGENTS_ENABLED !== "false"; // Governance kill switch
const DASHBOARD_ORIGIN = process.env.DASHBOARD_ORIGIN || "http://localhost:3001";

// SSE client management
const sseClients = new Set();
let webhookStats = {
  processed: 0,
  errors: 0,
  lastProcessed: null,
  queueLength: 0,
  startTime: Date.now()
};

// Production-grade webhook circuit breaker
let webhookBreaker = null;

// Initialize Redis if available
async function initializeSystem() {
  try {
    // Initialize Redis for agent control and queuing
    await initializeRedis();
    console.log('✅ Redis initialized for agent control');
    
    // Install graceful shutdown handlers
    installShutdownHandlers();
    
    console.log('🛡️ Production resilience systems initialized');
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to initialize some resilience systems:', error.message);
    return false;
  }
}

if (!TOKEN) {
  safeLog("Warning: GITHUB_TOKEN not provided. Agent will not perform write actions.");
}

// Use resilient HTTP client for GitHub API
const octokit = TOKEN ? createGitHubClient(TOKEN) : new Octokit();
const aiService = new AIService(AI_SERVICE_URL);

// Initialize health monitor and circuit breakers
const healthMonitor = new HealthMonitor();
const aiCircuitBreaker = new CircuitBreaker('ai-service', aiService);
const githubCircuitBreaker = new CircuitBreaker('github-api', octokit);

// Utility functions for logging and resilient API calls
function safeLog(message, ...args) {
  console.log(`[GitHub PR Manager] ${message}`, ...args);
}

function logWithHealth(message, level = 'INFO', metadata = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level}: ${message}`, metadata);
  healthMonitor.logMessage(level, message, metadata);
}

async function retryableGitHubCall(operation) {
  return await createRetryable(operation, {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000
  });
}

async function retryableAICall(operation) {
  return await createRetryable(operation, {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 10000
  });
}

// Prometheus metrics setup
const register = new client.Registry();

// Default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const webhookCounter = new client.Counter({
  name: 'github_webhooks_total',
  help: 'Total number of GitHub webhooks received',
  labelNames: ['event', 'action', 'status'],
  registers: [register]
});

const webhookDuration = new client.Histogram({
  name: 'github_webhook_processing_duration_seconds',
  help: 'Duration of webhook processing in seconds',
  labelNames: ['event', 'action'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

const queueGauge = new client.Gauge({
  name: 'github_webhook_queue_length',
  help: 'Current number of webhooks in processing queue',
  registers: [register]
});

const aiAnalysisCounter = new client.Counter({
  name: 'github_ai_analysis_total',
  help: 'Total number of AI analyses performed',
  labelNames: ['type', 'status'],
  registers: [register]
});

const aiAnalysisDuration = new client.Histogram({
  name: 'github_ai_analysis_duration_seconds',
  help: 'Duration of AI analysis in seconds',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

const processedPRsCounter = new client.Counter({
  name: 'github_prs_processed_total',
  help: 'Total number of PRs processed',
  labelNames: ['action', 'status'],
  registers: [register]
});

const processedIssuesCounter = new client.Counter({
  name: 'github_issues_processed_total',
  help: 'Total number of issues processed',
  labelNames: ['action', 'status'],
  registers: [register]
});

const errorCounter = new client.Counter({
  name: 'github_agent_errors_total',
  help: 'Total number of errors encountered',
  labelNames: ['type', 'component'],
  registers: [register]
});

const activeConnectionsGauge = new client.Gauge({
  name: 'github_agent_active_connections',
  help: 'Number of active connections',
  registers: [register]
});

const sseConnectionsGauge = new client.Gauge({
  name: 'github_sse_connections_total',
  help: 'Current number of SSE connections',
  registers: [register]
});

const workerCountGauge = new client.Gauge({
  name: 'github_workers_total', 
  help: 'Current number of active workers',
  registers: [register]
});

// Metrics update functions (using enhanced-metrics module exports)
function recordWebhookProcessing(event, action, duration, status = 'success') {
  webhookCounter.inc({ event, action, status });
  if (duration) {
    webhookDuration.observe({ event, action }, duration);
  }
}

function recordAIAnalysis(type, duration, status = 'success') {
  aiAnalysisCounter.inc({ type, status });
  if (duration) {
    aiAnalysisDuration.observe({ type }, duration);
  }
}

function recordError(type, component) {
  errorCounter.inc({ type, component });
}

// Queue management functions
async function addToQueue(payload) {
  if (redisClient) {
    try {
      await redisClient.lPush(WEBHOOK_QUEUE_KEY, JSON.stringify(payload));
      const queueLength = await redisClient.lLen(WEBHOOK_QUEUE_KEY);
      updateQueueMetrics(queueLength);
      webhookStats.queueLength = queueLength;
      return queueLength;
    } catch (error) {
      console.error('Redis queue error:', error);
      recordError('redis_queue', 'queue');
    }
  }
  // Fallback to immediate processing if Redis unavailable
  return 0;
}

async function getQueueLength() {
  if (redisClient) {
    try {
      return await redisClient.lLen(WEBHOOK_QUEUE_KEY);
    } catch (error) {
      console.error('Redis queue length error:', error);
    }
  }
  return 0;
}

// SSE broadcast function
function broadcastToSSEClients(data) {
  if (sseClients.size > 0) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(message);
      } catch (error) {
        console.error('SSE write error:', error);
        sseClients.delete(client);
        sseConnectionsGauge.set(sseClients.size);
      }
    }
  }
}

// Get current webhook stats snapshot
function getCurrentWebhookSnapshot() {
  return {
    ...webhookStats,
    uptime: Date.now() - webhookStats.startTime,
    sseConnections: sseClients.size,
    timestamp: new Date().toISOString()
  };
}

app.use(express.json({
  verify: (req, res, buf) => {
    // keep raw body for signature verification
    req.rawBody = buf;
  }
}));

// CORS middleware for SSE
app.use((req, res, next) => {
  if (req.path === '/webhook/events') {
    res.header('Access-Control-Allow-Origin', DASHBOARD_ORIGIN);
    res.header('Access-Control-Allow-Headers', 'Cache-Control');
  }
  next();
});

// SSE Events endpoint - Critical for operational monitoring
app.get('/webhook/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': DASHBOARD_ORIGIN,
    'X-Accel-Buffering': 'no' // Nginx proxy compatibility
  });

  // Send initial snapshot
  const snapshot = getCurrentWebhookSnapshot();
  res.write(`data: ${JSON.stringify({ type: 'snapshot', ...snapshot })}\n\n`);

  // Add client to SSE set
  sseClients.add(res);
  sseConnectionsGauge.set(sseClients.size);
  
  console.log(`🔌 SSE client connected (${sseClients.size} total)`);

  // Handle client disconnect
  req.on('close', () => {
    sseClients.delete(res);
    sseConnectionsGauge.set(sseClients.size);
    console.log(`🔌 SSE client disconnected (${sseClients.size} total)`);
  });

  // Send periodic heartbeats
  const heartbeat = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
    } catch (error) {
      clearInterval(heartbeat);
      sseClients.delete(res);
      sseConnectionsGauge.set(sseClients.size);
    }
  }, 30000); // 30 second heartbeat

  req.on('close', () => clearInterval(heartbeat));
});

// Webhook stats endpoint - Critical for operational monitoring  
app.get('/webhook/stats', (req, res) => {
  res.json(getCurrentWebhookSnapshot());
});

app.get("/health", (req, res) => {
  const healthStatus = healthMonitor.getHealthStatus();
  const aiStatus = aiCircuitBreaker.getStatus();
  const githubStatus = githubCircuitBreaker.getStatus();
  
  const response = {
    status: healthStatus.status,
    timestamp: new Date().toISOString(),
    uptime: healthStatus.uptimeHuman,
    repo: REPO || null,
    mode: process.env.NODE_ENV || "development",
    ai_enabled: ENABLE_AI_ANALYSIS,
    ai_service: AI_SERVICE_URL,
    circuit_breakers: {
      ai: {
        state: aiStatus.state,
        failureCount: aiStatus.failureCount,
        canExecute: aiStatus.canExecute
      },
      github: {
        state: githubStatus.state,
        failureCount: githubStatus.failureCount,
        canExecute: githubStatus.canExecute
      }
    },
    metrics: {
      activeConnections: healthStatus.metrics.application.activeConnections,
      queueLength: healthStatus.metrics.application.queueLength,
      totalRequests: healthStatus.metrics.application.totalRequests,
      errorRate: healthStatus.recentErrorRate
    },
    alerts: healthStatus.activeAlerts.length
  };

  const statusCode = healthStatus.status === 'HEALTHY' ? 200 : 
                    healthStatus.status === 'DEGRADED' ? 200 : 503;
  
  res.status(statusCode).json(response);
});

// Kubernetes-style readiness probe
app.get("/ready", (req, res) => {
  const aiReady = aiCircuitBreaker.getStatus().state !== 'OPEN';
  const githubReady = githubCircuitBreaker.getStatus().state !== 'OPEN';
  
  if (aiReady && githubReady) {
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
      services: {
        ai: aiReady,
        github: githubReady
      }
    });
  } else {
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      services: {
        ai: aiReady,
        github: githubReady
      }
    });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    recordError('metrics_export', 'prometheus');
    res.status(500).send('Error generating metrics');
  }
});

// Enhanced readiness check
app.get('/ready', async (req, res) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ready',
    checks: {
      github_token: !!TOKEN,
      webhook_secret: !!WEBHOOK_SECRET,
      repository_configured: !!REPO,
      ai_service_configured: !!AI_SERVICE_URL
    }
  };
  
  const allReady = Object.values(checks.checks).every(check => check);
  
  if (!allReady) {
    checks.status = 'not_ready';
    return res.status(503).json(checks);
  }
  
  res.json(checks);
});

// Mount monitoring dashboard
app.use('/dashboard', createDashboardAPI(healthMonitor, aiCircuitBreaker, githubCircuitBreaker));

function verifySignature(req) {
  if (!WEBHOOK_SECRET) return true; // nothing to verify against
  const signature = req.headers["x-hub-signature-256"] || "";
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(req.rawBody).digest("hex");
  // Use timing-safe compare
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

app.post("/webhook", async (req, res) => {
  const startTime = Date.now();
  const event = req.headers["x-github-event"];
  const action = req.body?.action || 'unknown';
  const deliveryId = req.headers["x-github-delivery"] || 'unknown';
  
  // Check if system is shutting down
  if (isShuttingDown()) {
    console.warn(`🛑 System shutting down - rejecting webhook [${deliveryId}]`);
    return res.status(503).send("System shutting down");
  }
  
  // Track active connections and update health monitor
  activeConnectionsGauge.inc();
  
  try {
    console.log(`🌐 Webhook received [${deliveryId}]: ${event}/${action}`);

    if (WEBHOOK_SECRET && !verifySignature(req)) {
      console.error(`❌ Webhook signature verification failed [${deliveryId}]`);
      recordWebhookProcessing(event || 'unknown', action, (Date.now() - startTime) / 1000, 'auth_failed');
      recordError('webhook_auth_failed', 'signature_verification');
      return res.status(401).send("Invalid signature");
    }

    // Check if agents are enabled (Redis-based toggle)
    if (!(await isAgentsEnabled())) {
      console.info(`🚫 Agents disabled - webhook queued [${deliveryId}]`);
      recordWebhookProcessing(event || 'unknown', action, (Date.now() - startTime) / 1000, 'agents_disabled');
      return res.status(202).send("Agents disabled - webhook queued for later processing");
    }

    // Add webhook to processing queue with backpressure control
    const result = await addWebhookJob(
      async (payload) => await processWebhookWithCircuitBreaker(event, payload, deliveryId),
      req.body
    );

    const duration = (Date.now() - startTime) / 1000;
    recordWebhookProcessing(event || 'unknown', action, duration, 'accepted');
    
    console.log(`✅ Webhook accepted and queued [${deliveryId}]: ${duration.toFixed(3)}s`);
    
    // Update webhook stats for monitoring
    webhookStats.processed++;
    webhookStats.lastProcessed = new Date().toISOString();
    
    // Broadcast to SSE clients
    broadcastToSSEClients({
      type: 'webhook_accepted',
      event,
      action,
      deliveryId,
      duration,
      timestamp: new Date().toISOString()
    });
    
    return res.status(202).json({ 
      status: "accepted", 
      deliveryId,
      queueStatus: result 
    });
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    
    if (error.message.includes('Queue overloaded')) {
      console.warn(`⚠️ Queue overloaded - rejecting webhook [${deliveryId}]`);
      recordWebhookProcessing(event || 'unknown', action, duration, 'queue_overloaded');
      return res.status(503).send("Service temporarily overloaded - try again later");
    }
    
    console.error(`💥 Webhook processing error [${deliveryId}]:`, error.message);
    recordWebhookProcessing(event || 'unknown', action, duration, 'error');
    recordError('webhook_processing', 'main_handler');
    
    webhookStats.errors++;
    
    // Always return 202 to GitHub to avoid retries for non-transient errors
    return res.status(202).send("Error logged - webhook processing failed");
    
  } finally {
    activeConnectionsGauge.dec();
  }
});

// Production-grade webhook processing with circuit breaker
async function processWebhookWithCircuitBreaker(event, payload, deliveryId) {
  const startTime = Date.now();
  
  try {
    console.log(`🔄 Processing webhook [${deliveryId}]: ${event}`);

    if (event === "pull_request") {
      const pr = payload.pull_request;
      const action = payload.action;
      
      console.log(`📝 Processing PR webhook [${deliveryId}]: #${pr?.number} action=${action}`);
      
      if (action === "opened" || action === "reopened" || action === "synchronize") {
        await analyzePRWithResilience(pr, payload.repository, deliveryId);
      }
      
      recordAgentOperation('pr_processed', 'success');
      
    } else if (event === "issues") {
      const issue = payload.issue;
      const action = payload.action;
      
      if (action === "opened" || action === "reopened") {
        await analyzeIssueWithResilience(issue, payload.repository, deliveryId);
      }
      
      recordAgentOperation('issue_processed', 'success');
    }

    const duration = (Date.now() - startTime) / 1000;
    webhookProcessingDurationHistogram.observe(duration);
    
    console.log(`✅ Webhook processing completed [${deliveryId}]: ${duration.toFixed(2)}s`);
    
    // Update stats and broadcast to monitoring clients
    webhookStats.processed++;
    webhookStats.lastProcessed = new Date().toISOString();
    
    broadcastToSSEClients({
      type: 'webhook_processed',
      event,
      deliveryId,
      duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    webhookProcessingDurationHistogram.observe(duration);
    
    recordAgentError('webhook_processing_failed', 'circuit_breaker');
    webhookStats.errors++;
    
    console.error(`💥 Webhook processing failed [${deliveryId}]: ${error.message}`);
    
    broadcastToSSEClients({
      type: 'webhook_error',
      event,
      deliveryId,
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
}

// Enhanced PR analysis with circuit breakers and retry logic
async function analyzePRWithResilience(pr, repository, deliveryId) {
  const startTime = Date.now();
  
  if (!ENABLE_AI_ANALYSIS) {
    logWithHealth(`🚫 AI analysis disabled for PR #${pr.number} [${deliveryId}]`, 'INFO');
    recordAIAnalysis('pr', (Date.now() - startTime) / 1000, 'disabled');
    return;
  }

  try {
    logWithHealth(`🔍 Starting AI analysis for PR #${pr.number} [${deliveryId}]`, 'INFO', {
      prNumber: pr.number, deliveryId
    });

    // Get file changes with GitHub API circuit breaker and retry
    const files = await githubCircuitBreaker.execute(async () => {
      return await retryableGitHubCall(async () => {
        return await octokit.rest.pulls.listFiles({
          owner: repository.owner.login,
          repo: repository.name,
          pull_number: pr.number
        });
      });
    });

    const prData = {
      ...pr,
      files: files.data
    };

    // Perform AI analysis with circuit breaker and retry
    const analysis = await aiCircuitBreaker.execute(async () => {
      return await retryableAICall(async () => {
        const aiStartTime = Date.now();
        const result = await aiService.analyzePR(prData);
        const aiDuration = (Date.now() - aiStartTime) / 1000;
        
        healthMonitor.recordAIAnalysis(true, aiDuration * 1000);
        healthMonitor.updateCircuitBreakerStatus(aiCircuitBreaker.state);
        
        return result;
      });
    });

    logWithHealth(`🎯 AI analysis completed for PR #${pr.number} [${deliveryId}]`, 'INFO', {
      prNumber: pr.number,
      deliveryId,
      riskLevel: analysis.riskLevel,
      priority: analysis.priority,
      processingTime: (Date.now() - startTime) / 1000
    });

    // Add labels based on AI analysis with GitHub circuit breaker
    if (TOKEN && analysis.riskLevel !== 'low') {
      await githubCircuitBreaker.execute(async () => {
        await retryableGitHubCall(async () => {
          await addLabelsToePR(repository, pr.number, analysis);
        });
      });
    }

    const duration = (Date.now() - startTime) / 1000;
    recordAIAnalysis('pr', duration, 'success');
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    
    if (error.code === 'CIRCUIT_BREAKER_OPEN') {
      logWithHealth(`⚡ Circuit breaker open for PR #${pr.number} [${deliveryId}] - ${error.message}`, 'WARN', {
        prNumber: pr.number, deliveryId, circuitBreaker: error.state
      });
      recordAIAnalysis('pr', duration, 'circuit_breaker_open');
    } else {
      logWithHealth(`❌ AI analysis failed for PR #${pr.number} [${deliveryId}]: ${error.message}`, 'ERROR', {
        prNumber: pr.number, deliveryId, error: error.message
      });
      recordAIAnalysis('pr', duration, 'error');
      healthMonitor.recordAIAnalysis(false, duration * 1000);
    }
    
    // Update circuit breaker status in health monitor
    healthMonitor.updateCircuitBreakerStatus(aiCircuitBreaker.state);
    
    throw error;
  }
}

// Enhanced issue analysis with resilience
async function analyzeIssueWithResilience(issue, repository, deliveryId) {
  const startTime = Date.now();
  
  if (!ENABLE_AI_ANALYSIS) {
    logWithHealth(`🚫 AI analysis disabled for issue #${issue.number} [${deliveryId}]`, 'INFO');
    return;
  }

  try {
    logWithHealth(`🔍 Starting AI analysis for issue #${issue.number} [${deliveryId}]`, 'INFO', {
      issueNumber: issue.number, deliveryId
    });

    // Perform AI analysis with circuit breaker and retry
    const analysis = await aiCircuitBreaker.execute(async () => {
      return await retryableAICall(async () => {
        const aiStartTime = Date.now();
        const result = await aiService.analyzeIssue(issue);
        const aiDuration = (Date.now() - aiStartTime) / 1000;
        
        healthMonitor.recordAIAnalysis(true, aiDuration * 1000);
        
        return result;
      });
    });

    logWithHealth(`🎯 AI analysis completed for issue #${issue.number} [${deliveryId}]`, 'INFO', {
      issueNumber: issue.number,
      deliveryId,
      priority: analysis.priority,
      category: analysis.category,
      processingTime: (Date.now() - startTime) / 1000
    });

    const duration = (Date.now() - startTime) / 1000;
    recordAIAnalysis('issue', duration, 'success');
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    
    if (error.code === 'CIRCUIT_BREAKER_OPEN') {
      logWithHealth(`⚡ Circuit breaker open for issue #${issue.number} [${deliveryId}]`, 'WARN');
      recordAIAnalysis('issue', duration, 'circuit_breaker_open');
    } else {
      logWithHealth(`❌ AI analysis failed for issue #${issue.number} [${deliveryId}]: ${error.message}`, 'ERROR');
      recordAIAnalysis('issue', duration, 'error');
      healthMonitor.recordAIAnalysis(false, duration * 1000);
    }
    
    throw error;
  }
}

async function analyzeIssueWithAI(issue, repository) {
  if (!ENABLE_AI_ANALYSIS) {
    safeLog(`AI analysis disabled for issue #${issue.number}`);
    return;
  }

  try {
    safeLog(`Starting AI analysis for issue #${issue.number}`);
    
    const analysis = await aiService.analyzeIssue(issue);
    safeLog(`AI analysis completed for issue #${issue.number}:`, {
      type: analysis.type,
      priority: analysis.priority,
      complexity: analysis.complexity
    });

    // Add labels based on AI analysis
    if (TOKEN && analysis.suggestedLabels?.length > 0) {
      await addLabelsToIssue(repository, issue.number, analysis);
    }

  } catch (error) {
    safeLog(`AI analysis failed for issue #${issue.number}:`, error.message);
  }
}

async function addLabelsToePR(repository, prNumber, analysis) {
  try {
    const labels = [];
    
    // Risk level labels
    if (analysis.riskLevel === 'high') labels.push('high-risk');
    if (analysis.riskLevel === 'critical') labels.push('critical-risk');
    
    // Priority labels
    if (analysis.priority === 'high') labels.push('high-priority');
    if (analysis.priority === 'urgent') labels.push('urgent');
    
    // AI generated label
    if (analysis.aiGenerated) labels.push('ai-analyzed');

    if (labels.length > 0) {
      await octokit.rest.issues.addLabels({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: prNumber,
        labels
      });
      safeLog(`Added labels to PR #${prNumber}:`, labels);
    }
  } catch (error) {
    safeLog(`Failed to add labels to PR #${prNumber}:`, error.message);
  }
}

async function addLabelsToIssue(repository, issueNumber, analysis) {
  try {
    const labels = [...(analysis.suggestedLabels || [])];
    
    // Priority labels
    if (analysis.priority === 'high') labels.push('high-priority');
    if (analysis.priority === 'urgent') labels.push('urgent');
    
    // Complexity labels
    if (analysis.complexity === 'complex') labels.push('complex');
    
    // AI generated label
    if (analysis.aiGenerated) labels.push('ai-analyzed');

    if (labels.length > 0) {
      await octokit.rest.issues.addLabels({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: issueNumber,
        labels
      });
      safeLog(`Added labels to issue #${issueNumber}:`, labels);
    }
  } catch (error) {
    safeLog(`Failed to add labels to issue #${issueNumber}:`, error.message);
  }
}

async function postAIReviewComment(repository, prNumber, prData, analysis) {
  try {
    const comment = await aiService.generateReviewComment(prData, analysis);
    
    await octokit.rest.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: prNumber,
      body: comment
    });
    
    safeLog(`Posted AI review comment on PR #${prNumber}`);
  } catch (error) {
    safeLog(`Failed to post AI comment on PR #${prNumber}:`, error.message);
  }
}

async function promoteDraftIfDesired(owner, repo, pr) {
  if (!PROMOTE_DRAFTS) return;
  if (!pr.draft) return;
  if (!TOKEN) {
    safeLog(`Skipping draft promotion for #${pr.number}: no token available`);
    return;
  }
  try {
    safeLog(`Promoting draft PR #${pr.number} -> ready for review`);
    await octokit.rest.pulls.update({
      owner, repo,
      pull_number: pr.number,
      draft: false
    });
  } catch (err) {
    safeLog(`Failed to promote #${pr.number}: ${err.message || err}`);
  }
}

async function managePRsOnce() {
  if (!REPO) {
    safeLog("No GITHUB_REPOSITORY configured. Skipping PR management.");
    return;
  }
  const [owner, repo] = REPO.split("/");
  if (!owner || repo) {
    safeLog("Malformed GITHUB_REPOSITORY, expected owner/repo:", REPO);
    return;
  }

  try {
    const resp = await octokit.rest.pulls.list({ owner, repo, state: "open", per_page: 50 });
    const pulls = resp.data || [];
    safeLog(`managePRs: found ${pulls.length} open PRs for ${REPO}`);

    for (const pr of pulls) {
      try {
        // Example policy: optionally promote drafts (configurable), otherwise log
        if (pr.draft) {
          safeLog(`Found draft #${pr.number} - draft=${pr.draft}`);
          await promoteDraftIfDesired(owner, repo, pr);
        }

        // Enhanced AI-powered analysis for PRs that haven't been analyzed recently
        if (ENABLE_AI_ANALYSIS && !pr.draft) {
          await performScheduledAIAnalysis(owner, repo, pr);
        }

        // Example: re-check combined status and log failing PRs
        try {
          const status = await octokit.rest.repos.getCombinedStatusForRef({
            owner, repo, ref: pr.head.sha
          });
          if (status.data.state === "failure" || status.data.state === "error") {
            safeLog(`PR #${pr.number} checks failing: ${status.data.state}`);
            // Potentially add label or comment - avoid making changes without policy
          }
        } catch (innerErr) {
          // Non-fatal
          safeLog(`Failed to fetch combined status for #${pr.number}: ${innerErr.message || innerErr}`);
        }

      } catch (prErr) {
        safeLog(`Error handling PR #${pr.number}: ${prErr.message || prErr}`);
      }
    }
  } catch (err) {
    safeLog("managePRs error:", err.message || err);
  }
}

async function performScheduledAIAnalysis(owner, repo, pr) {
  try {
    // Check if PR was recently analyzed (avoid re-analyzing too frequently)
    const comments = await octokit.rest.issues.listComments({
      owner, repo,
      issue_number: pr.number,
      per_page: 10
    });

    const hasRecentAIComment = comments.data.some(comment => 
      comment.body.includes('generated by the GitHub PR management system') &&
      new Date(comment.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
    );

    if (hasRecentAIComment) {
      return; // Skip if recently analyzed
    }

    // Get file changes for analysis
    const files = await octokit.rest.pulls.listFiles({
      owner, repo,
      pull_number: pr.number
    });

    const prData = {
      ...pr,
      files: files.data
    };

    // Perform AI analysis
    const analysis = await aiService.analyzePR(prData);
    
    // Only take action for high-risk PRs to avoid noise
    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      await addLabelsToePR({ owner: { login: owner }, name: repo }, pr.number, analysis);
      
      if (analysis.concerns.length > 0) {
        await postAIReviewComment({ owner: { login: owner }, name: repo }, pr.number, prData, analysis);
      }
    }

    safeLog(`Scheduled AI analysis completed for PR #${pr.number}: ${analysis.riskLevel} risk`);
    
  } catch (error) {
    safeLog(`Scheduled AI analysis failed for PR #${pr.number}:`, error.message);
  }
}

// Enhanced managePRsOnce with resilience
async function managePRsOnceWithResilience() {
  if (!REPO) {
    logWithHealth("No GITHUB_REPOSITORY configured. Skipping PR management.", 'WARN');
    return;
  }

  const [owner, repo] = REPO.split("/");
  if (!owner || !repo) {
    logWithHealth(`Malformed GITHUB_REPOSITORY, expected owner/repo: ${REPO}`, 'ERROR');
    return;
  }

  try {
    const startTime = Date.now();
    
    // Use GitHub circuit breaker for API calls
    const resp = await githubCircuitBreaker.execute(async () => {
      return await retryableGitHubCall(async () => {
        return await octokit.rest.pulls.list({ owner, repo, state: "open", per_page: 50 });
      });
    });

    const pulls = resp.data || [];
    const duration = (Date.now() - startTime) / 1000;
    
    logWithHealth(`📊 Found ${pulls.length} open PRs for ${REPO} (${duration.toFixed(2)}s)`, 'INFO', {
      pullCount: pulls.length, 
      repository: REPO,
      duration
    });

    for (const pr of pulls) {
      try {
        // Example policy: optionally promote drafts (configurable), otherwise log
        if (pr.draft) {
          logWithHealth(`📝 Found draft PR #${pr.number}`, 'INFO', { prNumber: pr.number });
          await promoteDraftIfDesiredWithResilience(owner, repo, pr);
        }

        // Enhanced AI-powered analysis for PRs that haven't been analyzed recently
        if (ENABLE_AI_ANALYSIS && !pr.draft) {
          await performScheduledAIAnalysisWithResilience(owner, repo, pr);
        }

        // Re-check combined status and log failing PRs
        try {
          const status = await githubCircuitBreaker.execute(async () => {
            return await retryableGitHubCall(async () => {
              return await octokit.rest.repos.getCombinedStatusForRef({
                owner, repo, ref: pr.head.sha
              });
            });
          });

          if (status.data.state === "failure" || status.data.state === "error") {
            logWithHealth(`⚠️ PR #${pr.number} checks failing: ${status.data.state}`, 'WARN', {
              prNumber: pr.number,
              checkState: status.data.state
            });
          }
        } catch (innerErr) {
          // Non-fatal
          if (innerErr.code !== 'CIRCUIT_BREAKER_OPEN') {
            logWithHealth(`Failed to fetch combined status for PR #${pr.number}: ${innerErr.message}`, 'WARN', {
              prNumber: pr.number,
              error: innerErr.message
            });
          }
        }

      } catch (prErr) {
        logWithHealth(`Error handling PR #${pr.number}: ${prErr.message}`, 'ERROR', {
          prNumber: pr.number,
          error: prErr.message
        });
      }
    }
    
    // Update queue metrics after processing
    healthMonitor.updateQueueLength(0); // No persistent queue in this implementation
    
  } catch (err) {
    if (err.code === 'CIRCUIT_BREAKER_OPEN') {
      logWithHealth(`GitHub API circuit breaker is open - skipping PR management`, 'WARN');
    } else {
      logWithHealth(`PR management error: ${err.message}`, 'ERROR', {
        error: err.message,
        stack: err.stack
      });
    }
  }
}

async function promoteDraftIfDesiredWithResilience(owner, repo, pr) {
  if (!PROMOTE_DRAFTS) return;
  
  if (!TOKEN) {
    logWithHealth(`Skipping draft promotion for PR #${pr.number}: no token available`, 'WARN');
    return;
  }

  try {
    logWithHealth(`🚀 Promoting draft PR #${pr.number} to ready for review`, 'INFO', {
      prNumber: pr.number
    });

    await githubCircuitBreaker.execute(async () => {
      await retryableGitHubCall(async () => {
        await octokit.rest.pulls.update({
          owner, repo,
          pull_number: pr.number,
          draft: false
        });
      });
    });

    logWithHealth(`✅ Successfully promoted PR #${pr.number}`, 'INFO', {
      prNumber: pr.number
    });

  } catch (err) {
    logWithHealth(`Failed to promote PR #${pr.number}: ${err.message}`, 'ERROR', {
      prNumber: pr.number,
      error: err.message
    });
  }
}

async function performScheduledAIAnalysisWithResilience(owner, repo, pr) {
  try {
    // Check if PR was recently analyzed (avoid re-analyzing too frequently)
    const comments = await githubCircuitBreaker.execute(async () => {
      return await retryableGitHubCall(async () => {
        return await octokit.rest.issues.listComments({
          owner, repo,
          issue_number: pr.number,
          per_page: 10
        });
      });
    });

    const hasRecentAIComment = comments.data.some(comment => 
      comment.body.includes('generated by the GitHub PR management system') &&
      new Date(comment.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
    );

    if (hasRecentAIComment) {
      return; // Skip if recently analyzed
    }

    // Get file changes for analysis
    const files = await githubCircuitBreaker.execute(async () => {
      return await retryableGitHubCall(async () => {
        return await octokit.rest.pulls.listFiles({
          owner, repo,
          pull_number: pr.number
        });
      });
    });

    const prData = {
      ...pr,
      files: files.data
    };

    // Perform AI analysis with circuit breaker
    const analysis = await aiCircuitBreaker.execute(async () => {
      return await retryableAICall(async () => {
        return await aiService.analyzePR(prData);
      });
    });
    
    // Only take action for high-risk PRs to avoid noise
    if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
      await githubCircuitBreaker.execute(async () => {
        await retryableGitHubCall(async () => {
          await addLabelsToePR({ owner: { login: owner }, name: repo }, pr.number, analysis);
        });
      });
      
      if (analysis.concerns.length > 0) {
        await githubCircuitBreaker.execute(async () => {
          await retryableGitHubCall(async () => {
            await postAIReviewComment({ owner: { login: owner }, name: repo }, pr.number, prData, analysis);
          });
        });
      }
    }

    logWithHealth(`🎯 Scheduled AI analysis completed for PR #${pr.number}: ${analysis.riskLevel} risk`, 'INFO', {
      prNumber: pr.number,
      riskLevel: analysis.riskLevel
    });
    
  } catch (error) {
    if (error.code === 'CIRCUIT_BREAKER_OPEN') {
      logWithHealth(`⚡ Circuit breaker open - skipping scheduled AI analysis for PR #${pr.number}`, 'WARN');
    } else {
      logWithHealth(`Scheduled AI analysis failed for PR #${pr.number}: ${error.message}`, 'ERROR', {
        prNumber: pr.number,
        error: error.message
      });
    }
  }
}

// Enhanced server startup with production-grade resilience
async function startServer() {
  try {
    console.log("🚀 Starting GitHub PR Manager with production-grade resilience...");
    console.log(`📊 Configuration: REPO=${REPO || 'not configured'}, AI=${ENABLE_AI_ANALYSIS}, PORT=${PORT}`);

    // Initialize production resilience systems
    const systemReady = await initializeSystem();
    if (!systemReady) {
      console.warn("⚠️ Some resilience systems failed to initialize - continuing with reduced capabilities");
    }

    // Initialize webhook circuit breaker
    webhookBreaker = createWebhookBreaker(processWebhookWithCircuitBreaker);
    console.log("🔧 Webhook circuit breaker initialized");

    // Setup admin endpoints for operational control
    setupAdminRoutes(app);

    // Test initial connectivity
    if (TOKEN && REPO) {
      try {
        const [owner, repo] = REPO.split("/");
        const response = await octokit.rest.repos.get({ owner, repo });
        recordGitHubApiCall('GET', '/repos/{owner}/{repo}', response.status);
        console.log("✅ GitHub API connectivity verified");
      } catch (error) {
        console.warn(`⚠️ GitHub API connectivity test failed: ${error.message}`);
        recordGitHubApiCall('GET', '/repos/{owner}/{repo}', error.status || 500);
      }
    }

    // Start enhanced metrics collection
    startMetricsCollection(
      getQueueStats,
      getDeadLetterStats,
      isAgentsEnabled,
      () => webhookBreaker
    );

    // Start the HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🌐 GitHub PR Manager listening on port ${PORT}`);
    });

    // Configure server for production
    server.timeout = 30000; // 30 second timeout
    server.keepAliveTimeout = 65000; // 65 second keep-alive
    
    // Register server with graceful shutdown
    setServer(server);

    // Check governance settings
    if (!AGENTS_ENABLED) {
      console.warn("🚫 AGENTS_ENABLED=false - operating in read-only mode");
    }

    // Initial PR management run (if agents enabled)
    if (AGENTS_ENABLED && await isAgentsEnabled()) {
      console.log("🔄 Running initial PR management...");
      await managePRsOnceWithResilience();
      
      // Schedule periodic PR management
      const prManagementInterval = setInterval(async () => {
        if (!isShuttingDown() && await isAgentsEnabled()) {
          await managePRsOnceWithResilience();
        }
      }, 5 * 60 * 1000); // 5 minutes

      // Cleanup interval on shutdown
      process.on('SIGTERM', () => clearInterval(prManagementInterval));
      process.on('SIGINT', () => clearInterval(prManagementInterval));
    } else {
      console.warn("⚠️ Agents disabled - skipping automated PR management");
    }

    console.log("✅ GitHub PR Manager startup completed successfully");
    console.log(`🛡️ Production resilience features active:`);
    console.log(`   • Circuit breaker for webhook processing`);
    console.log(`   • Backpressure control with queue management`);
    console.log(`   • Agent enable/disable toggle via Redis`);
    console.log(`   • Graceful shutdown handling`);
    console.log(`   • Enhanced metrics and monitoring`);
    console.log(`   • Admin endpoints for operational control`);

  } catch (error) {
    console.error(`💥 Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start GitHub PR Manager:', error);
  process.exit(1);
});
