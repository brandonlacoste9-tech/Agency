# GitHub App Configuration
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----"
GITHUB_INSTALLATION_ID=78901234
GITHUB_WEBHOOK_SECRET=secret

# Agent Endpoints
SECURITY_AGENT_ENDPOINT=http://localhost:3001
CODE_REVIEW_AGENT_ENDPOINT=http://localhost:3002
# ... additional agents

# System Configuration
MAX_CONCURRENT_TASKS=10
TASK_TIMEOUT=300000
DATABASE_URL=postgresql://user:pass@host/db

function execCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    // Properly escape arguments to avoid security warning
    const child = spawn(command, args, {
      stdio: options.stdio || 'pipe',
      cwd: options.cwd || process.cwd(),
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code === 0 || options.reject === false) {
        resolve({ stdout, stderr, code });
      } else {
        const error = new Error(`Command failed: ${command} ${args.join(' ')}\n${stderr}`);
        error.code = code;
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      }
    });

    child.on('error', reject);
  });
}

# Deploy the GitHub Agent platform
npm run agent:deploy

# Check platform health
npm run agent:health

# Show current status
npm run agent:status

# Start continuous monitoring
npm run agent:monitor

# Direct CLI access
npx github-agent --help










