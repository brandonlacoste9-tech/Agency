#!/usr/bin/env node

/**
 * GitHub Agent System Startup Script
 * Simple setup and testing utility
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const AGENT_DIR = './agents/github-pr-manager';
const ENV_FILE = join(AGENT_DIR, '.env');

console.log('🚀 GitHub PR & Issue Management Agent System');
console.log('===============================================\n');

// Check if agent directory exists
if (!existsSync(AGENT_DIR)) {
  console.error('❌ Agent directory not found:', AGENT_DIR);
  console.log('Make sure you have the agents/github-pr-manager directory');
  process.exit(1);
}

console.log('✅ Agent directory found');

// Check if dependencies are installed
const packageLockPath = join(AGENT_DIR, 'package-lock.json');
if (!existsSync(packageLockPath)) {
  console.log('📦 Installing agent dependencies...');
  try {
    execSync('npm install', { 
      cwd: AGENT_DIR, 
      stdio: 'inherit' 
    });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }
} else {
  console.log('✅ Dependencies already installed');
}

// Check if .env file exists
if (!existsSync(ENV_FILE)) {
  console.log('⚙️  Creating development .env file...');
  
  const devEnv = `# GitHub Agent System - Development Configuration
# This is a minimal setup for testing without webhooks

# GitHub Configuration (optional for basic testing)
# GITHUB_APP_ID=123456
# GITHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"
# GITHUB_INSTALLATION_ID=78901234
# GITHUB_WEBHOOK_SECRET=dev_webhook_secret

# Server Configuration
PORT=3000
NODE_ENV=development

# Agent Configuration
MAX_CONCURRENT_TASKS=5
TASK_TIMEOUT=60000
RETRY_ATTEMPTS=2

# Mock Agent Endpoints (these will return success responses)
SECURITY_AGENT_ENDPOINT=http://localhost:3001
CODE_REVIEW_AGENT_ENDPOINT=http://localhost:3002
TESTING_AGENT_ENDPOINT=http://localhost:3003
DOCUMENTATION_AGENT_ENDPOINT=http://localhost:3004
PERFORMANCE_AGENT_ENDPOINT=http://localhost:3005
DEPLOYMENT_AGENT_ENDPOINT=http://localhost:3006

# Database (SQLite for development)
DATABASE_URL=sqlite://./github_agent_dev.db

# Monitoring
MONITORING_ENABLED=false

# Logging
LOG_LEVEL=info
LOG_FORMAT=pretty

# Feature Flags
ENABLE_AUTO_MERGE=false
ENABLE_CODE_GENERATION=false
ENABLE_ISSUE_AUTO_ASSIGNMENT=false
ENABLE_PR_AUTO_LABELING=false
`;

  writeFileSync(ENV_FILE, devEnv);
  console.log('✅ Development .env file created');
  console.log('📝 Edit', ENV_FILE, 'to add your GitHub App credentials for full functionality');
}

// Build TypeScript
console.log('🔨 Building TypeScript...');
try {
  execSync('npm run build', { 
    cwd: AGENT_DIR, 
    stdio: 'inherit' 
  });
  console.log('✅ TypeScript build complete');
} catch (error) {
  console.error('❌ TypeScript build failed');
  process.exit(1);
}

console.log('\n🎉 Setup complete! Choose an option:\n');

console.log('1️⃣  Start CLI PR Triage (works immediately):');
console.log('   npm run triage:prs -- --repo brandonlacoste9-tech/adgenxai\n');

console.log('2️⃣  Start Agent System (development mode):');
console.log('   cd agents/github-pr-manager && npm run dev\n');

console.log('3️⃣  Test Agent System APIs:');
console.log('   # In another terminal after starting the agent:');
console.log('   curl http://localhost:3000/health');
console.log('   curl http://localhost:3000/status\n');

console.log('4️⃣  Setup GitHub App for full webhook integration:');
console.log('   # See DEPLOYMENT_GUIDE.md for complete setup\n');

console.log('📚 More info: cat DEPLOYMENT_GUIDE.md');
console.log('🚀 Happy automating!');
