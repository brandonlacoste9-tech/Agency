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
import { WebhookEvent } from '@octokit/webhooks-types';
import { EventEmitter } from 'events';
import { AgentConfig } from './types';
export declare class GitHubPRManagerAgent extends EventEmitter {
    private octokit;
    private logger;
    private orchestrator;
    private analyzer;
    private delegator;
    private reporter;
    private issueManager;
    private config;
    private activeTasks;
    private prContexts;
    constructor(config: AgentConfig);
    /**
     * Main entry point for handling GitHub webhook events
     */
    handleWebhookEvent(event: WebhookEvent): Promise<void>;
    /**
     * Handle GitHub issues events
     */
    private handleIssuesEvent;
    /**
     * Handle pull request events (opened, synchronize, closed, etc.)
     */
    private handlePullRequestEvent;
    /**
     * Main PR processing workflow
     */
    private processPullRequest;
    /**
     * Generate tasks based on PR analysis
     */
    private generateTasksFromAnalysis;
    /**
     * Process results from delegated tasks
     */
    private processTaskResults;
    /**
     * Generate comprehensive final report
     */
    private generateFinalReport;
    /**
     * Handle PR review events
     */
    private handlePullRequestReviewEvent;
    /**
     * Handle issue comment events (commands in PR/issue comments)
     */
    private handleIssueCommentEvent;
    /**
     * Process commands from issue comments
     */
    private processIssueCommentCommand;
    /**
     * Process commands from PR comments (e.g., /rerun-tests, /security-review)
     */
    private processCommentCommand;
    /**
     * Parse commands from comment text
     */
    private parseCommand;
    /**
     * Execute parsed commands
     */
    private executeCommand;
    /**
     * Execute issue-specific commands
     */
    private executeIssueCommand;
    /**
     * Setup event handlers for internal events
     */
    private setupEventHandlers;
    private processSecurityResults;
    private processCodeReviewResults;
    private processTestingResults;
    private processDocumentationResults;
    private processPerformanceResults;
    private processDeploymentResults;
    private updatePRStatus;
    private generateSummary;
    private generateDetailedResults;
    private generateRecommendations;
    private calculateMetrics;
    private updatePRLabels;
    private updateProjectStatus;
    private handlePRClosed;
    private handlePRReadyForReview;
    private handlePRConvertedToDraft;
    private rerunTests;
    private triggerSecurityReview;
    private triggerPerformanceCheck;
    private triggerFullReview;
    private reportCurrentStatus;
    private retriageIssue;
    private reestimateIssue;
    private assignAgentToIssue;
    private triggerCodeGeneration;
    private triggerDocumentationGeneration;
    private linkPRToIssue;
    private markAsDuplicate;
    private reportIssueStatus;
    private createIssueFromPR;
    getSystemStatus(): any;
}
//# sourceMappingURL=pr-manager-agent.d.ts.map