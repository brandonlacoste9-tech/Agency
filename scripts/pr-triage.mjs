#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ISO_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const DEFAULT_CONFIG = {
  staleDays: 90,
  inactiveDays: 30,
  recentDays: 14,
};

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=');
      const normalizedKey = key.replace(/^--/, '');
      if (value !== undefined) {
        args[normalizedKey] = value;
      } else {
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
          args[normalizedKey] = next;
          i += 1;
        } else {
          args[normalizedKey] = true;
        }
      }
    }
  }
  return args;
}

function showHelp() {
  console.log(`
GitHub PR Triage CLI

USAGE:
  npm run triage:prs -- --repo OWNER/REPO [OPTIONS]

REQUIRED:
  --repo OWNER/REPO          Target GitHub repository

OPTIONS:
  --token TOKEN              GitHub token (or set GITHUB_TOKEN env var)
  --state STATE              PR state: open, closed, all (default: open)
  --limit NUMBER             Max PRs to fetch (default: 100)
  --output FILE              Output file (default: stdout)
  --dry-run                  Analyze only, don't apply changes (safe mode)
  --stale-days NUMBER        Days to consider PR stale (default: 90)
  --inactive-days NUMBER     Days to consider PR inactive (default: 30)
  --recent-days NUMBER       Days to consider PR recent (default: 14)
  --job-id ID                Custom job identifier
  --help                     Show this help message

EXAMPLES:
  npm run triage:prs -- --repo microsoft/vscode
  npm run triage:prs -- --repo vercel/next.js --limit 50
  npm run triage:prs -- --repo owner/repo --token ghp_xxx --output report.md
  npm run triage:prs -- --repo owner/repo --dry-run --output analysis.json

ENVIRONMENT VARIABLES:
  GITHUB_TOKEN               GitHub personal access token
  GITHUB_REPOSITORY          Default repository (owner/repo format)

For more information, see docs/pr-triage.md
`);
}

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

function toISODate(input) {
  return ISO_FORMATTER.format(new Date(input));
}

function toDaysSince(input) {
  const diff = Date.now() - new Date(input).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

async function githubRequest(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'adgenxai-pr-triage-script',
      Accept: 'application/vnd.github+json',
      Authorization: token ? `Bearer ${token}` : undefined,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub request failed (${response.status} ${response.statusText}) for ${url}: ${text}`);
  }

  return response.json();
}

async function fetchAllPulls(repo, token) {
  const pulls = [];
  let page = 1;
  const perPage = 100;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url = `https://api.github.com/repos/${repo}/pulls?state=open&per_page=${perPage}&page=${page}`;
    const pageData = await githubRequest(url, token);
    if (!Array.isArray(pageData) || pageData.length === 0) {
      break;
    }
    pulls.push(...pageData);
    if (pageData.length < perPage) {
      break;
    }
    page += 1;
  }

  return pulls;
}

function summarizeChecks(statusResponse) {
  if (!statusResponse || typeof statusResponse !== 'object') {
    return { state: 'unknown', description: 'No status information' };
  }

  const { state, statuses = [] } = statusResponse;
  const description = statuses
    .map((status) => `${status.context}: ${status.state}`)
    .join('; ');

  return { state: state ?? 'unknown', description: description || 'No checks reported' };
}

function summarizeReviews(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return { approved: false, changesRequested: false };
  }

  const latestReviewByUser = new Map();
  for (const review of reviews) {
    latestReviewByUser.set(review.user?.login ?? 'unknown', review.state);
  }

  let approved = false;
  let changesRequested = false;
  for (const state of latestReviewByUser.values()) {
    if (state === 'APPROVED') {
      approved = true;
    }
    if (state === 'CHANGES_REQUESTED') {
      changesRequested = true;
    }
  }

  return { approved, changesRequested };
}

function deriveCategory({
  pr,
  checks,
  reviewSummary,
  config,
}) {
  const daysOpen = toDaysSince(pr.created_at);
  const daysSinceUpdate = toDaysSince(pr.updated_at);
  const wipLabel = pr.labels?.some((label) => /wip|work in progress/i.test(label.name ?? ''));

  if (daysSinceUpdate >= config.staleDays) {
    return {
      category: 'stale',
      action: 'comment-to-close',
      rationale: `No updates for ${daysSinceUpdate} days (opened ${daysOpen} days ago).`,
    };
  }

  if (pr.draft || wipLabel) {
    return {
      category: 'work-in-progress',
      action: 'confirm-status',
      rationale: pr.draft ? 'Draft PR.' : 'Marked with WIP label.',
    };
  }

  if (checks.state === 'success' && reviewSummary.approved) {
    return {
      category: 'ready-to-merge',
      action: 'queue-for-merge',
      rationale: 'CI green with approval.',
    };
  }

  if (checks.state === 'success') {
    return {
      category: 'needs-review',
      action: 'request-review',
      rationale: 'CI passed but no approval recorded.',
    };
  }

  if (checks.state === 'pending') {
    return {
      category: 'pending-checks',
      action: 'wait-for-ci',
      rationale: 'CI checks still running.',
    };
  }

  if (checks.state === 'failure') {
    const inactiveReason = daysSinceUpdate >= config.inactiveDays
      ? `CI failing and no updates for ${daysSinceUpdate} days.`
      : 'CI failing.';
    return {
      category: 'needs-author-action',
      action: 'request-fix',
      rationale: inactiveReason,
    };
  }

  return {
    category: 'uncategorized',
    action: 'manual-review',
    rationale: 'Unable to determine state from CI and reviews.',
  };
}

async function collectDetails(repo, token, config) {
  const pulls = await fetchAllPulls(repo, token);
  const records = [];

  for (const pr of pulls) {
    const [statusResponse, reviews] = await Promise.all([
      githubRequest(`https://api.github.com/repos/${repo}/commits/${pr.head.sha}/status`, token),
      githubRequest(`https://api.github.com/repos/${repo}/pulls/${pr.number}/reviews`, token),
    ]);

    const checks = summarizeChecks(statusResponse);
    const reviewSummary = summarizeReviews(reviews);
    const { category, action, rationale } = deriveCategory({ pr, checks, reviewSummary, config });

    records.push({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      author: pr.user?.login ?? 'unknown',
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      draft: pr.draft,
      labels: (pr.labels || []).map((label) => label.name).join(', '),
      checks,
      reviewSummary,
      category,
      action,
      rationale,
    });
  }

  return records;
}

function renderSummary(records) {
  const counts = records.reduce((acc, record) => {
    acc[record.category] = (acc[record.category] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([category, count]) => `| ${category} | ${count} |`)
    .join('\n');

  return ['| Category | Count |', '| --- | ---: |', entries || '| (none) | 0 |'].join('\n');
}

function renderMetadata({ jobId, generatedAt, totalPRs, categories, sizeBytes }) {
  const rows = [
    '| key | value |',
    '| --- | --- |',
    `| jobId | ${jobId} |`,
    `| generatedAt | ${generatedAt} |`,
    `| totalPRs | ${totalPRs} |`,
    `| categories | ${categories.length ? categories.join(', ') : '(none)'} |`,
  ];

  if (typeof sizeBytes === 'number') {
    rows.push(`| sizeBytes | ${sizeBytes} |`);
  }

  return rows.join('\n');
}

function renderReport({ repo, generatedAt, metadataTable, summaryTable, detailsTable }) {
  return [
    `# Pull Request Triage Report for ${repo}`,
    '',
    `Generated: ${generatedAt}`,
    '',
    '## Operational Metadata',
    metadataTable,
    '',
    '## Summary',
    summaryTable,
    '',
    '## Details',
    detailsTable,
    '',
    '> Report generated by `npm run triage:prs`.',
    '',
  ].join('\n');
}

function renderDetails(records) {
  const header = [
    '| PR | Author | Created | Updated | Draft | CI | Reviews | Category | Action | Rationale |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  const rows = records
    .sort((a, b) => a.number - b.number)
    .map((record) => {
      const created = `${toISODate(record.createdAt)} (${toDaysSince(record.createdAt)}d)`;
      const updated = `${toISODate(record.updatedAt)} (${toDaysSince(record.updatedAt)}d)`;
      const ci = `${record.checks.state}${record.checks.description ? ` — ${record.checks.description}` : ''}`;
      const reviews = record.reviewSummary.approved
        ? 'approved'
        : record.reviewSummary.changesRequested
          ? 'changes requested'
          : 'none';
      const draft = record.draft ? 'yes' : 'no';
      const title = record.title.replace(/\|/g, '\\|');

      return `| [#${record.number}](${record.url}) ${title} | ${record.author} | ${created} | ${updated} | ${draft} | ${ci} | ${reviews} | ${record.category} | ${record.action} | ${record.rationale.replace(/\|/g, '\\|')} |`;
    });

  return header.concat(rows).join('\n');
}

async function writeOutput(records, outputPath, repo, jobId) {
  const generatedAt = new Date().toISOString();
  const summaryTable = renderSummary(records);
  const detailsTable = renderDetails(records);
  const categories = Array.from(new Set(records.map((record) => record.category))).sort();

  let metadataTable = renderMetadata({
    jobId,
    generatedAt,
    totalPRs: records.length,
    categories,
  });

  let content = renderReport({
    repo,
    generatedAt,
    metadataTable,
    summaryTable,
    detailsTable,
  });

  const sizeBytes = Buffer.byteLength(content, 'utf8');
  metadataTable = renderMetadata({
    jobId,
    generatedAt,
    totalPRs: records.length,
    categories,
    sizeBytes,
  });

  content = renderReport({
    repo,
    generatedAt,
    metadataTable,
    summaryTable,
    detailsTable,
  });

  if (outputPath) {
    const resolved = path.resolve(outputPath);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, content, 'utf8');
    return { outputPath: resolved, content, sizeBytes };
  }

  return { outputPath: null, content, sizeBytes };
}

async function main() {
  const args = parseArgs(process.argv);
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }
  
  const repo = args.repo || env('GITHUB_REPOSITORY');

  if (!repo) {
    console.error('Repository must be provided via --repo or GITHUB_REPOSITORY.');
    console.error('Use --help for usage information.');
    process.exit(1);
  }

  const token = args.token || env('GITHUB_TOKEN');
  if (!token) {
    console.warn('⚠️  No GitHub token provided. You may be rate limited for public repositories.');
  }

  const config = {
    staleDays: args['stale-days'] ? Number(args['stale-days']) : DEFAULT_CONFIG.staleDays,
    inactiveDays: args['inactive-days'] ? Number(args['inactive-days']) : DEFAULT_CONFIG.inactiveDays,
    recentDays: args['recent-days'] ? Number(args['recent-days']) : DEFAULT_CONFIG.recentDays,
    dryRun: args['dry-run'] || false,
  };

  try {
    const records = await collectDetails(repo, token, config);
    const jobId = args['job-id'] || crypto.randomUUID();
    
    if (config.dryRun) {
      console.log('🔍 DRY RUN MODE: Analysis only, no changes will be applied');
    }
    
    const { outputPath, content, sizeBytes } = await writeOutput(records, args.output, repo, jobId);

    if (outputPath) {
      console.log(`Triage report written to ${outputPath}`);
      if (config.dryRun) {
        console.log('📋 Safe to review - no GitHub actions were taken');
      }
    }

    const categoryList = Array.from(new Set(records.map((record) => record.category))).sort().join(', ') || '(none)';
    console.log(`[pr-triage-metadata] jobId=${jobId} totalPRs=${records.length} sizeBytes=${sizeBytes} categories=${categoryList} dryRun=${config.dryRun}`);
    console.log(content);
  } catch (error) {
    console.error(`Failed to generate triage report: ${error.message}`);
    process.exit(1);
  }
}

main();
