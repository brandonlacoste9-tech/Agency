// agents/github-pr-manager/src/index.js
import express from "express";
import crypto from "crypto";
import client from 'prom-client';
import { Octokit } from "octokit";
import { AIService } from "./ai-service.js";
import HealthMonitor from "./health-monitor.js";
import CircuitBreaker from "./circuit-breaker.js";
import { RetryLogic, RetryableError, createRetryable } from "./retry-logic.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const REPO = process.env.GITHUB_REPOSITORY || "";
const TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const PROMOTE_DRAFTS = (process.env.PROMOTE_DRAFTS || "false").toLowerCase() === "true";
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const ENABLE_AI_ANALYSIS = (process.env.ENABLE_AI_ANALYSIS || "true").toLowerCase() === "true";

// Initialize resilience components
const healthMonitor = new HealthMonitor({
  checkInterval: 30000, // 30 seconds
  alertThresholds: {
    memoryUsage: 0.85,
    responseTime: 5000,
    errorRate: 0.1
  }
});

const aiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  expectedErrors: ['RATE_LIMIT', 'TIMEOUT']
});

const githubCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  expectedErrors: ['RATE_LIMIT']
});

// Create retryable versions of key operations
const retryableGitHubCall = createRetryable(
  async (operation) => await operation(),
  {
    maxAttempts: 3,
    baseDelay: 1000,
    retryableErrors: ['ECONNRESET', 'RATE_LIMIT']
  }
);

const retryableAICall = createRetryable(
  async (operation) => await operation(),
  {
    maxAttempts: 2,
    baseDelay: 2000,
    maxDelay: 10000
  }
);

function safeLog(...args) {
  // Avoid logging secrets - enhanced with structured logging
  const timestamp = new Date().toISOString();
  const logLevel = args[0]?.level || 'INFO';
  const message = args.filter(arg => typeof arg !== 'object' || !arg.level).join(' ');
  
  const logEntry = {
    timestamp,
    level: logLevel,
    message,
    service: 'github-pr-manager',
    version: process.env.npm_package_version || '1.0.0'
  };
  
  console.log(JSON.stringify(logEntry));
}

// Enhanced logging for health monitoring
function logWithHealth(message, level = 'INFO', metadata = {}) {
  safeLog({ level }, message);
  
  // Record in health monitor
  if (level === 'ERROR') {
    healthMonitor.recordError('APPLICATION_ERROR', message, metadata);
  }
}

if (!TOKEN) {
  safeLog("Warning: GITHUB_TOKEN not provided. Agent will not perform write actions.");
}

const octokit = new Octokit({ auth: TOKEN });
const aiService = new AIService(AI_SERVICE_URL);

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

// Metrics update functions
function updateQueueMetrics(queueLength) {
  queueGauge.set(queueLength);
}

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

app.use(express.json({
  verify: (req, res, buf) => {
    // keep raw body for signature verification
    req.rawBody = buf;
  }
}));

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
  
  // Track active connections and update health monitor
  activeConnectionsGauge.inc();
  healthMonitor.updateActiveConnections(activeConnectionsGauge.get().values[0]?.value || 0);
  
  try {
    logWithHealth(`🌐 Webhook received [${deliveryId}]: ${event}/${action}`, 'INFO', {
      event, action, deliveryId
    });

    if (WEBHOOK_SECRET && !verifySignature(req)) {
      logWithHealth("❌ Webhook signature verification failed", 'ERROR', {
        event, action, deliveryId
      });
      recordWebhookProcessing(event || 'unknown', action, (Date.now() - startTime) / 1000, 'auth_failed');
      recordError('webhook_auth_failed', 'signature_verification');
      healthMonitor.recordRequest(false, Date.now() - startTime);
      return res.status(401).send("Invalid signature");
    }

    // Process webhook asynchronously with enhanced error handling
    processWebhookWithResilience(event, req.body, deliveryId).catch(err => {
      const duration = (Date.now() - startTime) / 1000;
      recordWebhookProcessing(event || 'unknown', action, duration, 'error');
      recordError('webhook_processing', 'async_handler');
      logWithHealth(`💥 Webhook processing error [${deliveryId}]: ${err.message}`, 'ERROR', {
        event, action, deliveryId, stack: err.stack
      });
      healthMonitor.recordRequest(false, duration * 1000);
    });

    const duration = (Date.now() - startTime) / 1000;
    recordWebhookProcessing(event || 'unknown', action, duration, 'accepted');
    healthMonitor.recordRequest(true, duration * 1000);
    
    logWithHealth(`✅ Webhook accepted [${deliveryId}]: ${duration.toFixed(3)}s`, 'INFO', {
      event, action, deliveryId, duration
    });
    
    return res.status(202).send("Accepted");
    
  } finally {
    activeConnectionsGauge.dec();
    healthMonitor.updateActiveConnections(activeConnectionsGauge.get().values[0]?.value || 0);
  }
});

// Enhanced webhook processing with circuit breakers and retry logic
async function processWebhookWithResilience(event, payload, deliveryId) {
  try {
    logWithHealth(`🔄 Processing webhook [${deliveryId}]: ${event}`, 'INFO', {
      event, deliveryId
    });

    if (event === "pull_request") {
      const pr = payload.pull_request;
      const action = payload.action;
      
      logWithHealth(`📝 Processing PR webhook [${deliveryId}]: #${pr?.number} action=${action}`, 'INFO', {
        prNumber: pr?.number, action, deliveryId
      });
      
      if (action === "opened" || action === "reopened" || action === "synchronize") {
        await analyzePRWithResilience(pr, payload.repository, deliveryId);
      }
    } else if (event === "issues") {
      const issue = payload.issue;
      const action = payload.action;
      
      if (action === "opened" || action === "reopened") {
        await analyzeIssueWithResilience(issue, payload.repository, deliveryId);
      }
    }

    logWithHealth(`✅ Webhook processing completed [${deliveryId}]`, 'INFO', {
      event, deliveryId
    });
    
  } catch (error) {
    logWithHealth(`💥 Webhook processing failed [${deliveryId}]: ${error.message}`, 'ERROR', {
      event, deliveryId, error: error.message, stack: error.stack
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

    // Generate and post review comment if high risk
    if (TOKEN && (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical')) {
      await postAIReviewComment(repository, pr.number, prData, analysis);
    }

    const duration = (Date.now() - startTime) / 1000;
    recordAIAnalysis('pr', duration, 'success');
    processedPRsCounter.inc({ action: 'analyzed', status: 'success' });

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    recordAIAnalysis('pr', duration, 'error');
    recordError('ai_analysis', 'pr');
    processedPRsCounter.inc({ action: 'analyzed', status: 'error' });
    safeLog(`AI analysis failed for PR #${pr.number}:`, error.message);
  }
}async function analyzeIssueWithAI(issue, repository) {
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

// Run managePRs every 5 minutes with initial warm-up
(async () => {
  safeLog("Starting GitHub PR Manager with AI integration...");
  safeLog(`AI Analysis: ${ENABLE_AI_ANALYSIS ? 'ENABLED' : 'DISABLED'}`);
  safeLog(`AI Service URL: ${AI_SERVICE_URL}`);
  
  await managePRsOnce();
  setInterval(managePRsOnce, 5 * 60 * 1000); // 5 minutes
})();

app.listen(PORT, () => {
  safeLog(`GitHub PR Manager with AI listening on port ${PORT} for ${REPO || "no repo configured"}`);
  safeLog(`AI Integration: ${ENABLE_AI_ANALYSIS ? 'ENABLED' : 'DISABLED'}`);
});
