// agents/github-pr-manager/src/index.js
import express from "express";
import crypto from "crypto";
import { Octokit } from "octokit";
import { AIService } from "./ai-service.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const REPO = process.env.GITHUB_REPOSITORY || "";
const TOKEN = process.env.GITHUB_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const PROMOTE_DRAFTS = (process.env.PROMOTE_DRAFTS || "false").toLowerCase() === "true";
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const ENABLE_AI_ANALYSIS = (process.env.ENABLE_AI_ANALYSIS || "true").toLowerCase() === "true";

function safeLog(...args) {
  // Avoid logging secrets
  console.log(new Date().toISOString(), ...args);
}

if (!TOKEN) {
  safeLog("Warning: GITHUB_TOKEN not provided. Agent will not perform write actions.");
}

const octokit = new Octokit({ auth: TOKEN });
const aiService = new AIService(AI_SERVICE_URL);

app.use(express.json({
  verify: (req, res, buf) => {
    // keep raw body for signature verification
    req.rawBody = buf;
  }
}));

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    repo: REPO || null,
    mode: process.env.NODE_ENV || "development",
    ai_enabled: ENABLE_AI_ANALYSIS,
    ai_service: AI_SERVICE_URL
  });
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
  if (WEBHOOK_SECRET && !verifySignature(req)) {
    safeLog("Webhook signature verification failed");
    return res.status(401).send("Invalid signature");
  }
  
  const event = req.headers["x-github-event"];
  safeLog("Received webhook:", event);
  
  // Process webhook asynchronously
  processWebhookAsync(event, req.body).catch(err => {
    safeLog("Webhook processing error:", err.message || err);
  });

  return res.status(202).send("Accepted");
});

async function processWebhookAsync(event, payload) {
  try {
    if (event === "pull_request") {
      const pr = payload.pull_request;
      const action = payload.action;
      
      safeLog(`Processing PR webhook: #${pr?.number} action=${action}`);
      
      if (action === "opened" || action === "reopened" || action === "synchronize") {
        await analyzePRWithAI(pr, payload.repository);
      }
    } else if (event === "issues") {
      const issue = payload.issue;
      const action = payload.action;
      
      if (action === "opened" || action === "reopened") {
        await analyzeIssueWithAI(issue, payload.repository);
      }
    }
  } catch (error) {
    safeLog("Error processing webhook:", error.message);
  }
}

async function analyzePRWithAI(pr, repository) {
  if (!ENABLE_AI_ANALYSIS) {
    safeLog(`AI analysis disabled for PR #${pr.number}`);
    return;
  }

  try {
    safeLog(`Starting AI analysis for PR #${pr.number}`);
    
    // Get file changes
    const files = await octokit.rest.pulls.listFiles({
      owner: repository.owner.login,
      repo: repository.name,
      pull_number: pr.number
    });

    const prData = {
      ...pr,
      files: files.data
    };

    // Get AI analysis
    const analysis = await aiService.analyzePR(prData);
    safeLog(`AI analysis completed for PR #${pr.number}:`, {
      risk: analysis.riskLevel,
      priority: analysis.priority,
      recommendation: analysis.recommendation
    });

    // Add labels based on AI analysis
    if (TOKEN && analysis.riskLevel !== 'low') {
      await addLabelsToePR(repository, pr.number, analysis);
    }

    // Generate and post review comment if high risk
    if (TOKEN && (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical')) {
      await postAIReviewComment(repository, pr.number, prData, analysis);
    }

  } catch (error) {
    safeLog(`AI analysis failed for PR #${pr.number}:`, error.message);
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