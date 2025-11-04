# GitHub CLI Automation Integration Guide

## Quick Start

1. Install custom GitHub CLI for your platform
2. Configure authentication: `gh-custom auth login`
3. Run automation scripts

## Available Scripts

### PowerShell (Windows)
- `pr-automation-enhanced.ps1` - Enhanced PR automation with custom CLI
- `pr-automation-v2.ps1` - Advanced automation with smart merge and health dashboard
- `start-agents.ps1` - Agent system startup with environment setup

### Usage Examples

`powershell
# Health check with custom CLI
.\pr-automation-v2.ps1 -Action health-dashboard

# Smart merge with priority scoring
.\pr-automation-v2.ps1 -Action smart-merge -DryRun

# Performance testing
.\pr-automation-v2.ps1 -Action performance-test

# Full repository audit
.\pr-automation-v2.ps1 -Action full-audit
`

## Node.js Integration

`javascript
import { EnhancedGitHubCLI } from './enhanced-cli-integration.js';

const cli = new EnhancedGitHubCLI({
    customCliPath: '/usr/local/bin/gh-custom'
});

await cli.initialize();
const prs = await cli.getAllPRs('owner/repo');
`

## Features

- ✅ Custom GitHub CLI builds for multiple platforms
- ✅ Performance monitoring and metrics
- ✅ Smart merge with priority scoring
- ✅ Health dashboard and auditing
- ✅ Cross-platform automation scripts
- ✅ Agent system integration
- ✅ Batch operations and error handling

## Configuration

Set environment variables:
- `GITHUB_TOKEN` - Your GitHub personal access token
- `GITHUB_REPOSITORY` - Default repository (owner/repo format)
- `CUSTOM_GH_CLI` - Path to custom CLI binary
