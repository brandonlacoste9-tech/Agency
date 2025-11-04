// Enhanced GitHub CLI Integration Module
// Integrates custom-built GitHub CLI with the PR Manager system

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export class EnhancedGitHubCLI {
  constructor(options = {}) {
    this.customCliPath = options.customCliPath || 'C:\\Users\\north\\gh-cli\\bin\\gh.exe';
    this.fallbackToStandard = options.fallbackToStandard !== false;
    this.timeout = options.timeout || 30000;
    this.metrics = {
      operationsTotal: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageResponseTime: 0,
      lastOperation: null
    };
  }

  async initialize() {
    console.log('🔧 Initializing Enhanced GitHub CLI...');
    
    // Test custom CLI availability
    const customAvailable = await this.testCLI(this.customCliPath);
    const standardAvailable = this.fallbackToStandard ? await this.testCLI('gh') : false;
    
    if (customAvailable) {
      this.activeCLI = this.customCliPath;
      this.cliType = 'custom';
      console.log('✅ Using custom GitHub CLI build');
    } else if (standardAvailable) {
      this.activeCLI = 'gh';
      this.cliType = 'standard';
      console.log('⚠️  Falling back to standard GitHub CLI');
    } else {
      throw new Error('No GitHub CLI available');
    }

    // Test authentication
    await this.testAuthentication();
    console.log('🎯 Enhanced GitHub CLI initialized successfully');
    
    return {
      cliType: this.cliType,
      cliPath: this.activeCLI,
      authenticated: true
    };
  }

  async testCLI(cliPath) {
    try {
      const { stdout } = await execAsync(`"${cliPath}" version`, { timeout: 5000 });
      return stdout.includes('gh version');
    } catch {
      return false;
    }
  }

  async testAuthentication() {
    try {
      await this.executeCommand('auth status');
      return true;
    } catch (error) {
      throw new Error(`GitHub CLI authentication failed: ${error.message}`);
    }
  }

  async executeCommand(command, options = {}) {
    const startTime = Date.now();
    this.metrics.operationsTotal++;
    
    try {
      const fullCommand = `"${this.activeCLI}" ${command}`;
      const execOptions = {
        timeout: options.timeout || this.timeout,
        encoding: 'utf8',
        ...options.execOptions
      };

      const { stdout, stderr } = await execAsync(fullCommand, execOptions);
      
      const duration = Date.now() - startTime;
      this.updateMetrics(true, duration, command);
      
      if (options.parseJson && stdout.trim()) {
        try {
          return JSON.parse(stdout);
        } catch (parseError) {
          console.warn('Failed to parse JSON output:', parseError.message);
          return stdout;
        }
      }
      
      return stdout;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(false, duration, command);
      throw new Error(`CLI command failed: ${command} - ${error.message}`);
    }
  }

  updateMetrics(success, duration, command) {
    if (success) {
      this.metrics.successfulOperations++;
    } else {
      this.metrics.failedOperations++;
    }
    
    // Update average response time
    const totalOps = this.metrics.successfulOperations + this.metrics.failedOperations;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalOps - 1) + duration) / totalOps;
    
    this.metrics.lastOperation = {
      command,
      duration,
      success,
      timestamp: new Date().toISOString()
    };
  }

  // Advanced PR Operations
  async getAllPRs(repo, options = {}) {
    const state = options.state || 'open';
    const limit = options.limit || 100;
    
    const command = `pr list --repo ${repo} --state ${state} --limit ${limit} --json number,title,author,reviewDecision,mergeable,statusCheckRollup,labels,isDraft,createdAt,updatedAt`;
    
    return await this.executeCommand(command, { parseJson: true });
  }

  async getPRDetails(repo, prNumber) {
    const command = `pr view ${prNumber} --repo ${repo} --json number,title,body,author,reviewDecision,statusCheckRollup,mergeable,labels,isDraft,comments,reviews,checks`;
    
    return await this.executeCommand(command, { parseJson: true });
  }

  async mergePR(repo, prNumber, options = {}) {
    const mergeMethod = options.method || 'squash';
    const deleteBranch = options.deleteBranch !== false;
    
    let command = `pr merge ${prNumber} --repo ${repo} --${mergeMethod}`;
    if (deleteBranch) {
      command += ' --delete-branch';
    }
    
    return await this.executeCommand(command);
  }

  async reviewPR(repo, prNumber, action, body) {
    const command = `pr review ${prNumber} --repo ${repo} --${action} --body "${body.replace(/"/g, '\\"')}"`;
    
    return await this.executeCommand(command);
  }

  async createIssue(repo, title, body, options = {}) {
    let command = `issue create --repo ${repo} --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}"`;
    
    if (options.labels) {
      command += ` --label "${options.labels.join(',')}"`;
    }
    
    if (options.assignees) {
      command += ` --assignee "${options.assignees.join(',')}"`;
    }

    return await this.executeCommand(command, { parseJson: true });
  }

  async getRepositoryInfo(repo) {
    const command = `repo view ${repo} --json name,description,defaultBranchRef,visibility,stargazerCount,forkCount,openIssues,openPullRequests`;
    
    return await this.executeCommand(command, { parseJson: true });
  }

  // Batch Operations for Performance
  async batchAnalyzePRs(repo, prNumbers) {
    console.log(`🔍 Analyzing ${prNumbers.length} PRs in batch...`);
    
    const results = await Promise.allSettled(
      prNumbers.map(async (prNumber) => {
        try {
          const details = await this.getPRDetails(repo, prNumber);
          return {
            prNumber,
            success: true,
            data: details
          };
        } catch (error) {
          return {
            prNumber,
            success: false,
            error: error.message
          };
        }
      })
    );

    const successful = results.filter(r => r.value?.success).map(r => r.value);
    const failed = results.filter(r => !r.value?.success).map(r => r.value);

    console.log(`✅ Batch analysis complete: ${successful.length} successful, ${failed.length} failed`);
    
    return { successful, failed };
  }

  // Health and Monitoring
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.operationsTotal > 0 
        ? (this.metrics.successfulOperations / this.metrics.operationsTotal * 100).toFixed(2) + '%'
        : '0%',
      cliType: this.cliType,
      cliPath: this.activeCLI
    };
  }

  async healthCheck() {
    try {
      const start = Date.now();
      await this.testAuthentication();
      const authTime = Date.now() - start;

      const start2 = Date.now();
      const version = await this.executeCommand('version');
      const versionTime = Date.now() - start2;

      return {
        status: 'healthy',
        cliType: this.cliType,
        version: version.trim(),
        metrics: this.getMetrics(),
        responseTime: {
          auth: authTime,
          version: versionTime
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        cliType: this.cliType,
        metrics: this.getMetrics()
      };
    }
  }

  // Advanced Automation Features
  async getReadyToMergePRs(repo) {
    const prs = await this.getAllPRs(repo, { state: 'open' });
    
    return prs.filter(pr => 
      pr.reviewDecision === 'APPROVED' &&
      pr.mergeable === 'MERGEABLE' &&
      !pr.isDraft &&
      (pr.statusCheckRollup?.conclusion === 'SUCCESS' || 
       pr.statusCheckRollup?.conclusion === null)
    );
  }

  async getStaleReviews(repo, daysOld = 7) {
    const prs = await this.getAllPRs(repo, { state: 'open' });
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return prs.filter(pr => {
      const updatedAt = new Date(pr.updatedAt);
      return updatedAt < cutoffDate && 
             pr.reviewDecision === 'REVIEW_REQUIRED';
    });
  }

  async getDraftPRsForPromotion(repo, daysOld = 3) {
    const prs = await this.getAllPRs(repo, { state: 'open' });
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return prs.filter(pr => {
      const createdAt = new Date(pr.createdAt);
      return pr.isDraft && createdAt < cutoffDate;
    });
  }
}

// Export singleton instance for easy use
export const enhancedCLI = new EnhancedGitHubCLI();

// Utility functions
export async function initializeEnhancedCLI(options = {}) {
  return await enhancedCLI.initialize(options);
}

export async function getEnhancedCLIMetrics() {
  return enhancedCLI.getMetrics();
}

export async function performCLIHealthCheck() {
  return await enhancedCLI.healthCheck();
}
