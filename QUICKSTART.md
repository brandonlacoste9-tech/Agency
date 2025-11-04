# GitHub PR & Issue Management System - Quick Start Guide

## 🚀 Immediate CLI Access

The PR triage CLI is ready to use right now! Here are the quickest ways to get started:

### 1. Basic PR Triage (Works Immediately)

```bash
# Navigate to the adgenxai directory
cd adgenxai

# Run PR triage for a specific repository
npm run triage:prs -- --repo owner/repo-name

# Examples:
npm run triage:prs -- --repo microsoft/vscode
npm run triage:prs -- --repo vercel/next.js
npm run triage:prs -- --repo brandonlacoste9-tech/adgenxai
```

### 2. With GitHub Token (Recommended)

To avoid rate limits, set your GitHub token:

**Option A: Environment Variable**
```bash
# Windows PowerShell
$env:GITHUB_TOKEN="your_github_token_here"
npm run triage:prs -- --repo owner/repo-name

# Linux/Mac
export GITHUB_TOKEN="your_github_token_here"
npm run triage:prs -- --repo owner/repo-name
```

**Option B: Command Line Argument**
```bash
npm run triage:prs -- --repo owner/repo-name --token your_github_token_here
```

### 3. CLI Options

```bash
# Available options:
npm run triage:prs -- --help

# Common usage patterns:
npm run triage:prs -- --repo owner/repo --state open
npm run triage:prs -- --repo owner/repo --limit 10
npm run triage:prs -- --repo owner/repo --output pr-report.md
```

## 🎯 What You Get

The CLI generates comprehensive reports including:

- **PR Categorization**: Bug fixes, features, dependencies, documentation
- **Priority Assessment**: High, medium, low based on various factors
- **Security Analysis**: Identifies potential security concerns
- **Complexity Scoring**: Estimates review difficulty
- **Stale PR Detection**: Finds PRs that need attention
- **Markdown Reports**: Beautiful, formatted output

## 📊 Sample Output

```markdown
# PR Triage Report for microsoft/vscode

## Summary
- Total PRs: 85
- High Priority: 12
- Security Concerns: 3
- Stale PRs: 8

## High Priority PRs

### 🚨 #12345 - Fix critical memory leak in extension host
- **Category**: Bug Fix
- **Priority**: High
- **Security Risk**: Medium
- **Age**: 2 days
```

## 🔧 Advanced Agent System Setup

For the full multi-agent system with webhooks and specialized review agents, see `DEPLOYMENT_GUIDE.md`.

The agent system includes:
- **Real-time webhook processing**
- **Specialized AI agents** for security, performance, documentation
- **Auto-labeling and assignment**
- **Slack/Teams integration**
- **Kubernetes deployment**

## 📚 Documentation

- `docs/pr-triage.md` - Detailed CLI workflow documentation
- `DEPLOYMENT_GUIDE.md` - Complete agent system setup
- `agents/github-pr-manager/README.md` - Agent system architecture

## 🐛 Troubleshooting

### Rate Limiting (403 Forbidden)
- **Solution**: Add GitHub token using methods above
- **Note**: This is expected behavior without authentication

### "Repository not found" (404)
- **Check**: Repository name format should be `owner/repo-name`
- **Check**: Repository is public or token has access

### Network Issues
- **Check**: Internet connection
- **Try**: Different repository as test

## 🎉 Success!

You now have a powerful GitHub PR triage system. Start with the CLI for immediate productivity, then explore the full agent system when you're ready for enterprise-grade automation!

### Next Steps

1. **Try the CLI** with your favorite repository
2. **Generate a report** and explore the categorization
3. **Set up a GitHub token** for unlimited access
4. **Explore the agent system** when ready for advanced features

Happy triaging! 🚀
