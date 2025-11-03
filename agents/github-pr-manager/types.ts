/**
 * Type definitions for GitHub PR Manager Agent System
 */

export interface AgentTask {
  id: string;
  type: 'security_review' | 'code_review' | 'testing' | 'documentation' | 'performance' | 'deployment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  prNumber: number;
  repository: string;
  assignedAgent?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  payload: any;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime?: number;
  startTime?: Date;
  endTime?: Date;
}

export interface TaskResult {
  taskId: string;
  agentId: string;
  status: 'success' | 'failure' | 'partial';
  result: any;
  feedback?: string;
  suggestions?: string[];
  issues?: string[];
  metrics?: {
    executionTime: number;
    linesReviewed?: number;
    issuesFound?: number;
  };
}

export interface PRContext {
  number: number;
  title: string;
  body: string;
  author: string;
  branch: string;
  baseBranch: string;
  repository: string;
  modifiedFiles: string[];
  addedLines: number;
  deletedLines: number;
  state: 'open' | 'closed' | 'merged';
  isDraft: boolean;
  labels: string[];
}

export interface IssueContext {
  number: number;
  title: string;
  body: string;
  author: string;
  repository: string;
  labels: string[];
  state: 'open' | 'closed';
  assignees: string[];
}

export interface PRAnalysis {
  id: string;
  prNumber: number;
  repository: string;
  modifiedFiles: string[];
  addedLines: number;
  deletedLines: number;
  primaryLanguage: string;
  languages: string[];
  complexity: 'low' | 'medium' | 'high';
  requiresSecurityReview: boolean;
  requiresCodeReview: boolean;
  requiresTesting: boolean;
  requiresDocumentation: boolean;
  requiresPerformanceReview: boolean;
  requiresDeploymentCheck: boolean;
  securityConcerns: string[];
  testFiles: string[];
  documentationFiles: string[];
  apiChanges: boolean;
  databaseMigrations: boolean;
  performancePaths: string[];
  targetEnvironment: string;
  testStrategy: 'unit' | 'integration' | 'e2e' | 'all';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedReviewTime: number;
}

export interface AgentCapability {
  name: string;
  description: string;
  supportedLanguages?: string[];
  estimatedTimePerTask?: number;
  maxConcurrentTasks?: number;
}

export interface Agent {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  capabilities: AgentCapability[];
  status: 'online' | 'offline' | 'busy';
  currentTasks: number;
  maxTasks: number;
  healthCheck?: {
    lastCheck: Date;
    status: 'healthy' | 'unhealthy';
    responseTime?: number;
  };
}