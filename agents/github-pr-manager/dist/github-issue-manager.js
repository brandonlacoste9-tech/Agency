"use strict";
/**
 * GitHub Issue Manager
 *
 * Handles GitHub issues creation, management, and coordination with PRs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubIssueManager = void 0;
class GitHubIssueManager {
    octokit;
    logger;
    issueContexts = new Map();
    issueTemplates = new Map();
    constructor(octokit, logger) {
        this.octokit = octokit;
        this.logger = logger;
        this.initializeIssueTemplates();
    }
    /**
     * Handle GitHub issue webhook events
     */
    async handleIssueEvent(event) {
        const { action, issue, repository } = event;
        const issueKey = `${repository.full_name}#${issue.number}`;
        this.logger.info('Handling issue event', {
            action,
            issue: issueKey,
            title: issue.title
        });
        switch (action) {
            case 'opened':
                await this.processNewIssue(issue, repository);
                break;
            case 'edited':
                await this.processIssueUpdate(issue, repository);
                break;
            case 'assigned':
                await this.handleIssueAssignment(issue, repository, event.assignee);
                break;
            case 'labeled':
                await this.handleIssueLabelUpdate(issue, repository, event.label);
                break;
            case 'closed':
                await this.handleIssueClosure(issue, repository);
                break;
            case 'reopened':
                await this.handleIssueReopened(issue, repository);
                break;
        }
    }
    /**
     * Process a newly opened issue
     */
    async processNewIssue(issue, repository) {
        const issueKey = `${repository.full_name}#${issue.number}`;
        try {
            // Analyze the issue
            const analysis = await this.analyzeIssue(issue, repository);
            // Create issue context
            const context = {
                issue,
                repository,
                analysis,
                timestamp: new Date(),
                status: 'new',
                relatedPRs: [],
                assignedAgents: []
            };
            this.issueContexts.set(issueKey, context);
            // Auto-triage the issue
            await this.triageIssue(context);
            // Generate tasks based on issue type
            if (analysis.canAutoGenerate) {
                await this.generateAutomatedTasks(context);
            }
            // Check for duplicate issues
            await this.checkForDuplicates(context);
            // Link to related issues/PRs
            await this.linkRelatedItems(context);
            this.logger.info('New issue processed', {
                issue: issueKey,
                type: analysis.type,
                priority: analysis.priority,
                complexity: analysis.complexity
            });
        }
        catch (error) {
            this.logger.error('Error processing new issue', {
                issue: issueKey,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    /**
     * Analyze an issue to determine type, priority, and required actions
     */
    async analyzeIssue(issue, repository) {
        const title = issue.title.toLowerCase();
        const body = (issue.body || '').toLowerCase();
        const labels = issue.labels.map((l) => l.name.toLowerCase());
        const text = `${title} ${body}`;
        // Determine issue type
        const type = this.determineIssueType(text, labels);
        // Determine priority
        const priority = this.determinePriority(text, labels, type);
        // Assess complexity
        const complexity = this.assessComplexity(text, type);
        // Estimate effort
        const estimatedHours = this.estimateEffort(complexity, type);
        // Extract required skills
        const requiredSkills = this.extractRequiredSkills(text, type);
        // Generate acceptance criteria
        const acceptanceCriteria = this.generateAcceptanceCriteria(text, type);
        // Suggest approach
        const suggestedApproach = this.suggestApproach(text, type, complexity);
        // Identify risk factors
        const riskFactors = this.identifyRiskFactors(text, type);
        // Check if needs more info
        const needsMoreInfo = this.needsMoreInformation(text, type);
        // Check if can auto-generate
        const canAutoGenerate = this.canAutoGenerateCode(text, type);
        return {
            id: `analysis-${issue.number}-${Date.now()}`,
            issueNumber: issue.number,
            repository: repository.full_name,
            type,
            priority,
            complexity,
            estimatedHours,
            labels: labels,
            assignees: issue.assignees.map((a) => a.login),
            requiredSkills,
            dependencies: this.extractDependencies(text),
            blockers: [],
            relatedIssues: [],
            suggestedApproach,
            acceptanceCriteria,
            riskFactors,
            needsMoreInfo,
            canAutoGenerate,
            requiresHumanReview: !canAutoGenerate || complexity === 'complex' || complexity === 'very-complex'
        };
    }
    /**
     * Determine issue type from text and labels
     */
    determineIssueType(text, labels) {
        // Check labels first
        if (labels.includes('bug') || labels.includes('defect'))
            return 'bug';
        if (labels.includes('feature') || labels.includes('enhancement'))
            return 'feature';
        if (labels.includes('documentation') || labels.includes('docs'))
            return 'documentation';
        if (labels.includes('security') || labels.includes('vulnerability'))
            return 'security';
        if (labels.includes('performance') || labels.includes('optimization'))
            return 'performance';
        if (labels.includes('question') || labels.includes('help'))
            return 'question';
        if (labels.includes('maintenance') || labels.includes('chore'))
            return 'maintenance';
        // Analyze text content
        const bugKeywords = ['bug', 'error', 'issue', 'problem', 'broken', 'not working', 'fails', 'crash', 'exception'];
        const featureKeywords = ['feature', 'add', 'implement', 'new', 'create', 'build', 'develop'];
        const docKeywords = ['documentation', 'docs', 'readme', 'guide', 'tutorial', 'example'];
        const securityKeywords = ['security', 'vulnerability', 'exploit', 'unauthorized', 'permission', 'auth'];
        const performanceKeywords = ['performance', 'slow', 'optimization', 'speed', 'memory', 'cpu'];
        const questionKeywords = ['how', 'why', 'what', 'question', 'help', 'clarification'];
        if (bugKeywords.some(keyword => text.includes(keyword)))
            return 'bug';
        if (securityKeywords.some(keyword => text.includes(keyword)))
            return 'security';
        if (performanceKeywords.some(keyword => text.includes(keyword)))
            return 'performance';
        if (docKeywords.some(keyword => text.includes(keyword)))
            return 'documentation';
        if (questionKeywords.some(keyword => text.includes(keyword)))
            return 'question';
        if (featureKeywords.some(keyword => text.includes(keyword)))
            return 'feature';
        return 'enhancement'; // Default
    }
    /**
     * Determine priority level
     */
    determinePriority(text, labels, type) {
        // Check explicit priority labels
        if (labels.includes('critical') || labels.includes('urgent'))
            return 'critical';
        if (labels.includes('high') || labels.includes('high-priority'))
            return 'high';
        if (labels.includes('low') || labels.includes('low-priority'))
            return 'low';
        // Security and bugs are generally higher priority
        if (type === 'security')
            return 'critical';
        if (type === 'bug') {
            const criticalBugKeywords = ['crash', 'data loss', 'security', 'production', 'critical', 'urgent'];
            if (criticalBugKeywords.some(keyword => text.includes(keyword)))
                return 'critical';
            const highBugKeywords = ['error', 'broken', 'not working', 'fails'];
            if (highBugKeywords.some(keyword => text.includes(keyword)))
                return 'high';
            return 'medium';
        }
        // Feature priority based on keywords
        const highPriorityKeywords = ['urgent', 'asap', 'blocking', 'critical', 'important'];
        const lowPriorityKeywords = ['nice to have', 'later', 'future', 'optional', 'enhancement'];
        if (highPriorityKeywords.some(keyword => text.includes(keyword)))
            return 'high';
        if (lowPriorityKeywords.some(keyword => text.includes(keyword)))
            return 'low';
        return 'medium'; // Default
    }
    /**
     * Assess complexity of the issue
     */
    assessComplexity(text, type) {
        let complexityScore = 0;
        // Text length factor
        if (text.length > 2000)
            complexityScore += 2;
        else if (text.length > 1000)
            complexityScore += 1;
        // Type-based complexity
        switch (type) {
            case 'security':
                complexityScore += 3;
                break;
            case 'performance':
                complexityScore += 2;
                break;
            case 'bug':
                complexityScore += 1;
                break;
            case 'feature':
                complexityScore += 2;
                break;
            case 'documentation':
                complexityScore += 0;
                break;
            case 'question':
                complexityScore += 0;
                break;
        }
        // Complexity keywords
        const complexKeywords = ['refactor', 'architecture', 'design', 'algorithm', 'optimization', 'migration', 'integration'];
        const simpleKeywords = ['typo', 'text', 'color', 'style', 'copy', 'link'];
        if (complexKeywords.some(keyword => text.includes(keyword)))
            complexityScore += 2;
        if (simpleKeywords.some(keyword => text.includes(keyword)))
            complexityScore -= 1;
        // Multiple system involvement
        const systemKeywords = ['database', 'api', 'frontend', 'backend', 'deployment', 'infrastructure'];
        const systemCount = systemKeywords.filter(keyword => text.includes(keyword)).length;
        complexityScore += Math.min(systemCount, 3);
        // Determine complexity level
        if (complexityScore >= 6)
            return 'very-complex';
        if (complexityScore >= 4)
            return 'complex';
        if (complexityScore >= 2)
            return 'moderate';
        if (complexityScore >= 1)
            return 'simple';
        return 'trivial';
    }
    /**
     * Estimate effort in hours
     */
    estimateEffort(complexity, type) {
        const baseHours = {
            'trivial': 1,
            'simple': 3,
            'moderate': 8,
            'complex': 20,
            'very-complex': 40
        };
        let hours = baseHours[complexity];
        // Type multipliers
        const typeMultipliers = {
            'security': 1.5,
            'performance': 1.3,
            'bug': 1.0,
            'feature': 1.2,
            'enhancement': 1.1,
            'documentation': 0.8,
            'question': 0.3,
            'maintenance': 0.9
        };
        hours *= typeMultipliers[type];
        return Math.round(hours);
    }
    /**
     * Extract required skills from issue content
     */
    extractRequiredSkills(text, type) {
        const skills = [];
        // Programming languages
        const languages = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'php', 'ruby', 'c#', 'swift', 'kotlin'];
        languages.forEach(lang => {
            if (text.includes(lang))
                skills.push(lang);
        });
        // Frameworks and libraries
        const frameworks = ['react', 'vue', 'angular', 'next.js', 'express', 'fastapi', 'django', 'spring', 'rails'];
        frameworks.forEach(framework => {
            if (text.includes(framework))
                skills.push(framework);
        });
        // Technologies
        const technologies = ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'postgresql', 'mongodb', 'redis', 'graphql', 'rest'];
        technologies.forEach(tech => {
            if (text.includes(tech))
                skills.push(tech);
        });
        // Domain-specific skills based on type
        switch (type) {
            case 'security':
                skills.push('security', 'cryptography', 'authentication');
                break;
            case 'performance':
                skills.push('optimization', 'profiling', 'caching');
                break;
            case 'documentation':
                skills.push('technical-writing', 'markdown');
                break;
        }
        return [...new Set(skills)]; // Remove duplicates
    }
    /**
     * Generate acceptance criteria based on issue content
     */
    generateAcceptanceCriteria(text, type) {
        const criteria = [];
        switch (type) {
            case 'bug':
                criteria.push('The reported issue is no longer reproducible');
                criteria.push('Existing functionality remains unaffected');
                criteria.push('Tests pass successfully');
                break;
            case 'feature':
                criteria.push('Feature functions as described');
                criteria.push('User interface is intuitive and accessible');
                criteria.push('Feature is properly tested');
                criteria.push('Documentation is updated');
                break;
            case 'security':
                criteria.push('Security vulnerability is patched');
                criteria.push('Security tests pass');
                criteria.push('No new security issues introduced');
                criteria.push('Security documentation updated');
                break;
            case 'performance':
                criteria.push('Performance metrics meet target thresholds');
                criteria.push('No regression in other areas');
                criteria.push('Performance tests added');
                break;
            case 'documentation':
                criteria.push('Documentation is clear and accurate');
                criteria.push('Examples are working and up-to-date');
                criteria.push('Documentation follows style guide');
                break;
        }
        return criteria;
    }
    /**
     * Suggest approach for solving the issue
     */
    suggestApproach(text, type, complexity) {
        const approach = [];
        // Common first steps
        approach.push('Reproduce the issue/understand requirements');
        approach.push('Review existing codebase and documentation');
        switch (type) {
            case 'bug':
                approach.push('Identify root cause through debugging');
                approach.push('Write test case that reproduces the bug');
                approach.push('Implement fix with minimal changes');
                approach.push('Verify fix with comprehensive testing');
                break;
            case 'feature':
                approach.push('Design feature architecture and API');
                approach.push('Create wireframes/mockups if UI involved');
                approach.push('Implement core functionality');
                approach.push('Add comprehensive tests');
                approach.push('Update documentation');
                break;
            case 'security':
                approach.push('Conduct security assessment');
                approach.push('Review security best practices');
                approach.push('Implement security measures');
                approach.push('Perform security testing');
                approach.push('Document security considerations');
                break;
            case 'performance':
                approach.push('Profile current performance');
                approach.push('Identify performance bottlenecks');
                approach.push('Implement optimizations');
                approach.push('Benchmark improvements');
                break;
        }
        if (complexity === 'complex' || complexity === 'very-complex') {
            approach.push('Break down into smaller subtasks');
            approach.push('Create implementation plan with milestones');
            approach.push('Consider backward compatibility');
        }
        return approach;
    }
    /**
     * Identify potential risk factors
     */
    identifyRiskFactors(text, type) {
        const risks = [];
        // General risks
        if (text.includes('breaking change')) {
            risks.push('Potential breaking changes for existing users');
        }
        if (text.includes('database') || text.includes('migration')) {
            risks.push('Database migration risks');
        }
        if (text.includes('production') || text.includes('live')) {
            risks.push('Production environment impact');
        }
        // Type-specific risks
        switch (type) {
            case 'security':
                risks.push('Security vulnerability exposure during fix');
                risks.push('Potential authentication/authorization issues');
                break;
            case 'performance':
                risks.push('Risk of performance regression');
                risks.push('Memory or CPU usage changes');
                break;
            case 'feature':
                risks.push('Scope creep potential');
                risks.push('Integration complexity with existing features');
                break;
        }
        return risks;
    }
    /**
     * Check if issue needs more information
     */
    needsMoreInformation(text, type) {
        // Very short descriptions likely need more info
        if (text.length < 100)
            return true;
        // Missing reproduction steps for bugs
        if (type === 'bug' && !text.includes('reproduce') && !text.includes('steps')) {
            return true;
        }
        // Missing requirements for features
        if (type === 'feature' && !text.includes('should') && !text.includes('requirement')) {
            return true;
        }
        return false;
    }
    /**
     * Check if code can be auto-generated
     */
    canAutoGenerateCode(text, type) {
        // Simple documentation tasks can be auto-generated
        if (type === 'documentation' &&
            (text.includes('readme') || text.includes('api doc') || text.includes('comment'))) {
            return true;
        }
        // Simple configuration changes
        if (text.includes('config') || text.includes('setting') || text.includes('environment')) {
            return true;
        }
        // Simple test additions
        if (text.includes('test') && text.includes('simple')) {
            return true;
        }
        // Boilerplate code generation
        if (text.includes('boilerplate') || text.includes('template') || text.includes('scaffold')) {
            return true;
        }
        return false;
    }
    /**
     * Extract dependency issue numbers
     */
    extractDependencies(text) {
        const dependencies = [];
        // Look for patterns like "depends on #123" or "blocked by #456"
        const patterns = [
            /depends?\s+on\s+#(\d+)/gi,
            /blocked?\s+by\s+#(\d+)/gi,
            /requires?\s+#(\d+)/gi,
            /needs?\s+#(\d+)/gi
        ];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                dependencies.push(parseInt(match[1]));
            }
        });
        return [...new Set(dependencies)]; // Remove duplicates
    }
    /**
     * Auto-triage the issue based on analysis
     */
    async triageIssue(context) {
        const { issue, repository, analysis } = context;
        try {
            // Add appropriate labels
            const labelsToAdd = this.generateLabels(analysis);
            if (labelsToAdd.length > 0) {
                await this.octokit.issues.addLabels({
                    owner: repository.owner.login,
                    repo: repository.name,
                    issue_number: issue.number,
                    labels: labelsToAdd
                });
            }
            // Set milestone if applicable
            if (analysis.priority === 'critical' || analysis.priority === 'urgent') {
                // Could set to current sprint/milestone
            }
            // Add initial comment with analysis
            const triageComment = this.generateTriageComment(analysis);
            await this.octokit.issues.createComment({
                owner: repository.owner.login,
                repo: repository.name,
                issue_number: issue.number,
                body: triageComment
            });
            // Request more info if needed
            if (analysis.needsMoreInfo) {
                await this.requestMoreInformation(context);
            }
            context.status = 'triaged';
            this.logger.info('Issue triaged', {
                issue: `${repository.full_name}#${issue.number}`,
                type: analysis.type,
                priority: analysis.priority
            });
        }
        catch (error) {
            this.logger.error('Error triaging issue', {
                issue: `${repository.full_name}#${issue.number}`,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    /**
     * Generate appropriate labels for the issue
     */
    generateLabels(analysis) {
        const labels = [];
        // Type label
        labels.push(analysis.type);
        // Priority label
        if (analysis.priority !== 'medium') {
            labels.push(`priority-${analysis.priority}`);
        }
        // Complexity label
        if (analysis.complexity === 'complex' || analysis.complexity === 'very-complex') {
            labels.push('complex');
        }
        // Effort label
        if (analysis.estimatedHours >= 20) {
            labels.push('large');
        }
        else if (analysis.estimatedHours >= 8) {
            labels.push('medium');
        }
        else {
            labels.push('small');
        }
        // Skill labels
        analysis.requiredSkills.forEach(skill => {
            labels.push(`skill-${skill}`);
        });
        // Special labels
        if (analysis.canAutoGenerate) {
            labels.push('auto-generate');
        }
        if (analysis.needsMoreInfo) {
            labels.push('needs-info');
        }
        if (analysis.requiresHumanReview) {
            labels.push('human-review');
        }
        return labels;
    }
    /**
     * Generate triage comment
     */
    generateTriageComment(analysis) {
        return `## 🤖 Automated Triage

**Issue Analysis:**
- **Type:** ${analysis.type}
- **Priority:** ${analysis.priority}
- **Complexity:** ${analysis.complexity}
- **Estimated Effort:** ${analysis.estimatedHours} hours

**Required Skills:** ${analysis.requiredSkills.join(', ') || 'None specified'}

**Suggested Approach:**
${analysis.suggestedApproach.map(step => `- ${step}`).join('\n')}

**Acceptance Criteria:**
${analysis.acceptanceCriteria.map(criteria => `- [ ] ${criteria}`).join('\n')}

${analysis.riskFactors.length > 0 ? `\n**Risk Factors:**\n${analysis.riskFactors.map(risk => `⚠️ ${risk}`).join('\n')}` : ''}

${analysis.canAutoGenerate ? '\n✨ **This issue may be suitable for automated code generation**' : ''}

---
*This analysis was generated automatically. Please review and adjust as needed.*`;
    }
    /**
     * Request more information from issue author
     */
    async requestMoreInformation(context) {
        const { issue, repository, analysis } = context;
        let infoRequest = '## ℹ️ More Information Needed\n\n';
        if (analysis.type === 'bug') {
            infoRequest += `To help us resolve this bug, please provide:

- **Steps to reproduce:** Detailed steps to recreate the issue
- **Expected behavior:** What should happen
- **Actual behavior:** What actually happens
- **Environment:** OS, browser, version numbers
- **Screenshots/logs:** If applicable

You can edit your original issue description to add this information.`;
        }
        else if (analysis.type === 'feature') {
            infoRequest += `To help us implement this feature, please provide:

- **User story:** As a [user type], I want [functionality] so that [benefit]
- **Detailed requirements:** Specific functionality needed
- **Use cases:** How this feature would be used
- **Success criteria:** How to measure success
- **Mockups/wireframes:** If applicable

You can edit your original issue description to add this information.`;
        }
        else {
            infoRequest += `Please provide more detailed information about this ${analysis.type}. The current description is too brief for us to effectively address the issue.`;
        }
        await this.octokit.issues.createComment({
            owner: repository.owner.login,
            repo: repository.name,
            issue_number: issue.number,
            body: infoRequest
        });
        // Add "needs-info" label
        await this.octokit.issues.addLabels({
            owner: repository.owner.login,
            repo: repository.name,
            issue_number: issue.number,
            labels: ['needs-info']
        });
    }
    /**
     * Generate automated tasks for auto-generatable issues
     */
    async generateAutomatedTasks(context) {
        const { analysis } = context;
        if (!analysis.canAutoGenerate)
            return;
        const tasks = [];
        // Documentation generation task
        if (analysis.type === 'documentation') {
            tasks.push({
                id: `doc-gen-${analysis.issueNumber}-${Date.now()}`,
                type: 'documentation',
                priority: 'medium',
                agentType: 'documentation-agent',
                payload: {
                    issueNumber: analysis.issueNumber,
                    repository: analysis.repository,
                    type: 'auto-generate',
                    requirements: analysis.acceptanceCriteria
                },
                timeout: 300000,
                retries: 1
            });
        }
        // Code generation task
        if (analysis.type === 'feature' && analysis.complexity === 'simple') {
            tasks.push({
                id: `code-gen-${analysis.issueNumber}-${Date.now()}`,
                type: 'code_generation',
                priority: 'medium',
                agentType: 'code-generation-agent',
                payload: {
                    issueNumber: analysis.issueNumber,
                    repository: analysis.repository,
                    type: 'auto-generate',
                    requirements: analysis.acceptanceCriteria,
                    approach: analysis.suggestedApproach
                },
                timeout: 600000,
                retries: 1
            });
        }
        // Queue tasks for execution
        // This would integrate with the AgentOrchestrator
        if (tasks.length > 0) {
            this.logger.info('Generated automated tasks for issue', {
                issue: `${analysis.repository}#${analysis.issueNumber}`,
                taskCount: tasks.length
            });
        }
    }
    /**
     * Check for duplicate issues
     */
    async checkForDuplicates(context) {
        const { issue, repository } = context;
        try {
            // Search for similar issues
            const searchQuery = `repo:${repository.full_name} is:issue "${issue.title.substring(0, 50)}"`;
            const { data: searchResults } = await this.octokit.search.issuesAndPullRequests({
                q: searchQuery
            });
            // Filter out the current issue and find potential duplicates
            const potentialDuplicates = searchResults.items
                .filter(item => item.number !== issue.number && item.state === 'open')
                .filter(item => this.calculateSimilarity(issue.title, item.title) > 0.7);
            if (potentialDuplicates.length > 0) {
                const duplicateComment = `## 🔍 Potential Duplicates Found

This issue may be related to or duplicate of:
${potentialDuplicates.map(dup => `- #${dup.number}: ${dup.title}`).join('\n')}

Please review these issues to see if they address the same concern.`;
                await this.octokit.issues.createComment({
                    owner: repository.owner.login,
                    repo: repository.name,
                    issue_number: issue.number,
                    body: duplicateComment
                });
                await this.octokit.issues.addLabels({
                    owner: repository.owner.login,
                    repo: repository.name,
                    issue_number: issue.number,
                    labels: ['possible-duplicate']
                });
            }
        }
        catch (error) {
            this.logger.error('Error checking for duplicates', {
                issue: `${repository.full_name}#${issue.number}`,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    /**
     * Calculate text similarity (simple implementation)
     */
    calculateSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        return intersection.length / union.length;
    }
    /**
     * Link related issues and PRs
     */
    async linkRelatedItems(context) {
        // Implementation would search for and link related issues/PRs
        // based on keywords, labels, and content similarity
    }
    /**
     * Create issue from PR analysis
     */
    async createIssueFromPR(prContext, issueType, details) {
        const { pr, repository, analysis } = prContext;
        try {
            const template = this.issueTemplates.get(issueType);
            if (!template) {
                this.logger.error('Unknown issue template', { issueType });
                return null;
            }
            const issueTitle = template.title
                .replace('{PR_NUMBER}', pr.number.toString())
                .replace('{PR_TITLE}', pr.title);
            const issueBody = template.body
                .replace('{PR_NUMBER}', pr.number.toString())
                .replace('{PR_URL}', pr.html_url)
                .replace('{DETAILS}', JSON.stringify(details, null, 2));
            const { data: issue } = await this.octokit.issues.create({
                owner: repository.owner.login,
                repo: repository.name,
                title: issueTitle,
                body: issueBody,
                labels: template.labels,
                assignees: template.assignees
            });
            this.logger.info('Created issue from PR', {
                pr: `${repository.full_name}#${pr.number}`,
                issue: `${repository.full_name}#${issue.number}`,
                type: issueType
            });
            return issue.number;
        }
        catch (error) {
            this.logger.error('Error creating issue from PR', {
                pr: `${repository.full_name}#${pr.number}`,
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }
    /**
     * Initialize issue templates
     */
    initializeIssueTemplates() {
        this.issueTemplates.set('security-vulnerability', {
            type: 'security-vulnerability',
            title: 'Security Review Required for PR #{PR_NUMBER}',
            body: `# Security Review Required

This issue was automatically created because PR #{PR_NUMBER} requires security review.

**PR:** {PR_URL}
**PR Title:** {PR_TITLE}

## Security Concerns
{DETAILS}

## Next Steps
- [ ] Conduct security code review
- [ ] Perform vulnerability assessment
- [ ] Update security documentation if needed
- [ ] Approve or request changes on the PR

**Priority:** High
**Type:** Security Review`,
            labels: ['security', 'review-required', 'high-priority'],
            assignees: [] // Would be configured based on team
        });
        this.issueTemplates.set('performance-regression', {
            type: 'performance-regression',
            title: 'Performance Review Required for PR #{PR_NUMBER}',
            body: `# Performance Review Required

This issue was automatically created because PR #{PR_NUMBER} may impact performance.

**PR:** {PR_URL}
**PR Title:** {PR_TITLE}

## Performance Concerns
{DETAILS}

## Next Steps
- [ ] Conduct performance analysis
- [ ] Run performance benchmarks
- [ ] Identify potential optimizations
- [ ] Approve or request changes on the PR

**Priority:** Medium
**Type:** Performance Review`,
            labels: ['performance', 'review-required'],
            assignees: []
        });
        this.issueTemplates.set('documentation-missing', {
            type: 'documentation-missing',
            title: 'Documentation Update Required for PR #{PR_NUMBER}',
            body: `# Documentation Update Required

This issue was automatically created because PR #{PR_NUMBER} requires documentation updates.

**PR:** {PR_URL}
**PR Title:** {PR_TITLE}

## Documentation Needed
{DETAILS}

## Next Steps
- [ ] Update relevant documentation
- [ ] Add code comments if needed
- [ ] Update API documentation
- [ ] Update README if applicable

**Priority:** Low
**Type:** Documentation`,
            labels: ['documentation', 'good-first-issue'],
            assignees: []
        });
        this.issueTemplates.set('test-coverage', {
            type: 'test-coverage',
            title: 'Test Coverage Required for PR #{PR_NUMBER}',
            body: `# Test Coverage Required

This issue was automatically created because PR #{PR_NUMBER} needs additional test coverage.

**PR:** {PR_URL}
**PR Title:** {PR_TITLE}

## Testing Needed
{DETAILS}

## Next Steps
- [ ] Add unit tests for new functionality
- [ ] Add integration tests if needed
- [ ] Ensure edge cases are covered
- [ ] Verify test coverage meets requirements

**Priority:** Medium
**Type:** Testing`,
            labels: ['testing', 'good-first-issue'],
            assignees: []
        });
    }
    // Event handlers for different issue actions
    async processIssueUpdate(issue, repository) {
        // Handle issue updates
        const issueKey = `${repository.full_name}#${issue.number}`;
        const context = this.issueContexts.get(issueKey);
        if (context) {
            // Re-analyze if significant changes
            context.analysis = await this.analyzeIssue(issue, repository);
            context.timestamp = new Date();
        }
    }
    async handleIssueAssignment(issue, repository, assignee) {
        const issueKey = `${repository.full_name}#${issue.number}`;
        const context = this.issueContexts.get(issueKey);
        if (context) {
            context.status = 'assigned';
            // Send notification to assignee if configured
            this.logger.info('Issue assigned', {
                issue: issueKey,
                assignee: assignee.login
            });
        }
    }
    async handleIssueLabelUpdate(issue, repository, label) {
        // Handle label changes - might trigger different workflows
        if (label.name === 'needs-info') {
            // Issue needs more information
        }
        else if (label.name === 'ready-for-development') {
            // Issue is ready to be worked on
        }
    }
    async handleIssueClosure(issue, repository) {
        const issueKey = `${repository.full_name}#${issue.number}`;
        const context = this.issueContexts.get(issueKey);
        if (context) {
            context.status = 'closed';
            // Clean up resources
            this.issueContexts.delete(issueKey);
            this.logger.info('Issue closed', { issue: issueKey });
        }
    }
    async handleIssueReopened(issue, repository) {
        // Re-process the issue when reopened
        await this.processNewIssue(issue, repository);
    }
    /**
     * Get issue context
     */
    getIssueContext(repository, issueNumber) {
        return this.issueContexts.get(`${repository}#${issueNumber}`);
    }
    /**
     * Get all active issues
     */
    getActiveIssues() {
        return Array.from(this.issueContexts.values())
            .filter(context => context.status !== 'closed');
    }
    /**
     * Generate issue metrics
     */
    generateIssueMetrics() {
        const contexts = Array.from(this.issueContexts.values());
        return {
            total: contexts.length,
            byStatus: this.groupByStatus(contexts),
            byType: this.groupByType(contexts),
            byPriority: this.groupByPriority(contexts),
            averageResolutionTime: this.calculateAverageResolutionTime(contexts),
            autoGeneratedCount: contexts.filter(c => c.analysis.canAutoGenerate).length
        };
    }
    groupByStatus(contexts) {
        return contexts.reduce((acc, context) => {
            acc[context.status] = (acc[context.status] || 0) + 1;
            return acc;
        }, {});
    }
    groupByType(contexts) {
        return contexts.reduce((acc, context) => {
            acc[context.analysis.type] = (acc[context.analysis.type] || 0) + 1;
            return acc;
        }, {});
    }
    groupByPriority(contexts) {
        return contexts.reduce((acc, context) => {
            acc[context.analysis.priority] = (acc[context.analysis.priority] || 0) + 1;
            return acc;
        }, {});
    }
    calculateAverageResolutionTime(contexts) {
        const resolved = contexts.filter(c => c.status === 'resolved' || c.status === 'closed');
        if (resolved.length === 0)
            return 0;
        const totalTime = resolved.reduce((sum, context) => {
            const createdAt = new Date(context.issue.created_at);
            const resolvedAt = context.issue.closed_at ? new Date(context.issue.closed_at) : new Date();
            return sum + (resolvedAt.getTime() - createdAt.getTime());
        }, 0);
        return totalTime / resolved.length / (1000 * 60 * 60 * 24); // Average days
    }
}
exports.GitHubIssueManager = GitHubIssueManager;
//# sourceMappingURL=github-issue-manager.js.map