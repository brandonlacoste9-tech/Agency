/**
 * GitHub Issue Manager
 *
 * Handles GitHub issues creation, management, and coordination with PRs
 */
import { Octokit } from '@octokit/rest';
import { Logger } from '../../lib/logger';
import { PRContext } from './types';
export interface IssueContext {
    issue: any;
    repository: any;
    analysis: IssueAnalysis;
    timestamp: Date;
    status: 'new' | 'triaged' | 'assigned' | 'in-progress' | 'blocked' | 'resolved' | 'closed';
    relatedPRs: number[];
    assignedAgents: string[];
}
export interface IssueAnalysis {
    id: string;
    issueNumber: number;
    repository: string;
    type: 'bug' | 'feature' | 'enhancement' | 'documentation' | 'question' | 'security' | 'performance' | 'maintenance';
    priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
    complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'very-complex';
    estimatedHours: number;
    labels: string[];
    assignees: string[];
    milestone?: string;
    requiredSkills: string[];
    dependencies: number[];
    blockers: number[];
    relatedIssues: number[];
    suggestedApproach: string[];
    acceptanceCriteria: string[];
    riskFactors: string[];
    needsMoreInfo: boolean;
    canAutoGenerate: boolean;
    requiresHumanReview: boolean;
}
export interface IssueTemplate {
    type: string;
    title: string;
    body: string;
    labels: string[];
    assignees?: string[];
    milestone?: string;
}
export declare class GitHubIssueManager {
    private octokit;
    private logger;
    private issueContexts;
    private issueTemplates;
    constructor(octokit: Octokit, logger: Logger);
    /**
     * Handle GitHub issue webhook events
     */
    handleIssueEvent(event: any): Promise<void>;
    /**
     * Process a newly opened issue
     */
    private processNewIssue;
    /**
     * Analyze an issue to determine type, priority, and required actions
     */
    private analyzeIssue;
    /**
     * Determine issue type from text and labels
     */
    private determineIssueType;
    /**
     * Determine priority level
     */
    private determinePriority;
    /**
     * Assess complexity of the issue
     */
    private assessComplexity;
    /**
     * Estimate effort in hours
     */
    private estimateEffort;
    /**
     * Extract required skills from issue content
     */
    private extractRequiredSkills;
    /**
     * Generate acceptance criteria based on issue content
     */
    private generateAcceptanceCriteria;
    /**
     * Suggest approach for solving the issue
     */
    private suggestApproach;
    /**
     * Identify potential risk factors
     */
    private identifyRiskFactors;
    /**
     * Check if issue needs more information
     */
    private needsMoreInformation;
    /**
     * Check if code can be auto-generated
     */
    private canAutoGenerateCode;
    /**
     * Extract dependency issue numbers
     */
    private extractDependencies;
    /**
     * Auto-triage the issue based on analysis
     */
    private triageIssue;
    /**
     * Generate appropriate labels for the issue
     */
    private generateLabels;
    /**
     * Generate triage comment
     */
    private generateTriageComment;
    /**
     * Request more information from issue author
     */
    private requestMoreInformation;
    /**
     * Generate automated tasks for auto-generatable issues
     */
    private generateAutomatedTasks;
    /**
     * Check for duplicate issues
     */
    private checkForDuplicates;
    /**
     * Calculate text similarity (simple implementation)
     */
    private calculateSimilarity;
    /**
     * Link related issues and PRs
     */
    private linkRelatedItems;
    /**
     * Create issue from PR analysis
     */
    createIssueFromPR(prContext: PRContext, issueType: string, details: any): Promise<number | null>;
    /**
     * Initialize issue templates
     */
    private initializeIssueTemplates;
    private processIssueUpdate;
    private handleIssueAssignment;
    private handleIssueLabelUpdate;
    private handleIssueClosure;
    private handleIssueReopened;
    /**
     * Get issue context
     */
    getIssueContext(repository: string, issueNumber: number): IssueContext | undefined;
    /**
     * Get all active issues
     */
    getActiveIssues(): IssueContext[];
    /**
     * Generate issue metrics
     */
    generateIssueMetrics(): any;
    private groupByStatus;
    private groupByType;
    private groupByPriority;
    private calculateAverageResolutionTime;
}
//# sourceMappingURL=github-issue-manager.d.ts.map