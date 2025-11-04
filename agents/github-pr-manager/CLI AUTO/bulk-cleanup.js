// bulk-cleanup.js
// Script to automate PR and issue cleanup using existing agent logic
// Usage: node bulk-cleanup.js

const { analyzePR, analyzeIssue } = require('./src/ai-service');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!OWNER || !REPO || !GITHUB_TOKEN) {
  console.error('Missing GITHUB_OWNER, GITHUB_REPO, or GITHUB_TOKEN in environment.');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function cleanupPRs() {
  const prs = await octokit.pulls.list({ owner: OWNER, repo: REPO, state: 'open', per_page: 100 });
  for (const pr of prs.data) {
    const prNumber = pr.number;
    const prInfo = await octokit.pulls.get({ owner: OWNER, repo: REPO, pull_number: prNumber });
    const analysis = await analyzePR(prInfo.data);
    // --- Enhancement: AI review and approval ---
    // 1. Generate and post AI review comment as a review
    let reviewBody = null;
    let reviewEvent = 'COMMENT';
    if (typeof analyzePR.generateReviewComment === 'function') {
      // If analyzePR is a class instance, use its method
      reviewBody = await analyzePR.generateReviewComment(prInfo.data, analysis);
    } else if (typeof require === 'function') {
      // Try to import AIService and use generateReviewComment
      try {
        const { AIService } = require('./src/ai-service');
        const aiService = new AIService();
        reviewBody = await aiService.generateReviewComment(prInfo.data, analysis);
      } catch (e) {
        reviewBody = null;
      }
    }
    if (reviewBody) {
      // If AI recommends approval, set event to APPROVE
      if (analysis.recommendation && analysis.recommendation.toLowerCase() === 'approve') {
        reviewEvent = 'APPROVE';
      }
      try {
        await octokit.pulls.createReview({
          owner: OWNER,
          repo: REPO,
          pull_number: prNumber,
          body: reviewBody,
          event: reviewEvent
        });
        console.log(`Posted AI review (${reviewEvent}) on PR #${prNumber}`);
      } catch (e) {
        console.log(`Failed to post AI review on PR #${prNumber}: ${e.message}`);
      }
    }

    // --- Existing merge/close/label logic ---
    if (analysis.autoMerge) {
      try {
        // Try squash merge first, then rebase, then merge commit, then force close if all fail
        let merged = false;
        const mergeMethods = ['squash', 'rebase', 'merge'];
        for (const method of mergeMethods) {
          try {
            await octokit.pulls.merge({ owner: OWNER, repo: REPO, pull_number: prNumber, merge_method: method });
            console.log(`Merged PR #${prNumber} with method: ${method}`);
            merged = true;
            break;
          } catch (e) {
            // Try next method
          }
        }
        if (!merged) {
          // If cannot merge, force close
          await octokit.issues.update({ owner: OWNER, repo: REPO, issue_number: prNumber, state: 'closed' });
          console.log(`Force closed PR #${prNumber} (merge failed)`);
        }
      } catch (e) {
        console.log(`Failed to merge or close PR #${prNumber}: ${e.message}`);
      }
    } else if (analysis.stale) {
      // Force close stale PR
      await octokit.issues.update({ owner: OWNER, repo: REPO, issue_number: prNumber, state: 'closed' });
      console.log(`Force closed stale PR #${prNumber}`);
    } else if (analysis.labels && analysis.labels.length) {
      await octokit.issues.addLabels({ owner: OWNER, repo: REPO, issue_number: prNumber, labels: analysis.labels });
      console.log(`Labeled PR #${prNumber}: ${analysis.labels.join(', ')}`);
    } else if (analysis.comment) {
      await octokit.issues.createComment({ owner: OWNER, repo: REPO, issue_number: prNumber, body: analysis.comment });
      console.log(`Commented on PR #${prNumber}`);
    }
  }
}

async function cleanupIssues() {
  const issues = await octokit.issues.listForRepo({ owner: OWNER, repo: REPO, state: 'open', per_page: 100 });
  for (const issue of issues.data) {
    if (issue.pull_request) continue; // skip PRs
    const analysis = await analyzeIssue(issue);
    if (analysis.close) {
      // Force close issue
      await octokit.issues.update({ owner: OWNER, repo: REPO, issue_number: issue.number, state: 'closed' });
      console.log(`Force closed issue #${issue.number}`);
    } else if (analysis.labels && analysis.labels.length) {
      await octokit.issues.addLabels({ owner: OWNER, repo: REPO, issue_number: issue.number, labels: analysis.labels });
      console.log(`Labeled issue #${issue.number}: ${analysis.labels.join(', ')}`);
    } else if (analysis.comment) {
      await octokit.issues.createComment({ owner: OWNER, repo: REPO, issue_number: issue.number, body: analysis.comment });
      console.log(`Commented on issue #${issue.number}`);
    }
  }
}

(async () => {
  console.log('Starting bulk cleanup...');
  await cleanupPRs();
  await cleanupIssues();
  console.log('Bulk cleanup complete.');
})();
