// agents/github-pr-manager/src/ai-service.js

export class AIService {
  constructor(aiServiceUrl = 'http://localhost:8000') {
    this.aiServiceUrl = aiServiceUrl;
    this.model = 'ai/smollm2';
  }

  async analyzePR(prData) {
    const prompt = this.buildPRAnalysisPrompt(prData);
    
    try {
      const response = await this.callAI(prompt, {
        temperature: 0.3,
        max_tokens: 1024,
        system: "You are an expert code reviewer and GitHub automation assistant."
      });

      return this.parsePRAnalysis(response);
    } catch (error) {
      console.error('AI analysis failed:', error.message);
      return this.fallbackAnalysis(prData);
    }
  }

  buildPRAnalysisPrompt(prData) {
    return `Analyze this pull request and provide structured feedback:

Title: ${prData.title}
Description: ${prData.body || 'No description'}
Files changed: ${prData.files?.length || 0}
Lines added: ${prData.additions || 0}
Lines deleted: ${prData.deletions || 0}
Author: ${prData.user?.login}
Draft: ${prData.draft}

File changes:
${prData.files?.slice(0, 10).map(f => `- ${f.filename} (+${f.additions}/-${f.deletions})`).join('\n') || 'No file details'}

Please provide:
1. Risk Level (low/medium/high/critical)
2. Review Priority (low/medium/high/urgent)
3. Suggested reviewers based on file changes
4. Potential issues or concerns
5. Merge recommendation (approve/request-changes/needs-review)
6. Brief summary of changes

Respond in JSON format.`;
  }

  async callAI(prompt, options = {}) {
    const response = await fetch(`${this.aiServiceUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: options.system || 'You are a helpful AI assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 512
      })
    });

    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  parsePRAnalysis(aiResponse) {
    try {
      // Try to parse JSON response
      const analysis = JSON.parse(aiResponse);
      
      return {
        riskLevel: analysis.riskLevel || 'medium',
        priority: analysis.priority || 'medium',
        suggestedReviewers: analysis.suggestedReviewers || [],
        concerns: analysis.concerns || [],
        recommendation: analysis.recommendation || 'needs-review',
        summary: analysis.summary || 'AI analysis completed',
        aiGenerated: true
      };
    } catch (error) {
      // Fallback to text parsing if JSON fails
      return this.parseTextAnalysis(aiResponse);
    }
  }

  parseTextAnalysis(text) {
    const riskKeywords = {
      critical: ['security', 'authentication', 'database', 'production', 'critical'],
      high: ['api', 'migration', 'breaking', 'major'],
      medium: ['feature', 'enhancement', 'update'],
      low: ['docs', 'test', 'typo', 'comment']
    };

    let riskLevel = 'medium';
    const lowerText = text.toLowerCase();
    
    for (const [level, keywords] of Object.entries(riskKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        riskLevel = level;
        break;
      }
    }

    return {
      riskLevel,
      priority: riskLevel === 'critical' ? 'urgent' : 'medium',
      suggestedReviewers: [],
      concerns: [],
      recommendation: 'needs-review',
      summary: text.substring(0, 200) + '...',
      aiGenerated: true
    };
  }

  fallbackAnalysis(prData) {
    // Rule-based fallback when AI is unavailable
    let riskLevel = 'low';
    const concerns = [];

    // Risk assessment based on file patterns
    if (prData.files?.some(f => f.filename.includes('package.json'))) {
      riskLevel = 'medium';
      concerns.push('Dependency changes detected');
    }

    if (prData.files?.some(f => 
      f.filename.includes('auth') || 
      f.filename.includes('security') ||
      f.filename.includes('.env')
    )) {
      riskLevel = 'high';
      concerns.push('Security-related files modified');
    }

    if ((prData.additions || 0) + (prData.deletions || 0) > 1000) {
      riskLevel = 'high';
      concerns.push('Large changeset - thorough review needed');
    }

    return {
      riskLevel,
      priority: riskLevel === 'high' ? 'high' : 'medium',
      suggestedReviewers: [],
      concerns,
      recommendation: riskLevel === 'high' ? 'request-changes' : 'needs-review',
      summary: `Automated analysis: ${prData.files?.length || 0} files changed`,
      aiGenerated: false
    };
  }

  async generateReviewComment(prData, analysis) {
    const prompt = `Generate a helpful code review comment for this PR:

Title: ${prData.title}
Risk Level: ${analysis.riskLevel}
Concerns: ${analysis.concerns.join(', ')}
Summary: ${analysis.summary}

Generate a constructive, professional comment that:
1. Acknowledges the work done
2. Highlights any concerns
3. Provides actionable feedback
4. Maintains a positive tone

Keep it concise (2-3 paragraphs max).`;

    try {
      const comment = await this.callAI(prompt, {
        temperature: 0.5,
        max_tokens: 300,
        system: "You are a senior developer providing constructive code review feedback."
      });

      return comment.trim();
    } catch (error) {
      return this.generateFallbackComment(analysis);
    }
  }

  generateFallbackComment(analysis) {
    const templates = {
      low: "Thanks for this contribution! The changes look straightforward. Please ensure tests are included and documentation is updated if needed.",
      medium: "Good work on this PR! I've identified a few areas that might need attention. Please review the automated analysis and address any concerns before merging.",
      high: "This PR includes significant changes that require careful review. Please ensure all security implications are considered and comprehensive testing is completed.",
      critical: "⚠️ This PR contains critical changes that require immediate attention. Please have a senior team member review all security and production implications before proceeding."
    };

    let comment = templates[analysis.riskLevel] || templates.medium;
    
    if (analysis.concerns.length > 0) {
      comment += `\n\n**Areas of concern:**\n${analysis.concerns.map(c => `- ${c}`).join('\n')}`;
    }

    comment += "\n\n*This comment was generated by the GitHub PR management system.*";
    
    return comment;
  }

  async analyzeIssue(issueData) {
    const prompt = `Analyze this GitHub issue and suggest categorization:

Title: ${issueData.title}
Body: ${issueData.body || 'No description'}
Labels: ${issueData.labels?.map(l => l.name).join(', ') || 'None'}
Author: ${issueData.user?.login}

Suggest:
1. Issue type (bug/feature/enhancement/question/documentation)
2. Priority (low/medium/high/urgent)
3. Estimated complexity (simple/moderate/complex)
4. Suggested labels
5. Whether it needs more information

Respond in JSON format.`;

    try {
      const response = await this.callAI(prompt, {
        temperature: 0.4,
        max_tokens: 512,
        system: "You are an expert project manager analyzing GitHub issues."
      });

      return JSON.parse(response);
    } catch (error) {
      return this.fallbackIssueAnalysis(issueData);
    }
  }

  fallbackIssueAnalysis(issueData) {
    const title = (issueData.title || '').toLowerCase();
    const body = (issueData.body || '').toLowerCase();
    
    let type = 'enhancement';
    if (title.includes('bug') || title.includes('error') || title.includes('fail')) {
      type = 'bug';
    } else if (title.includes('feature') || title.includes('add')) {
      type = 'feature';
    } else if (title.includes('doc') || title.includes('readme')) {
      type = 'documentation';
    }

    return {
      type,
      priority: 'medium',
      complexity: 'moderate',
      suggestedLabels: [type],
      needsMoreInfo: !body || body.length < 50,
      aiGenerated: false
    };
  }
}