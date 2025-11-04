# AI Integration Configuration for GitHub PR Manager

## AI Service Configuration

### SmolLM2 Model Parameters
- **Model**: ai/smollm2
- **Temperature**: 0.3 (focused, deterministic responses)
- **Max Tokens**: 2048 (sufficient for detailed analysis)
- **Top P**: 0.9 (balanced creativity vs accuracy)
- **Frequency Penalty**: 0.1 (reduce repetition)
- **Presence Penalty**: 0.1 (encourage diverse topics)

### PR Analysis Settings
- **Risk Levels**: low, medium, high, critical
- **Priority Levels**: low, medium, high, urgent
- **Analysis Frequency**: Every 5 minutes for open PRs
- **Comment Threshold**: Only high/critical risk PRs get AI comments
- **Re-analysis Cooldown**: 24 hours per PR

### Environment Variables

```bash
# Core GitHub Integration
GITHUB_TOKEN=your_github_pat_token
GITHUB_REPOSITORY=owner/repository
WEBHOOK_SECRET=your_webhook_secret

# AI Configuration
ENABLE_AI_ANALYSIS=true
AI_SERVICE_URL=http://localhost:8000
PROMOTE_DRAFTS=false

# Service Configuration
NODE_ENV=production
PORT=3001

# Optional: Database
DB_PASSWORD=secure_database_password
GRAFANA_PASSWORD=secure_grafana_password
```

### AI Prompts and Analysis

#### PR Analysis Prompt Structure
1. **Context**: PR title, description, file changes, author
2. **Analysis Request**: Risk assessment, priority, concerns
3. **Output Format**: Structured JSON response
4. **Fallback**: Rule-based analysis if AI unavailable

#### Issue Analysis Prompt Structure
1. **Context**: Issue title, description, labels, author
2. **Categorization**: Type, priority, complexity estimation
3. **Label Suggestions**: Based on content analysis
4. **Information Assessment**: Whether more details needed

### Security Considerations

1. **Webhook Verification**: Always verify GitHub webhook signatures
2. **Token Security**: Never log or expose GitHub tokens
3. **AI Privacy**: Ensure AI service doesn't store sensitive code
4. **Rate Limiting**: Respect GitHub API rate limits
5. **Error Handling**: Graceful fallback when AI unavailable

### Performance Tuning

1. **Caching**: Use Redis for AI response caching
2. **Batching**: Process multiple PRs efficiently
3. **Throttling**: Limit concurrent AI requests
4. **Monitoring**: Track AI response times and accuracy

### Monitoring and Metrics

1. **Health Checks**: Regular service availability checks
2. **Performance Metrics**: Response times, success rates
3. **Usage Analytics**: AI analysis frequency and accuracy
4. **Error Tracking**: Failed analyses and reasons

### Customization Options

#### Risk Assessment Rules
- Security file modifications → High risk
- Large changesets (>1000 lines) → High risk
- Dependency updates → Medium risk
- Documentation only → Low risk

#### Auto-labeling Logic
- High risk PRs → 'high-risk' label
- Critical PRs → 'critical-risk' label
- AI analyzed → 'ai-analyzed' label
- Priority levels → corresponding priority labels

#### Comment Generation
- High/Critical risk only to avoid noise
- Constructive, professional tone
- Actionable feedback and suggestions
- Clear indication of AI generation

### Troubleshooting

#### Common Issues
1. **AI Service Unavailable**: Falls back to rule-based analysis
2. **Token Permissions**: Ensure read/write access to repository
3. **Webhook Failures**: Check signature verification
4. **Rate Limiting**: Implement exponential backoff

#### Debugging
1. Check application logs: `npx pm2 logs github-pr-manager`
2. Verify health endpoints: `curl http://localhost:3001/health`
3. Test AI service: `curl http://localhost:8000/health`
4. Monitor webhook deliveries in GitHub settings

### Integration Examples

#### Webhook Setup in GitHub
1. Go to Repository Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/webhook`
3. Set content type: `application/json`
4. Select events: Pull requests, Issues
5. Add webhook secret from your configuration

#### Docker Deployment
```bash
# Start full stack with AI
docker compose -f agents/docker-compose-ai.yml up -d

# View logs
docker compose -f agents/docker-compose-ai.yml logs -f github-pr-manager

# Stop services
docker compose -f agents/docker-compose-ai.yml down
```

#### Local Development
```bash
# Set environment variables
$env:GITHUB_TOKEN = "your_token"
$env:GITHUB_REPOSITORY = "owner/repo"

# Run setup script
.\agents\setup-ai-integration.ps1 -Development

# Start AI service (if running locally)
# Follow your AI service documentation
```

This configuration provides a comprehensive AI-powered GitHub automation system with intelligent PR analysis, risk assessment, and automated workflow management.