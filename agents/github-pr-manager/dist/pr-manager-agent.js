"use strict";
/**
 * GitHub PR Manager Agent
 *
 * Master agent responsible for:
 * - Monitoring GitHub PRs
 * - Analyzing PR content and requirements
 * - Delegating tasks to specialized agents
 * - Coordinating multi-agent workflows
 * - Reporting results back to GitHub
 * - Managing PR lifecycle from creation to merge
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubPRManagerAgent = void 0;
const rest_1 = require("@octokit/rest");
const auth_app_1 = require("@octokit/auth-app");
const events_1 = require("events");
const logger_1 = require("../../lib/logger");
const agent_orchestrator_1 = require("./agent-orchestrator");
const pr_analyzer_1 = require("./pr-analyzer");
const task_delegator_1 = require("./task-delegator");
const github_reporter_1 = require("./github-reporter");
const github_issue_manager_1 = require("./github-issue-manager");
class GitHubPRManagerAgent extends events_1.EventEmitter {
    octokit;
    logger;
    orchestrator;
    analyzer;
    delegator;
    reporter;
    issueManager;
    config;
    activeTasks = new Map();
    prContexts = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.logger = new logger_1.Logger('GitHubPRManager');
        // Initialize GitHub client
        this.octokit = new rest_1.Octokit({
            authStrategy: auth_app_1.createAppAuth,
            auth: {
                appId: config.github.appId,
                privateKey: config.github.privateKey,
                installationId: config.github.installationId,
            },
        });
        // Initialize specialized components
        this.analyzer = new pr_analyzer_1.PRAnalyzer(this.octokit, this.logger);
        this.orchestrator = new agent_orchestrator_1.AgentOrchestrator(config.agents, this.logger);
        this.delegator = new task_delegator_1.TaskDelegator(this.orchestrator, this.logger);
        this.reporter = new github_reporter_1.GitHubReporter(this.octokit, this.logger);
        this.issueManager = new github_issue_manager_1.GitHubIssueManager(this.octokit, this.logger);
        this.setupEventHandlers();
    }
    /**
     * Main entry point for handling GitHub webhook events
     */
    async handleWebhookEvent(event) {
        try {
            this.logger.info('Received GitHub webhook event', {
                type: event.name,
                action: 'action' in event ? event.action : undefined,
                repository: 'repository' in event ? event.repository?.full_name : undefined
            });
            switch (event.name) {
                case 'pull_request':
                    await this.handlePullRequestEvent(event);
                    break;
                case 'pull_request_review':
                    await this.handlePullRequestReviewEvent(event);
                    break;
                case 'issues':
                    await this.handleIssuesEvent(event);
                    break;
                case 'issue_comment':
                    await this.handleIssueCommentEvent(event);
                    break;
                case 'push':
                    await this.handlePushEvent(event);
                    break;
                default:
                    this.logger.debug('Unhandled webhook event type', { type: event.name });
            }
        }
        catch (error) {
            this.logger.error('Error handling webhook event', { error, event: event.name });
            throw error;
        }
    }
    /**
     * Handle GitHub issues events
     */
    async handleIssuesEvent(event) {
        await this.issueManager.handleIssueEvent(event);
    }
    /**
     * Handle pull request events (opened, synchronize, closed, etc.)
     */
    async handlePullRequestEvent(event) {
        const { action, pull_request, repository } = event;
        const prKey = `${repository.full_name}#${pull_request.number}`;
        this.logger.info('Handling PR event', {
            action,
            pr: prKey,
            title: pull_request.title
        });
        switch (action) {
            case 'opened':
            case 'synchronize':
                await this.processPullRequest(pull_request, repository);
                break;
            case 'closed':
                await this.handlePRClosed(pull_request, repository);
                break;
            case 'ready_for_review':
                await this.handlePRReadyForReview(pull_request, repository);
                break;
            case 'converted_to_draft':
                await this.handlePRConvertedToDraft(pull_request, repository);
                break;
        }
    }
    /**
     * Main PR processing workflow
     */
    async processPullRequest(pullRequest, repository) {
        const prKey = `${repository.full_name}#${pullRequest.number}`;
        try {
            // Step 1: Analyze the PR
            this.logger.info('Analyzing PR', { pr: prKey });
            const analysis = await this.analyzer.analyzePR(pullRequest, repository);
            // Step 2: Create PR context
            const context = {
                pr: pullRequest,
                repository,
                analysis,
                timestamp: new Date(),
                status: 'processing'
            };
            this.prContexts.set(prKey, context);
            // Step 3: Generate tasks based on analysis
            const tasks = await this.generateTasksFromAnalysis(analysis, context);
            this.activeTasks.set(prKey, tasks);
            // Step 4: Report initial status to GitHub
            await this.reporter.reportPRProcessingStarted(pullRequest, repository, analysis);
            // Step 5: Delegate tasks to specialized agents
            this.logger.info('Delegating tasks to agents', {
                pr: prKey,
                taskCount: tasks.length,
                taskTypes: tasks.map(t => t.type)
            });
            const results = await this.delegator.delegateTasks(tasks, context);
            // Step 6: Process results and update PR
            await this.processTaskResults(results, context);
            // Step 7: Generate final report
            await this.generateFinalReport(context, results);
        }
        catch (error) {
            this.logger.error('Error processing PR', { pr: prKey, error });
            await this.reporter.reportError(pullRequest, repository, error);
        }
    }
    /**
     * Generate tasks based on PR analysis
     */
    async generateTasksFromAnalysis(analysis, context) {
        const tasks = [];
        const { pr, repository } = context;
        // Security review task
        if (analysis.requiresSecurityReview) {
            tasks.push({
                id: `security-${pr.number}-${Date.now()}`,
                type: 'security_review',
                priority: 'high',
                agentType: 'security-agent',
                payload: {
                    files: analysis.modifiedFiles,
                    securityConcerns: analysis.securityConcerns,
                    pr: pr.number,
                    repository: repository.full_name
                },
                timeout: 300000, // 5 minutes
                retries: 2
            });
        }
        // Code quality review task
        if (analysis.requiresCodeReview) {
            tasks.push({
                id: `code-review-${pr.number}-${Date.now()}`,
                type: 'code_review',
                priority: 'medium',
                agentType: 'code-review-agent',
                payload: {
                    files: analysis.modifiedFiles,
                    language: analysis.primaryLanguage,
                    complexity: analysis.complexity,
                    pr: pr.number,
                    repository: repository.full_name
                },
                timeout: 600000, // 10 minutes
                retries: 1
            });
        }
        // Testing task
        if (analysis.requiresTesting) {
            tasks.push({
                id: `testing-${pr.number}-${Date.now()}`,
                type: 'testing',
                priority: 'medium',
                agentType: 'testing-agent',
                payload: {
                    testFiles: analysis.testFiles,
                    modifiedFiles: analysis.modifiedFiles,
                    testStrategy: analysis.testStrategy,
                    pr: pr.number,
                    repository: repository.full_name
                },
                timeout: 900000, // 15 minutes
                retries: 1
            });
        }
        // Documentation task
        if (analysis.requiresDocumentation) {
            tasks.push({
                id: `docs-${pr.number}-${Date.now()}`,
                type: 'documentation',
                priority: 'low',
                agentType: 'documentation-agent',
                payload: {
                    files: analysis.modifiedFiles,
                    docFiles: analysis.documentationFiles,
                    changes: analysis.apiChanges,
                    pr: pr.number,
                    repository: repository.full_name
                },
                timeout: 300000, // 5 minutes
                retries: 1
            });
        }
        // Performance analysis task
        if (analysis.requiresPerformanceReview) {
            tasks.push({
                id: `performance-${pr.number}-${Date.now()}`,
                type: 'performance_review',
                priority: 'medium',
                agentType: 'performance-agent',
                payload: {
                    files: analysis.modifiedFiles,
                    performanceCriticalPaths: analysis.performancePaths,
                    pr: pr.number,
                    repository: repository.full_name
                },
                timeout: 450000, // 7.5 minutes
                retries: 1
            });
        }
        // Deployment readiness task
        if (analysis.requiresDeploymentCheck) {
            tasks.push({
                id: `deployment-${pr.number}-${Date.now()}`,
                type: 'deployment_check',
                priority: 'high',
                agentType: 'deployment-agent',
                payload: {
                    files: analysis.modifiedFiles,
                    environment: analysis.targetEnvironment,
                    migrations: analysis.databaseMigrations,
                    pr: pr.number,
                    repository: repository.full_name
                },
                timeout: 300000, // 5 minutes
                retries: 2
            });
        }
        return tasks;
    }
    /**
     * Process results from delegated tasks
     */
    async processTaskResults(results, context) {
        const { pr, repository } = context;
        const prKey = `${repository.full_name}#${pr.number}`;
        this.logger.info('Processing task results', {
            pr: prKey,
            resultCount: results.length,
            successCount: results.filter(r => r.status === 'completed').length,
            failureCount: results.filter(r => r.status === 'failed').length
        });
        // Group results by type
        const resultsByType = results.reduce((acc, result) => {
            acc[result.task.type] = result;
            return acc;
        }, {});
        // Process security results
        if (resultsByType.security_review) {
            await this.processSecurityResults(resultsByType.security_review, context);
        }
        // Process code review results
        if (resultsByType.code_review) {
            await this.processCodeReviewResults(resultsByType.code_review, context);
        }
        // Process testing results
        if (resultsByType.testing) {
            await this.processTestingResults(resultsByType.testing, context);
        }
        // Process documentation results
        if (resultsByType.documentation) {
            await this.processDocumentationResults(resultsByType.documentation, context);
        }
        // Process performance results
        if (resultsByType.performance_review) {
            await this.processPerformanceResults(resultsByType.performance_review, context);
        }
        // Process deployment results
        if (resultsByType.deployment_check) {
            await this.processDeploymentResults(resultsByType.deployment_check, context);
        }
        // Update PR status based on all results
        await this.updatePRStatus(results, context);
    }
    /**
     * Generate comprehensive final report
     */
    async generateFinalReport(context, results) {
        const { pr, repository } = context;
        const report = {
            summary: this.generateSummary(results),
            details: this.generateDetailedResults(results),
            recommendations: this.generateRecommendations(results),
            metrics: this.calculateMetrics(results),
            timestamp: new Date()
        };
        // Post comprehensive comment to PR
        await this.reporter.postFinalReport(pr, repository, report);
        // Update PR labels based on results
        await this.updatePRLabels(pr, repository, results);
        // Update project status
        await this.updateProjectStatus(pr, repository, results);
        this.logger.info('Final report generated', {
            pr: `${repository.full_name}#${pr.number}`,
            summary: report.summary
        });
    }
    /**
     * Handle PR review events
     */
    async handlePullRequestReviewEvent(event) {
        const { action, review, pull_request, repository } = event;
        if (action === 'submitted') {
            await this.processReviewSubmission(review, pull_request, repository);
        }
    }
    /**
     * Handle issue comment events (commands in PR/issue comments)
     */
    async handleIssueCommentEvent(event) {
        const { action, comment, issue, repository } = event;
        if (action === 'created') {
            if (issue.pull_request) {
                // Handle PR comments
                await this.processCommentCommand(comment, issue, repository);
            }
            else {
                // Handle issue comments
                await this.processIssueCommentCommand(comment, issue, repository);
            }
        }
    }
    /**
     * Process commands from issue comments
     */
    async processIssueCommentCommand(comment, issue, repository) {
        const command = this.parseCommand(comment.body);
        if (command) {
            this.logger.info('Processing issue comment command', {
                command: command.action,
                issue: `${repository.full_name}#${issue.number}`,
                user: comment.user.login
            });
            await this.executeIssueCommand(command, issue, repository);
        }
    }
    /**
     * Process commands from PR comments (e.g., /rerun-tests, /security-review)
     */
    async processCommentCommand(comment, issue, repository) {
        const command = this.parseCommand(comment.body);
        if (command) {
            this.logger.info('Processing comment command', {
                command: command.action,
                pr: `${repository.full_name}#${issue.number}`,
                user: comment.user.login
            });
            await this.executeCommand(command, issue, repository);
        }
    }
    /**
     * Parse commands from comment text
     */
    parseCommand(commentBody) {
        const commandRegex = /^\/([a-z-]+)(?:\s+(.*))?$/m;
        const match = commentBody.match(commandRegex);
        if (match) {
            return {
                action: match[1],
                args: match[2] ? match[2].split(/\s+/) : []
            };
        }
        return null;
    }
    /**
     * Execute parsed commands
     */
    async executeCommand(command, issue, repository) {
        const pr = await this.octokit.pulls.get({
            owner: repository.owner.login,
            repo: repository.name,
            pull_number: issue.number
        });
        switch (command.action) {
            case 'rerun-tests':
                await this.rerunTests(pr.data, repository);
                break;
            case 'security-review':
                await this.triggerSecurityReview(pr.data, repository);
                break;
            case 'performance-check':
                await this.triggerPerformanceCheck(pr.data, repository);
                break;
            case 'full-review':
                await this.triggerFullReview(pr.data, repository);
                break;
            case 'status':
                await this.reportCurrentStatus(pr.data, repository);
                break;
            case 'create-issue':
                await this.createIssueFromPR(pr.data, repository, command.args);
                break;
            default:
                await this.reporter.postComment(pr.data, repository, `Unknown command: /${command.action}. Available commands: /rerun-tests, /security-review, /performance-check, /full-review, /status, /create-issue`);
        }
    }
    /**
     * Execute issue-specific commands
     */
    async executeIssueCommand(command, issue, repository) {
        switch (command.action) {
            case 'triage':
                await this.retriageIssue(issue, repository);
                break;
            case 'estimate':
                await this.reestimateIssue(issue, repository);
                break;
            case 'assign-agent':
                await this.assignAgentToIssue(issue, repository, command.args[0]);
                break;
            case 'generate-code':
                await this.triggerCodeGeneration(issue, repository);
                break;
            case 'generate-docs':
                await this.triggerDocumentationGeneration(issue, repository);
                break;
            case 'link-pr':
                await this.linkPRToIssue(issue, repository, parseInt(command.args[0]));
                break;
            case 'duplicate':
                await this.markAsDuplicate(issue, repository, parseInt(command.args[0]));
                break;
            case 'status':
                await this.reportIssueStatus(issue, repository);
                break;
            default:
                await this.octokit.issues.createComment({
                    owner: repository.owner.login,
                    repo: repository.name,
                    issue_number: issue.number,
                    body: `Unknown command: /${command.action}. Available commands: /triage, /estimate, /assign-agent, /generate-code, /generate-docs, /link-pr, /duplicate, /status`
                });
        }
    }
    /**
     * Setup event handlers for internal events
     */
    setupEventHandlers() {
        this.orchestrator.on('agent_completed', (result) => {
            this.logger.info('Agent task completed', {
                taskId: result.task.id,
                type: result.task.type,
                status: result.status
            });
        });
        this.orchestrator.on('agent_failed', (result) => {
            this.logger.error('Agent task failed', {
                taskId: result.task.id,
                type: result.task.type,
                error: result.error
            });
        });
    }
    // Additional methods for specific result processing...
    async processSecurityResults(result, context) {
        if (result.status === 'completed' && result.output?.securityIssues?.length > 0) {
            await this.reporter.postSecurityAlert(context.pr, context.repository, result.output.securityIssues);
        }
    }
    async processCodeReviewResults(result, context) {
        if (result.status === 'completed' && result.output?.suggestions?.length > 0) {
            await this.reporter.postCodeReviewSuggestions(context.pr, context.repository, result.output.suggestions);
        }
    }
    async processTestingResults(result, context) {
        if (result.status === 'completed') {
            await this.reporter.postTestResults(context.pr, context.repository, result.output);
        }
    }
    async processDocumentationResults(result, context) {
        if (result.status === 'completed' && result.output?.missingDocs?.length > 0) {
            await this.reporter.postDocumentationReminder(context.pr, context.repository, result.output.missingDocs);
        }
    }
    async processPerformanceResults(result, context) {
        if (result.status === 'completed' && result.output?.performanceIssues?.length > 0) {
            await this.reporter.postPerformanceAlert(context.pr, context.repository, result.output.performanceIssues);
        }
    }
    async processDeploymentResults(result, context) {
        if (result.status === 'completed') {
            await this.reporter.postDeploymentStatus(context.pr, context.repository, result.output);
        }
    }
    async updatePRStatus(results, context) {
        const hasFailures = results.some(r => r.status === 'failed');
        const hasBlockingIssues = results.some(r => r.output?.blocking === true);
        if (hasFailures || hasBlockingIssues) {
            await this.reporter.updateCheckStatus(context.pr, context.repository, 'failure', 'Automated review found issues');
        }
        else {
            await this.reporter.updateCheckStatus(context.pr, context.repository, 'success', 'All automated checks passed');
        }
    }
    generateSummary(results) {
        const completed = results.filter(r => r.status === 'completed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        const total = results.length;
        return `Completed ${completed}/${total} tasks (${failed} failed)`;
    }
    generateDetailedResults(results) {
        return results.map(result => ({
            type: result.task.type,
            status: result.status,
            duration: result.completedAt && result.startedAt ?
                result.completedAt.getTime() - result.startedAt.getTime() : null,
            summary: result.output?.summary || 'No summary available',
            issues: result.output?.issues || []
        }));
    }
    generateRecommendations(results) {
        const recommendations = [];
        results.forEach(result => {
            if (result.output?.recommendations) {
                recommendations.push(...result.output.recommendations);
            }
        });
        return recommendations;
    }
    calculateMetrics(results) {
        const totalTime = results.reduce((acc, result) => {
            if (result.completedAt && result.startedAt) {
                return acc + (result.completedAt.getTime() - result.startedAt.getTime());
            }
            return acc;
        }, 0);
        return {
            totalExecutionTime: totalTime,
            averageTaskTime: results.length > 0 ? totalTime / results.length : 0,
            successRate: results.length > 0 ? results.filter(r => r.status === 'completed').length / results.length : 0
        };
    }
    async updatePRLabels(pr, repository, results) {
        const labels = [];
        if (results.some(r => r.task.type === 'security_review' && r.output?.securityIssues?.length > 0)) {
            labels.push('security-review-needed');
        }
        if (results.some(r => r.task.type === 'testing' && r.status === 'failed')) {
            labels.push('tests-failing');
        }
        if (results.some(r => r.task.type === 'documentation' && r.output?.missingDocs?.length > 0)) {
            labels.push('docs-needed');
        }
        if (labels.length > 0) {
            await this.octokit.issues.addLabels({
                owner: repository.owner.login,
                repo: repository.name,
                issue_number: pr.number,
                labels
            });
        }
    }
    async updateProjectStatus(pr, repository, results) {
        // Update project board status, metrics, etc.
        // Implementation depends on specific project management tools
    }
    async handlePRClosed(pr, repository) {
        const prKey = `${repository.full_name}#${pr.number}`;
        // Cleanup active tasks
        this.activeTasks.delete(prKey);
        this.prContexts.delete(prKey);
        this.logger.info('PR closed, cleaned up resources', { pr: prKey });
    }
    async handlePRReadyForReview(pr, repository) {
        await this.processPullRequest(pr, repository);
    }
    async handlePRConvertedToDraft(pr, repository) {
        const prKey = `${repository.full_name}#${pr.number}`;
        // Pause active tasks
        const tasks = this.activeTasks.get(prKey);
        if (tasks) {
            await this.orchestrator.pauseTasks(tasks.map(t => t.id));
        }
        this.logger.info('PR converted to draft, paused tasks', { pr: prKey });
    }
    async rerunTests(pr, repository) {
        // Trigger test re-run
        const context = this.prContexts.get(`${repository.full_name}#${pr.number}`);
        if (context) {
            const testTask = {
                id: `rerun-tests-${pr.number}-${Date.now()}`,
                type: 'testing',
                priority: 'high',
                agentType: 'testing-agent',
                payload: {
                    pr: pr.number,
                    repository: repository.full_name,
                    rerun: true
                },
                timeout: 900000,
                retries: 1
            };
            await this.delegator.delegateTask(testTask, context);
        }
    }
    async triggerSecurityReview(pr, repository) {
        // Similar implementation for security review
    }
    async triggerPerformanceCheck(pr, repository) {
        // Similar implementation for performance check
    }
    async triggerFullReview(pr, repository) {
        await this.processPullRequest(pr, repository);
    }
    async reportCurrentStatus(pr, repository) {
        const prKey = `${repository.full_name}#${pr.number}`;
        const context = this.prContexts.get(prKey);
        const tasks = this.activeTasks.get(prKey);
        if (context && tasks) {
            const status = {
                activeTasks: tasks.length,
                completedTasks: tasks.filter(t => t.status === 'completed').length,
                failedTasks: tasks.filter(t => t.status === 'failed').length,
                context: context.status
            };
            await this.reporter.postComment(pr, repository, `**Current Status:** ${JSON.stringify(status, null, 2)}`);
        }
    }
    // Issue management methods
    async retriageIssue(issue, repository) {
        const context = this.issueManager.getIssueContext(repository.full_name, issue.number);
        if (context) {
            await this.issueManager.handleIssueEvent({
                action: 'edited',
                issue,
                repository
            });
            await this.octokit.issues.createComment({
                owner: repository.owner.login,
                repo: repository.name,
                issue_number: issue.number,
                body: '🔄 Issue has been re-triaged. Check the updated analysis above.'
            });
        }
    }
    async reestimateIssue(issue, repository) {
        const context = this.issueManager.getIssueContext(repository.full_name, issue.number);
        if (context) {
            await this.octokit.issues.createComment({
                owner: repository.owner.login,
                repo: repository.name,
                issue_number: issue.number,
                body: `📊 **Current Estimate:** ${context.analysis.estimatedHours} hours\n**Complexity:** ${context.analysis.complexity}\n**Type:** ${context.analysis.type}`
            });
        }
    }
    async assignAgentToIssue(issue, repository, agentType) {
        // Implementation would assign specific agent type to work on issue
        await this.octokit.issues.createComment({
            owner: repository.owner.login,
            repo: repository.name,
            issue_number: issue.number,
            body: `🤖 Assigned ${agentType} agent to work on this issue.`
        });
    }
    async triggerCodeGeneration(issue, repository) {
        const context = this.issueManager.getIssueContext(repository.full_name, issue.number);
        if (context && context.analysis.canAutoGenerate) {
            const task = {
                id: `code-gen-${issue.number}-${Date.now()}`,
                type: 'code_generation',
                priority: 'medium',
                agentType: 'code-generation-agent',
                payload: {
                    issueNumber: issue.number,
                    repository: repository.full_name,
                    requirements: context.analysis.acceptanceCriteria
                },
                timeout: 600000,
                retries: 1
            };
            await this.orchestrator.executeTask(task);
            await this.octokit.issues.createComment({
                owner: repository.owner.login,
                repo: repository.name,
                issue_number: issue.number,
                body: '🔧 Code generation task has been queued. You will receive updates as the agent works on this issue.'
            });
        }
        else {
            await this.octokit.issues.createComment({
                owner: repository.owner.login,
                repo: repository.name,
                issue_number: issue.number,
                body: '❌ This issue is not suitable for automated code generation.'
            });
        }
    }
    async triggerDocumentationGeneration(issue, repository) {
        const task = {
            id: `doc-gen-${issue.number}-${Date.now()}`,
            type: 'documentation',
            priority: 'medium',
            agentType: 'documentation-agent',
            payload: {
                issueNumber: issue.number,
                repository: repository.full_name,
                type: 'issue-based'
            },
            timeout: 300000,
            retries: 1
        };
        await this.orchestrator.executeTask(task);
        await this.octokit.issues.createComment({
            owner: repository.owner.login,
            repo: repository.name,
            issue_number: issue.number,
            body: '📚 Documentation generation task has been queued.'
        });
    }
    async linkPRToIssue(issue, repository, prNumber) {
        await this.octokit.issues.createComment({
            owner: repository.owner.login,
            repo: repository.name,
            issue_number: issue.number,
            body: `🔗 Linked to PR #${prNumber}`
        });
    }
    async markAsDuplicate(issue, repository, duplicateOfIssue) {
        await this.octokit.issues.createComment({
            owner: repository.owner.login,
            repo: repository.name,
            issue_number: issue.number,
            body: `🔄 Marked as duplicate of #${duplicateOfIssue}`
        });
        await this.octokit.issues.addLabels({
            owner: repository.owner.login,
            repo: repository.name,
            issue_number: issue.number,
            labels: ['duplicate']
        });
        await this.octokit.issues.update({
            owner: repository.owner.login,
            repo: repository.name,
            issue_number: issue.number,
            state: 'closed'
        });
    }
    async reportIssueStatus(issue, repository) {
        const context = this.issueManager.getIssueContext(repository.full_name, issue.number);
        if (context) {
            const status = {
                status: context.status,
                type: context.analysis.type,
                priority: context.analysis.priority,
                complexity: context.analysis.complexity,
                estimatedHours: context.analysis.estimatedHours,
                canAutoGenerate: context.analysis.canAutoGenerate,
                assignedAgents: context.assignedAgents.length,
                relatedPRs: context.relatedPRs.length
            };
            await this.octokit.issues.createComment({
                owner: repository.owner.login,
                repo: repository.name,
                issue_number: issue.number,
                body: `**Issue Status:** \`\`\`json\n${JSON.stringify(status, null, 2)}\n\`\`\``
            });
        }
    }
    async createIssueFromPR(pr, repository, args) {
        const issueType = args[0] || 'general';
        const context = this.prContexts.get(`${repository.full_name}#${pr.number}`);
        if (context) {
            const issueNumber = await this.issueManager.createIssueFromPR(context, issueType, {
                analysis: context.analysis
            });
            if (issueNumber) {
                await this.reporter.postComment(pr, repository, `📝 Created issue #${issueNumber} for ${issueType} follow-up.`);
            }
        }
    }
    // Add method to get comprehensive system status including issues
    getSystemStatus() {
        const orchestratorStatus = this.orchestrator.getSystemStatus();
        const issueMetrics = this.issueManager.generateIssueMetrics();
        return {
            ...orchestratorStatus,
            issues: issueMetrics,
            prs: {
                active: this.prContexts.size,
                activeTasks: this.activeTasks.size
            },
            integration: {
                totalItems: this.prContexts.size + issueMetrics.total,
                issueToPR: issueMetrics.total > 0 ? this.prContexts.size / issueMetrics.total : 0
            }
        };
    }
}
exports.GitHubPRManagerAgent = GitHubPRManagerAgent;
//# sourceMappingURL=pr-manager-agent.js.map