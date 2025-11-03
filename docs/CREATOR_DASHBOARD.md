# Creator Dashboard Guide

## Overview

The Creator Dashboard is your hub for managing AI-generated content, tracking performance, and optimizing your creative workflow. It provides a unified interface for creating, managing, and analyzing all your AI generations.

## Dashboard Features

### 1. **Overview (Home)**
The dashboard home provides at-a-glance metrics and quick access to key features:

- **Total Generations**: Count of all AI requests made
- **Success Rate**: Percentage of successful generations
- **Average Latency**: Time to first token (streaming performance)
- **Tokens Used**: Total tokens consumed today
- **Most Used Model**: Your primary choice for generations
- **Recent Projects**: Last 5 generations with status
- **Daily Quota**: Remaining tokens for today

#### Quick Actions
- Create New: Jump to the creation interface
- View Analytics: Dive deeper into performance metrics

---

### 2. **Projects Gallery**
Browse and manage all your AI-generated projects in a beautiful gallery format.

#### Features
- **Grid View**: Visual card layout with thumbnails
- **Filtering**: Filter by status (All, Successful, Failed)
- **Expandable Cards**: Click to see full prompts and outputs
- **Metrics**: View tokens used, latency, and generation date
- **Tagging**: Find projects by custom tags
- **Sorting**: Sort by date, latency, or tokens

#### Project Card Info
```
Title: Generation name
Status: Success ✅ / Failed ❌ / Pending ⏳
Model: Which AI model was used
Tokens: Input + output token count
Latency: Time to first token
Date: When it was generated
Tags: Searchable metadata
```

---

### 3. **Analytics Dashboard**
Deep dive into your generation performance with real-time metrics and visualizations.

#### Key Metrics
- **Total Requests**: Cumulative generations
- **Success Rate**: % of successful completions
- **Average Latency**: First token arrival time
- **Abort Rate**: % of manually stopped generations

#### Views

**Model Performance**
- Request count per model
- Success rate by model
- Latency breakdown

**Latency Distribution**
- Histogram of response times
- 0-100ms, 100-500ms, 500-1000ms, etc.
- Identify slow provider issues

**Daily Trends**
- Historical data over selected period
- Request volume trends
- Token consumption over time
- Latency trends

**Cost Analysis**
- Estimated cost per period
- Cost per 1K tokens
- Monthly projection
- Provider cost breakdown

#### Time Range Selection
- **24h**: Last 24 hours
- **7d**: Last 7 days (default)
- **30d**: Last month

---

### 4. **Prompt Templates Library**
Browse curated templates to accelerate your creative process.

#### Template Categories
- **Commercial**: Product launches, sales, promotions
- **Narrative**: Stories, brand videos, documentaries
- **Comedy**: Humorous content, skits, parodies
- **Educational**: Tutorials, explainers, guides
- **Product**: Demos, showcases, comparisons
- **Storytelling**: Character-driven, emotional narratives

#### Template Features
- **Search**: Full-text search across titles, descriptions, tags
- **Tags**: Filter by keywords (#product, #viral, #tutorial)
- **Difficulty**: Easy / Medium / Hard
- **Usage Count**: See how many times template was used
- **Rating**: Community ratings (⭐ 1-5)
- **Copy Prompt**: One-click prompt copying
- **Use Template**: Start a generation with this template

#### Template Structure
```
Title: Clear, descriptive name
Description: One-line summary
Prompt: Parameterized template with {placeholders}
Category: Primary category
Difficulty: Skill level required
Metrics: Uses, ratings, trending
```

#### Example Template
```
Title: Product Showcase
Category: Commercial
Difficulty: Easy

Prompt: Create a sleek product showcase video
featuring a {product} on a minimalist white
background. Show the product rotating slowly
with soft lighting. Duration: 15 seconds.
```

---

### 5. **Video Generations (Sora)**
Manage your Sora video generation jobs with real-time queue visualization.

#### Generation Workflow
1. **Submit**: Write or paste your video prompt (max 1000 chars)
2. **Model Selection**: Choose Sora 1 (faster) or Sora 1 HD (quality)
3. **Queue**: Job enters processing queue
4. **Monitor**: Watch real-time status updates
5. **Download**: Access completed video with one click

#### Job Status Indicators
- **⏳ Queued**: Waiting to be processed
- **⚙️ Processing**: Being generated (60-300 seconds)
- **✅ Completed**: Ready to download
- **❌ Failed**: Error occurred, retry or modify prompt

#### Job Details
- **Prompt**: Your generation description
- **Model**: Sora 1 or Sora 1 HD
- **Duration**: Processing time for completed jobs
- **Video URL**: Download link when ready
- **Error Messages**: Details if generation fails

#### Tips for Better Videos
- Be specific about visual style, lighting, mood
- Describe camera movements and angles
- Include character/object details
- Mention duration (5s, 15s, 30s)
- Test with Sora 1 before using HD for cost savings

---

### 6. **Settings**
Configure your AI provider connections and API keys.

#### Provider Setup

**GitHub Models (Recommended for Getting Started)**
- ✅ Free tier available
- ✅ No credit card required
- ✅ Multiple models: GPT-4o, Claude 3.5, Llama 2
- ⚠️ Lower rate limit (100 req/min)
- 📖 [GitHub Models Docs](https://github.com/marketplace/models)

**Setup Steps**:
1. Visit [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Create new fine-grained personal access token
3. Grant "Copilot" scope
4. Paste token in Settings → GitHub Models
5. Click "Validate & Save"

**OpenAI (Recommended for Production)**
- 💰 Pay-as-you-go pricing ($0.002-0.02 per 1K tokens)
- ⚡ Fast inference (50-100ms avg)
- 🚀 Higher rate limit (3,500 req/min)
- 🔧 Most capable models (GPT-4 Turbo)
- 📖 [OpenAI API Docs](https://platform.openai.com/docs)

**Setup Steps**:
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create new secret key
3. Set up billing at [Billing Settings](https://platform.openai.com/account/billing/overview)
4. Paste key in Settings → OpenAI
5. Click "Validate & Save"

#### Provider Comparison
| Feature | GitHub Models | OpenAI |
|---------|---------------|--------|
| Cost | Free | $0.002/1K tokens |
| Best Models | GPT-4o, Claude | GPT-4 Turbo |
| Speed | Fast | Very Fast |
| Rate Limit | 100 req/min | 3,500 req/min |
| Best For | Development | Production |

#### Failover & Redundancy
AdGenXAI automatically:
1. Attempts primary provider (OpenAI if configured)
2. Falls back to GitHub Models if unavailable
3. Shows which provider handled each request
4. Logs failover events for transparency

---

## Navigation Guide

### Sidebar Menu
```
Creator Studio
├── 📊 Overview        → Dashboard home
├── 🎬 Projects        → Gallery of generations
├── 📈 Analytics       → Performance metrics
├── 📝 Templates       → Prompt library
├── ✨ Generations     → Sora job queue
└── ⚙️ Settings        → Provider configuration
```

### Common Workflows

#### "I want to create content"
1. Click "Create New" button on Overview
2. Or navigate to `/` (main app page)
3. Use PromptCard to generate with your chosen model

#### "I want to track my costs"
1. Go to Analytics
2. Check "Cost Analysis" section
3. Filter by time range
4. Monitor tokens/cost trends

#### "I want to use a prompt template"
1. Go to Templates
2. Search or filter by category
3. Click "Copy Prompt"
4. Paste into PromptCard on home page
5. Customize parameters as needed

#### "I want to generate a video"
1. Go to Generations (Sora)
2. Write your video description
3. Choose model (Sora 1 for speed, Sora 1 HD for quality)
4. Click "Generate Video"
5. Monitor progress in the queue
6. Download when complete

#### "I want to set up a new provider"
1. Go to Settings
2. Choose GitHub Models or OpenAI
3. Follow setup instructions
4. Paste API key
5. Click "Validate & Save"
6. Confirm "✓ Configured" badge appears

---

## Best Practices

### For Cost Efficiency
- ✅ Monitor daily token usage in Overview
- ✅ Check Analytics for latency to identify slow providers
- ✅ Use GitHub Models for development/testing
- ✅ Review failed generations to avoid waste
- ✅ Set reasonable expectations for generation counts

### For Quality
- ✅ Use Sora 1 HD only for important video projects
- ✅ Review and refine prompts using Templates as guides
- ✅ Test on different models to find best fit
- ✅ Look at success rate trends in Analytics
- ✅ Save high-performing prompts as custom templates

### For Performance
- ✅ Use OpenAI (if configured) for production
- ✅ Understand that streaming latency = first token time
- ✅ Expect slower generation for complex prompts
- ✅ Check rate limits in Settings before high-volume jobs
- ✅ Use Analytics to identify bottlenecks

### For Organization
- ✅ Tag projects consistently for easy filtering
- ✅ Update project titles with descriptive names
- ✅ Archive completed projects/campaigns
- ✅ Create template variants for A/B testing
- ✅ Document which models perform best per task

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + /` | Show hotkeys |
| `→` | Next in Projects gallery |
| `←` | Previous in Projects gallery |
| `Space` | Expand/collapse project card |
| `Escape` | Close expanded card |

---

## Troubleshooting

### Provider Not Validating
**Problem**: "Invalid API key" error
- ✅ Double-check your token/key was copied fully
- ✅ Ensure token hasn't expired
- ✅ Check provider website for account status
- ✅ Try creating a new token/key

### Videos Not Generating
**Problem**: Sora jobs stuck in "Queued"
- ✅ Check API key in Settings
- ✅ Verify prompt under 1000 characters
- ✅ Try a shorter, simpler prompt first
- ✅ Check rate limits haven't been exceeded

### High Latency
**Problem**: "Avg Latency" very high in Analytics
- ✅ Check which provider is being used
- ✅ Provider may be overloaded, try again later
- ✅ Test with GitHub Models for comparison
- ✅ Review Provider status in Settings

### Missing Metrics
**Problem**: Analytics showing no data
- ✅ Change time range to include your generations
- ✅ Ensure at least 1 generation completed successfully
- ✅ Check that metrics were enabled (default: on)

---

## API Integration (Advanced)

### Dashboard Data Endpoints
```
GET  /api/dashboard/stats        → Overview metrics
GET  /api/dashboard/projects     → All projects
GET  /api/analytics?action=report → Analytics data
GET  /api/sora/jobs              → Video jobs
POST /api/providers/validate      → Validate provider
```

### Provider Validation
```typescript
POST /api/providers/validate
{
  "provider": "github-models" | "openai",
  "apiKey": "your-key-here"
}

Response:
{
  "provider": "github-models",
  "valid": true,
  "message": "Connected as username",
  "details": {
    "models": ["gpt-4o", "claude-3-5-sonnet"],
    "requestsPerMinute": 100
  }
}
```

---

## What's Next

### Coming Soon
- 🎨 Custom template creation
- 📊 Advanced analytics with custom date ranges
- 🤝 Team collaboration features
- 💾 Prompt version history
- 🔗 Social sharing with attribution
- 📧 Email exports and reports
- 🌍 Multi-language prompt templates

---

## Support & Resources

- **Docs**: [Full documentation](./docs/)
- **Provider Integration Guide**: [PROVIDER_INTEGRATION.md](./docs/PROVIDER_INTEGRATION.md)
- **API Reference**: [API Documentation](./docs/API.md)
- **GitHub Issues**: [Report bugs or request features](https://github.com/your-repo/issues)
- **Email**: support@adgenxai.com

---

## Quick Start Checklist

- [ ] Visit `/dashboard` to see your Overview
- [ ] Check a project in Projects gallery
- [ ] Review your metrics in Analytics
- [ ] Browse templates in Templates library
- [ ] Configure at least one provider in Settings
- [ ] Create your first generation
- [ ] Check stats updated in Overview
- [ ] Explore Sora video generation

Welcome to Creator Studio! 🚀
