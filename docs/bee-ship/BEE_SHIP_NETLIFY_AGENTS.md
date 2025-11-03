# 🤖 Netlify AI Agents for BEE-SHIP

Automate development tasks using Netlify's AI agents.

## 📋 What are Netlify Agents?

Netlify Agents are AI-powered assistants that can:
- Write and modify code
- Run tests and fix bugs
- Add new features
- Review and improve code quality
- Generate documentation
- Deploy and monitor your site

They work directly with your Git repository and can make commits, create branches, and open pull requests.

---

## 🚀 Quick Start

### Prerequisites

1. **Install/Update Netlify CLI:**
```bash
npm install -g netlify-cli@latest
```

2. **Login to Netlify:**
```bash
netlify login
```

3. **Link your project** (if not already linked):
```bash
cd C:\Users\north\OneDrive\Documents\GitHub\AdGenXAI-temp
netlify link
```

---

## 🎯 Common Tasks for BEE-SHIP

### 1. Test Your Social Media Functions

```bash
netlify agents:create "Test all three social media posting functions (Instagram, YouTube, TikTok) and create a comprehensive test report with any issues found"
```

### 2. Add Rate Limiting

```bash
netlify agents:create "Add rate limiting to the Instagram posting function to prevent API quota exhaustion. Limit to 10 requests per minute per user." --agent claude
```

### 3. Implement TikTok Integration

```bash
netlify agents:create "Complete the TikTok posting implementation in lib/platforms/tiktok.ts using the TikTok Content Posting API v2" --agent claude --branch feature/tiktok-integration
```

### 4. Add Error Logging

```bash
netlify agents:create "Add comprehensive error logging and monitoring to all posting functions using console.error and structured logging" --agent claude
```

### 5. Generate API Tests

```bash
netlify agents:create "Create Jest unit tests for all three social media posting functions with mock API responses" --agent claude
```

### 6. Security Audit

```bash
netlify agents:create "Review all social media posting functions for security vulnerabilities including input validation, XSS, and secrets exposure" --agent claude
```

### 7. Add Authentication

```bash
netlify agents:create "Add JWT authentication middleware to all posting functions to prevent unauthorized access" --agent claude --branch feature/auth
```

### 8. Performance Optimization

```bash
netlify agents:create "Optimize the YouTube upload function to handle large video files more efficiently" --agent claude
```

### 9. Add Webhook Support

```bash
netlify agents:create "Create a webhook endpoint that triggers social media posts when content is created in Supabase" --agent claude
```

### 10. Documentation Updates

```bash
netlify agents:create "Update BEE_SHIP_API_DOCS.md with detailed error codes and troubleshooting steps for each function" --agent claude
```

---

## 📊 Managing Agents

### List All Agents

```bash
# Show all agents
netlify agents:list

# Show only running agents
netlify agents:list --status running

# Show completed agents
netlify agents:list --status done

# Show as JSON
netlify agents:list --json
```

### View Agent Details

```bash
# Show details of a specific agent
netlify agents:show <agent-id>

# Example:
netlify agents:show 60c7c3b3e7b4a0001f5e4b3a
```

### Stop a Running Agent

```bash
netlify agents:stop <agent-id>

# Example:
netlify agents:stop 60c7c3b3e7b4a0001f5e4b3a
```

---

## 🎨 Advanced Usage

### Use Different AI Models

```bash
# Use Claude (default)
netlify agents:create "Add feature X" --agent claude

# Use Codex
netlify agents:create "Add feature X" --agent codex

# Use Gemini
netlify agents:create "Add feature X" --agent gemini
```

### Specify Model Version

```bash
netlify agents:create "Add feature X" --agent claude --model claude-sonnet-4-5
```

### Work on Specific Branch

```bash
# Create agent on feature branch
netlify agents:create "Add dark mode" --branch feature/dark-mode

# Agent will create branch if it doesn't exist
```

### Use in Monorepo

```bash
# Specify application in monorepo
netlify agents:create "Add tests" --filter my-app-name
```

---

## 💡 Best Practices

### 1. Be Specific with Prompts

❌ **Bad:**
```bash
netlify agents:create "Fix bugs"
```

✅ **Good:**
```bash
netlify agents:create "Fix the CORS error in post-to-instagram function when called from external domains. Add appropriate CORS headers."
```

### 2. Break Down Complex Tasks

Instead of:
```bash
netlify agents:create "Build complete authentication system with OAuth, JWT, rate limiting, and user management"
```

Do this:
```bash
netlify agents:create "Add JWT authentication middleware" --branch feature/auth-step1
netlify agents:create "Add OAuth login support" --branch feature/auth-step2
netlify agents:create "Add rate limiting" --branch feature/auth-step3
```

### 3. Reference Specific Files

```bash
netlify agents:create "Add error handling to netlify/functions/post-to-instagram.ts to catch network timeouts and retry failed requests"
```

### 4. Provide Context

```bash
netlify agents:create "Update the Instagram posting function to support carousel posts (multiple images). Follow the same pattern used in lib/platforms/instagram.ts for single images."
```

### 5. Use Branches for Features

```bash
netlify agents:create "Add video thumbnail generation" --branch feature/thumbnails
```

---

## 🔥 Practical BEE-SHIP Workflows

### Workflow 1: Add New Platform

```bash
# Step 1: Create platform module
netlify agents:create "Create a new LinkedIn platform module at lib/platforms/linkedin.ts following the same pattern as instagram.ts. Support text posts with optional images." --branch feature/linkedin

# Step 2: Create function
netlify agents:create "Create netlify/functions/post-to-linkedin.ts that uses the LinkedIn platform module" --branch feature/linkedin

# Step 3: Update examples
netlify agents:create "Add LinkedIn posting example to examples/social-posting-client.ts and examples/social-posting-demo.html" --branch feature/linkedin

# Step 4: Document
netlify agents:create "Update BEE_SHIP_API_DOCS.md with LinkedIn API endpoint documentation" --branch feature/linkedin
```

### Workflow 2: Improve Error Handling

```bash
netlify agents:create "Add retry logic with exponential backoff to all social media posting functions. Retry up to 3 times on network errors."
```

### Workflow 3: Add Analytics

```bash
netlify agents:create "Add analytics tracking to all posting functions. Log platform, success/failure, timestamp, and response time to Supabase analytics table."
```

### Workflow 4: Content Scheduling

```bash
netlify agents:create "Create a scheduling system that allows users to queue posts for future publishing. Store scheduled posts in Supabase and use Netlify scheduled functions to publish them." --branch feature/scheduling
```

---

## 📈 Monitoring Agent Progress

### Check Status

```bash
# List all agents with status
netlify agents:list

# Output:
# ID                        Status    Prompt
# 60c7c3b3e7b4a0001f5e4b3a  running  Add rate limiting to Instagram
# 60c7c3b3e7b4a0001f5e4b3b  done     Fix CORS errors
# 60c7c3b3e7b4a0001f5e4b3c  error    Add authentication
```

### View Detailed Progress

```bash
netlify agents:show 60c7c3b3e7b4a0001f5e4b3a

# Shows:
# - Current step
# - Files modified
# - Commits made
# - Errors encountered
# - Estimated completion time
```

---

## 🛠️ Integration with CI/CD

### Trigger Agents from GitHub Actions

Create `.github/workflows/agent-tasks.yml`:

```yaml
name: Netlify Agent Tasks

on:
  issues:
    types: [labeled]

jobs:
  run-agent:
    if: github.event.label.name == 'agent-task'
    runs-on: ubuntu-latest
    steps:
      - name: Run Netlify Agent
        run: |
          npm install -g netlify-cli
          netlify agents:create "${{ github.event.issue.title }}" --auth ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

### Scheduled Agent Tasks

Run agents on a schedule:

```yaml
name: Weekly Dependency Updates

on:
  schedule:
    - cron: '0 0 * * 0' # Every Sunday

jobs:
  update-deps:
    runs-on: ubuntu-latest
    steps:
      - name: Update Dependencies
        run: |
          netlify agents:create "Update all npm dependencies to latest versions and run tests" --auth ${{ secrets.NETLIFY_AUTH_TOKEN }}
```

---

## 🚨 Troubleshooting

### Agent Stuck in "running" Status

```bash
# Check agent details
netlify agents:show <agent-id>

# If truly stuck, stop it
netlify agents:stop <agent-id>

# Recreate with more specific prompt
netlify agents:create "Your more specific prompt here"
```

### Agent Failed with Error

```bash
# View error details
netlify agents:show <agent-id>

# Common fixes:
# 1. Make prompt more specific
# 2. Break into smaller tasks
# 3. Provide more context about existing code
```

### Agent Made Incorrect Changes

```bash
# If agent created a branch:
git checkout main
git branch -D <agent-branch>

# If agent committed to main:
git revert <commit-hash>
```

### Authentication Issues

```bash
# Re-login to Netlify
netlify logout
netlify login

# Or use auth token
netlify agents:create "prompt" --auth YOUR_TOKEN
```

---

## 💰 Cost Considerations

- Netlify Agents may have usage limits based on your plan
- Complex tasks consume more credits
- Monitor your agent usage in the Netlify dashboard
- Use specific prompts to avoid wasted agent time

---

## 🎓 Learning Resources

- [Netlify Agents Documentation](https://docs.netlify.com/cli/agents/)
- [Netlify CLI Reference](https://docs.netlify.com/cli/get-started/)
- [Best Practices for AI Prompts](https://docs.netlify.com/cli/agents/best-practices/)

---

## 📋 Useful Agent Prompts for BEE-SHIP

Copy and paste these ready-to-use prompts:

```bash
# Add input validation
netlify agents:create "Add comprehensive input validation to all posting functions. Validate URLs, text length, file sizes, and required fields."

# Add request logging
netlify agents:create "Add detailed request/response logging to all functions for debugging. Log to console with timestamps and request IDs."

# Optimize bundle size
netlify agents:create "Analyze and reduce the bundle size of all Netlify functions. Remove unused dependencies and optimize imports."

# Add health checks
netlify agents:create "Create a health check endpoint that tests connectivity to Instagram, YouTube, and TikTok APIs."

# Generate OpenAPI spec
netlify agents:create "Generate an OpenAPI 3.0 specification document for all BEE-SHIP API endpoints."

# Add CORS handling
netlify agents:create "Add proper CORS headers to all posting functions to support requests from any origin."

# Create admin dashboard
netlify agents:create "Create an admin dashboard HTML page that shows statistics for all social media posts (count, success rate, errors)."

# Add image optimization
netlify agents:create "Add automatic image optimization to the Instagram posting function. Resize and compress images before uploading."

# Implement queuing
netlify agents:create "Implement a job queue system using Supabase for handling multiple simultaneous posting requests."

# Add webhooks
netlify agents:create "Create webhook endpoints that notify external systems when posts succeed or fail."
```

---

## 🎯 Quick Reference

| Command | Purpose |
|---------|---------|
| `netlify agents:create "prompt"` | Create new agent task |
| `netlify agents:list` | List all agents |
| `netlify agents:list --status running` | Show running agents |
| `netlify agents:show <id>` | View agent details |
| `netlify agents:stop <id>` | Stop running agent |
| `netlify agents:create "prompt" --branch name` | Create on specific branch |
| `netlify agents:create "prompt" --agent claude` | Use specific AI model |

---

**Automate your BEE-SHIP development with AI!** 🤖🐝
