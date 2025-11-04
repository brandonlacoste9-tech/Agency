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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubPRManagerAgent = void 0;
var rest_1 = require("@octokit/rest");
var auth_app_1 = require("@octokit/auth-app");
var events_1 = require("events");
var logger_1 = require("../../lib/logger");
var agent_orchestrator_1 = require("./agent-orchestrator");
var pr_analyzer_1 = require("./pr-analyzer");
var task_delegator_1 = require("./task-delegator");
var github_reporter_1 = require("./github-reporter");
var github_issue_manager_1 = require("./github-issue-manager");
var GitHubPRManagerAgent = /** @class */ (function (_super) {
    __extends(GitHubPRManagerAgent, _super);
    function GitHubPRManagerAgent(config) {
        var _this = _super.call(this) || this;
        _this.activeTasks = new Map();
        _this.prContexts = new Map();
        _this.config = config;
        _this.logger = new logger_1.Logger('GitHubPRManager');
        // Initialize GitHub client
        _this.octokit = new rest_1.Octokit({
            authStrategy: auth_app_1.createAppAuth,
            auth: {
                appId: config.github.appId,
                privateKey: config.github.privateKey,
                installationId: config.github.installationId,
            },
        });
        // Initialize specialized components
        _this.analyzer = new pr_analyzer_1.PRAnalyzer(_this.octokit, _this.logger);
        _this.orchestrator = new agent_orchestrator_1.AgentOrchestrator(config.agents, _this.logger);
        _this.delegator = new task_delegator_1.TaskDelegator(_this.orchestrator, _this.logger);
        _this.reporter = new github_reporter_1.GitHubReporter(_this.octokit, _this.logger);
        _this.issueManager = new github_issue_manager_1.GitHubIssueManager(_this.octokit, _this.logger);
        _this.setupEventHandlers();
        return _this;
    }
    /**
     * Main entry point for handling GitHub webhook events
     */
    GitHubPRManagerAgent.prototype.handleWebhookEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, error_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 13, , 14]);
                        this.logger.info('Received GitHub webhook event', {
                            type: event.name,
                            action: 'action' in event ? event.action : undefined,
                            repository: 'repository' in event ? (_b = event.repository) === null || _b === void 0 ? void 0 : _b.full_name : undefined
                        });
                        _a = event.name;
                        switch (_a) {
                            case 'pull_request': return [3 /*break*/, 1];
                            case 'pull_request_review': return [3 /*break*/, 3];
                            case 'issues': return [3 /*break*/, 5];
                            case 'issue_comment': return [3 /*break*/, 7];
                            case 'push': return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 11];
                    case 1: return [4 /*yield*/, this.handlePullRequestEvent(event)];
                    case 2:
                        _c.sent();
                        return [3 /*break*/, 12];
                    case 3: return [4 /*yield*/, this.handlePullRequestReviewEvent(event)];
                    case 4:
                        _c.sent();
                        return [3 /*break*/, 12];
                    case 5: return [4 /*yield*/, this.handleIssuesEvent(event)];
                    case 6:
                        _c.sent();
                        return [3 /*break*/, 12];
                    case 7: return [4 /*yield*/, this.handleIssueCommentEvent(event)];
                    case 8:
                        _c.sent();
                        return [3 /*break*/, 12];
                    case 9: return [4 /*yield*/, this.handlePushEvent(event)];
                    case 10:
                        _c.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        this.logger.debug('Unhandled webhook event type', { type: event.name });
                        _c.label = 12;
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        error_1 = _c.sent();
                        this.logger.error('Error handling webhook event', { error: error_1, event: event.name });
                        throw error_1;
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle GitHub issues events
     */
    GitHubPRManagerAgent.prototype.handleIssuesEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.issueManager.handleIssueEvent(event)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle pull request events (opened, synchronize, closed, etc.)
     */
    GitHubPRManagerAgent.prototype.handlePullRequestEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var action, pull_request, repository, prKey, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        action = event.action, pull_request = event.pull_request, repository = event.repository;
                        prKey = "".concat(repository.full_name, "#").concat(pull_request.number);
                        this.logger.info('Handling PR event', {
                            action: action,
                            pr: prKey,
                            title: pull_request.title
                        });
                        _a = action;
                        switch (_a) {
                            case 'opened': return [3 /*break*/, 1];
                            case 'synchronize': return [3 /*break*/, 1];
                            case 'closed': return [3 /*break*/, 3];
                            case 'ready_for_review': return [3 /*break*/, 5];
                            case 'converted_to_draft': return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 9];
                    case 1: return [4 /*yield*/, this.processPullRequest(pull_request, repository)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 3: return [4 /*yield*/, this.handlePRClosed(pull_request, repository)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 5: return [4 /*yield*/, this.handlePRReadyForReview(pull_request, repository)];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 7: return [4 /*yield*/, this.handlePRConvertedToDraft(pull_request, repository)];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Main PR processing workflow
     */
    GitHubPRManagerAgent.prototype.processPullRequest = function (pullRequest, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var prKey, analysis, context, tasks, results, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prKey = "".concat(repository.full_name, "#").concat(pullRequest.number);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 10]);
                        // Step 1: Analyze the PR
                        this.logger.info('Analyzing PR', { pr: prKey });
                        return [4 /*yield*/, this.analyzer.analyzePR(pullRequest, repository)];
                    case 2:
                        analysis = _a.sent();
                        context = {
                            pr: pullRequest,
                            repository: repository,
                            analysis: analysis,
                            timestamp: new Date(),
                            status: 'processing'
                        };
                        this.prContexts.set(prKey, context);
                        return [4 /*yield*/, this.generateTasksFromAnalysis(analysis, context)];
                    case 3:
                        tasks = _a.sent();
                        this.activeTasks.set(prKey, tasks);
                        // Step 4: Report initial status to GitHub
                        return [4 /*yield*/, this.reporter.reportPRProcessingStarted(pullRequest, repository, analysis)];
                    case 4:
                        // Step 4: Report initial status to GitHub
                        _a.sent();
                        // Step 5: Delegate tasks to specialized agents
                        this.logger.info('Delegating tasks to agents', {
                            pr: prKey,
                            taskCount: tasks.length,
                            taskTypes: tasks.map(function (t) { return t.type; })
                        });
                        return [4 /*yield*/, this.delegator.delegateTasks(tasks, context)];
                    case 5:
                        results = _a.sent();
                        // Step 6: Process results and update PR
                        return [4 /*yield*/, this.processTaskResults(results, context)];
                    case 6:
                        // Step 6: Process results and update PR
                        _a.sent();
                        // Step 7: Generate final report
                        return [4 /*yield*/, this.generateFinalReport(context, results)];
                    case 7:
                        // Step 7: Generate final report
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 8:
                        error_2 = _a.sent();
                        this.logger.error('Error processing PR', { pr: prKey, error: error_2 });
                        return [4 /*yield*/, this.reporter.reportError(pullRequest, repository, error_2)];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate tasks based on PR analysis
     */
    GitHubPRManagerAgent.prototype.generateTasksFromAnalysis = function (analysis, context) {
        return __awaiter(this, void 0, void 0, function () {
            var tasks, pr, repository;
            return __generator(this, function (_a) {
                tasks = [];
                pr = context.pr, repository = context.repository;
                // Security review task
                if (analysis.requiresSecurityReview) {
                    tasks.push({
                        id: "security-".concat(pr.number, "-").concat(Date.now()),
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
                        id: "code-review-".concat(pr.number, "-").concat(Date.now()),
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
                        id: "testing-".concat(pr.number, "-").concat(Date.now()),
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
                        id: "docs-".concat(pr.number, "-").concat(Date.now()),
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
                        id: "performance-".concat(pr.number, "-").concat(Date.now()),
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
                        id: "deployment-".concat(pr.number, "-").concat(Date.now()),
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
                return [2 /*return*/, tasks];
            });
        });
    };
    /**
     * Process results from delegated tasks
     */
    GitHubPRManagerAgent.prototype.processTaskResults = function (results, context) {
        return __awaiter(this, void 0, void 0, function () {
            var pr, repository, prKey, resultsByType;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pr = context.pr, repository = context.repository;
                        prKey = "".concat(repository.full_name, "#").concat(pr.number);
                        this.logger.info('Processing task results', {
                            pr: prKey,
                            resultCount: results.length,
                            successCount: results.filter(function (r) { return r.status === 'completed'; }).length,
                            failureCount: results.filter(function (r) { return r.status === 'failed'; }).length
                        });
                        resultsByType = results.reduce(function (acc, result) {
                            acc[result.task.type] = result;
                            return acc;
                        }, {});
                        if (!resultsByType.security_review) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.processSecurityResults(resultsByType.security_review, context)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!resultsByType.code_review) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.processCodeReviewResults(resultsByType.code_review, context)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!resultsByType.testing) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.processTestingResults(resultsByType.testing, context)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        if (!resultsByType.documentation) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.processDocumentationResults(resultsByType.documentation, context)];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        if (!resultsByType.performance_review) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.processPerformanceResults(resultsByType.performance_review, context)];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10:
                        if (!resultsByType.deployment_check) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.processDeploymentResults(resultsByType.deployment_check, context)];
                    case 11:
                        _a.sent();
                        _a.label = 12;
                    case 12: 
                    // Update PR status based on all results
                    return [4 /*yield*/, this.updatePRStatus(results, context)];
                    case 13:
                        // Update PR status based on all results
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate comprehensive final report
     */
    GitHubPRManagerAgent.prototype.generateFinalReport = function (context, results) {
        return __awaiter(this, void 0, void 0, function () {
            var pr, repository, report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pr = context.pr, repository = context.repository;
                        report = {
                            summary: this.generateSummary(results),
                            details: this.generateDetailedResults(results),
                            recommendations: this.generateRecommendations(results),
                            metrics: this.calculateMetrics(results),
                            timestamp: new Date()
                        };
                        // Post comprehensive comment to PR
                        return [4 /*yield*/, this.reporter.postFinalReport(pr, repository, report)];
                    case 1:
                        // Post comprehensive comment to PR
                        _a.sent();
                        // Update PR labels based on results
                        return [4 /*yield*/, this.updatePRLabels(pr, repository, results)];
                    case 2:
                        // Update PR labels based on results
                        _a.sent();
                        // Update project status
                        return [4 /*yield*/, this.updateProjectStatus(pr, repository, results)];
                    case 3:
                        // Update project status
                        _a.sent();
                        this.logger.info('Final report generated', {
                            pr: "".concat(repository.full_name, "#").concat(pr.number),
                            summary: report.summary
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle PR review events
     */
    GitHubPRManagerAgent.prototype.handlePullRequestReviewEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var action, review, pull_request, repository;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        action = event.action, review = event.review, pull_request = event.pull_request, repository = event.repository;
                        if (!(action === 'submitted')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.processReviewSubmission(review, pull_request, repository)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle issue comment events (commands in PR/issue comments)
     */
    GitHubPRManagerAgent.prototype.handleIssueCommentEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var action, comment, issue, repository;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        action = event.action, comment = event.comment, issue = event.issue, repository = event.repository;
                        if (!(action === 'created')) return [3 /*break*/, 4];
                        if (!issue.pull_request) return [3 /*break*/, 2];
                        // Handle PR comments
                        return [4 /*yield*/, this.processCommentCommand(comment, issue, repository)];
                    case 1:
                        // Handle PR comments
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: 
                    // Handle issue comments
                    return [4 /*yield*/, this.processIssueCommentCommand(comment, issue, repository)];
                    case 3:
                        // Handle issue comments
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process commands from issue comments
     */
    GitHubPRManagerAgent.prototype.processIssueCommentCommand = function (comment, issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var command;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        command = this.parseCommand(comment.body);
                        if (!command) return [3 /*break*/, 2];
                        this.logger.info('Processing issue comment command', {
                            command: command.action,
                            issue: "".concat(repository.full_name, "#").concat(issue.number),
                            user: comment.user.login
                        });
                        return [4 /*yield*/, this.executeIssueCommand(command, issue, repository)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process commands from PR comments (e.g., /rerun-tests, /security-review)
     */
    GitHubPRManagerAgent.prototype.processCommentCommand = function (comment, issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var command;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        command = this.parseCommand(comment.body);
                        if (!command) return [3 /*break*/, 2];
                        this.logger.info('Processing comment command', {
                            command: command.action,
                            pr: "".concat(repository.full_name, "#").concat(issue.number),
                            user: comment.user.login
                        });
                        return [4 /*yield*/, this.executeCommand(command, issue, repository)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Parse commands from comment text
     */
    GitHubPRManagerAgent.prototype.parseCommand = function (commentBody) {
        var commandRegex = /^\/([a-z-]+)(?:\s+(.*))?$/m;
        var match = commentBody.match(commandRegex);
        if (match) {
            return {
                action: match[1],
                args: match[2] ? match[2].split(/\s+/) : []
            };
        }
        return null;
    };
    /**
     * Execute parsed commands
     */
    GitHubPRManagerAgent.prototype.executeCommand = function (command, issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var pr, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.octokit.pulls.get({
                            owner: repository.owner.login,
                            repo: repository.name,
                            pull_number: issue.number
                        })];
                    case 1:
                        pr = _b.sent();
                        _a = command.action;
                        switch (_a) {
                            case 'rerun-tests': return [3 /*break*/, 2];
                            case 'security-review': return [3 /*break*/, 4];
                            case 'performance-check': return [3 /*break*/, 6];
                            case 'full-review': return [3 /*break*/, 8];
                            case 'status': return [3 /*break*/, 10];
                            case 'create-issue': return [3 /*break*/, 12];
                        }
                        return [3 /*break*/, 14];
                    case 2: return [4 /*yield*/, this.rerunTests(pr.data, repository)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 16];
                    case 4: return [4 /*yield*/, this.triggerSecurityReview(pr.data, repository)];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 16];
                    case 6: return [4 /*yield*/, this.triggerPerformanceCheck(pr.data, repository)];
                    case 7:
                        _b.sent();
                        return [3 /*break*/, 16];
                    case 8: return [4 /*yield*/, this.triggerFullReview(pr.data, repository)];
                    case 9:
                        _b.sent();
                        return [3 /*break*/, 16];
                    case 10: return [4 /*yield*/, this.reportCurrentStatus(pr.data, repository)];
                    case 11:
                        _b.sent();
                        return [3 /*break*/, 16];
                    case 12: return [4 /*yield*/, this.createIssueFromPR(pr.data, repository, command.args)];
                    case 13:
                        _b.sent();
                        return [3 /*break*/, 16];
                    case 14: return [4 /*yield*/, this.reporter.postComment(pr.data, repository, "Unknown command: /".concat(command.action, ". Available commands: /rerun-tests, /security-review, /performance-check, /full-review, /status, /create-issue"))];
                    case 15:
                        _b.sent();
                        _b.label = 16;
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute issue-specific commands
     */
    GitHubPRManagerAgent.prototype.executeIssueCommand = function (command, issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = command.action;
                        switch (_a) {
                            case 'triage': return [3 /*break*/, 1];
                            case 'estimate': return [3 /*break*/, 3];
                            case 'assign-agent': return [3 /*break*/, 5];
                            case 'generate-code': return [3 /*break*/, 7];
                            case 'generate-docs': return [3 /*break*/, 9];
                            case 'link-pr': return [3 /*break*/, 11];
                            case 'duplicate': return [3 /*break*/, 13];
                            case 'status': return [3 /*break*/, 15];
                        }
                        return [3 /*break*/, 17];
                    case 1: return [4 /*yield*/, this.retriageIssue(issue, repository)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 3: return [4 /*yield*/, this.reestimateIssue(issue, repository)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 5: return [4 /*yield*/, this.assignAgentToIssue(issue, repository, command.args[0])];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 7: return [4 /*yield*/, this.triggerCodeGeneration(issue, repository)];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 9: return [4 /*yield*/, this.triggerDocumentationGeneration(issue, repository)];
                    case 10:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 11: return [4 /*yield*/, this.linkPRToIssue(issue, repository, parseInt(command.args[0]))];
                    case 12:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 13: return [4 /*yield*/, this.markAsDuplicate(issue, repository, parseInt(command.args[0]))];
                    case 14:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 15: return [4 /*yield*/, this.reportIssueStatus(issue, repository)];
                    case 16:
                        _b.sent();
                        return [3 /*break*/, 19];
                    case 17: return [4 /*yield*/, this.octokit.issues.createComment({
                            owner: repository.owner.login,
                            repo: repository.name,
                            issue_number: issue.number,
                            body: "Unknown command: /".concat(command.action, ". Available commands: /triage, /estimate, /assign-agent, /generate-code, /generate-docs, /link-pr, /duplicate, /status")
                        })];
                    case 18:
                        _b.sent();
                        _b.label = 19;
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Setup event handlers for internal events
     */
    GitHubPRManagerAgent.prototype.setupEventHandlers = function () {
        var _this = this;
        this.orchestrator.on('agent_completed', function (result) {
            _this.logger.info('Agent task completed', {
                taskId: result.task.id,
                type: result.task.type,
                status: result.status
            });
        });
        this.orchestrator.on('agent_failed', function (result) {
            _this.logger.error('Agent task failed', {
                taskId: result.task.id,
                type: result.task.type,
                error: result.error
            });
        });
    };
    // Additional methods for specific result processing...
    GitHubPRManagerAgent.prototype.processSecurityResults = function (result, context) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(result.status === 'completed' && ((_b = (_a = result.output) === null || _a === void 0 ? void 0 : _a.securityIssues) === null || _b === void 0 ? void 0 : _b.length) > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.reporter.postSecurityAlert(context.pr, context.repository, result.output.securityIssues)];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.processCodeReviewResults = function (result, context) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(result.status === 'completed' && ((_b = (_a = result.output) === null || _a === void 0 ? void 0 : _a.suggestions) === null || _b === void 0 ? void 0 : _b.length) > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.reporter.postCodeReviewSuggestions(context.pr, context.repository, result.output.suggestions)];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.processTestingResults = function (result, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(result.status === 'completed')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.reporter.postTestResults(context.pr, context.repository, result.output)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.processDocumentationResults = function (result, context) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(result.status === 'completed' && ((_b = (_a = result.output) === null || _a === void 0 ? void 0 : _a.missingDocs) === null || _b === void 0 ? void 0 : _b.length) > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.reporter.postDocumentationReminder(context.pr, context.repository, result.output.missingDocs)];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.processPerformanceResults = function (result, context) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(result.status === 'completed' && ((_b = (_a = result.output) === null || _a === void 0 ? void 0 : _a.performanceIssues) === null || _b === void 0 ? void 0 : _b.length) > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.reporter.postPerformanceAlert(context.pr, context.repository, result.output.performanceIssues)];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.processDeploymentResults = function (result, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(result.status === 'completed')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.reporter.postDeploymentStatus(context.pr, context.repository, result.output)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.updatePRStatus = function (results, context) {
        return __awaiter(this, void 0, void 0, function () {
            var hasFailures, hasBlockingIssues;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hasFailures = results.some(function (r) { return r.status === 'failed'; });
                        hasBlockingIssues = results.some(function (r) { var _a; return ((_a = r.output) === null || _a === void 0 ? void 0 : _a.blocking) === true; });
                        if (!(hasFailures || hasBlockingIssues)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.reporter.updateCheckStatus(context.pr, context.repository, 'failure', 'Automated review found issues')];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.reporter.updateCheckStatus(context.pr, context.repository, 'success', 'All automated checks passed')];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.generateSummary = function (results) {
        var completed = results.filter(function (r) { return r.status === 'completed'; }).length;
        var failed = results.filter(function (r) { return r.status === 'failed'; }).length;
        var total = results.length;
        return "Completed ".concat(completed, "/").concat(total, " tasks (").concat(failed, " failed)");
    };
    GitHubPRManagerAgent.prototype.generateDetailedResults = function (results) {
        return results.map(function (result) {
            var _a, _b;
            return ({
                type: result.task.type,
                status: result.status,
                duration: result.completedAt && result.startedAt ?
                    result.completedAt.getTime() - result.startedAt.getTime() : null,
                summary: ((_a = result.output) === null || _a === void 0 ? void 0 : _a.summary) || 'No summary available',
                issues: ((_b = result.output) === null || _b === void 0 ? void 0 : _b.issues) || []
            });
        });
    };
    GitHubPRManagerAgent.prototype.generateRecommendations = function (results) {
        var recommendations = [];
        results.forEach(function (result) {
            var _a;
            if ((_a = result.output) === null || _a === void 0 ? void 0 : _a.recommendations) {
                recommendations.push.apply(recommendations, result.output.recommendations);
            }
        });
        return recommendations;
    };
    GitHubPRManagerAgent.prototype.calculateMetrics = function (results) {
        var totalTime = results.reduce(function (acc, result) {
            if (result.completedAt && result.startedAt) {
                return acc + (result.completedAt.getTime() - result.startedAt.getTime());
            }
            return acc;
        }, 0);
        return {
            totalExecutionTime: totalTime,
            averageTaskTime: results.length > 0 ? totalTime / results.length : 0,
            successRate: results.length > 0 ? results.filter(function (r) { return r.status === 'completed'; }).length / results.length : 0
        };
    };
    GitHubPRManagerAgent.prototype.updatePRLabels = function (pr, repository, results) {
        return __awaiter(this, void 0, void 0, function () {
            var labels;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        labels = [];
                        if (results.some(function (r) { var _a, _b; return r.task.type === 'security_review' && ((_b = (_a = r.output) === null || _a === void 0 ? void 0 : _a.securityIssues) === null || _b === void 0 ? void 0 : _b.length) > 0; })) {
                            labels.push('security-review-needed');
                        }
                        if (results.some(function (r) { return r.task.type === 'testing' && r.status === 'failed'; })) {
                            labels.push('tests-failing');
                        }
                        if (results.some(function (r) { var _a, _b; return r.task.type === 'documentation' && ((_b = (_a = r.output) === null || _a === void 0 ? void 0 : _a.missingDocs) === null || _b === void 0 ? void 0 : _b.length) > 0; })) {
                            labels.push('docs-needed');
                        }
                        if (!(labels.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.octokit.issues.addLabels({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: pr.number,
                                labels: labels
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.updateProjectStatus = function (pr, repository, results) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    GitHubPRManagerAgent.prototype.handlePRClosed = function (pr, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var prKey;
            return __generator(this, function (_a) {
                prKey = "".concat(repository.full_name, "#").concat(pr.number);
                // Cleanup active tasks
                this.activeTasks.delete(prKey);
                this.prContexts.delete(prKey);
                this.logger.info('PR closed, cleaned up resources', { pr: prKey });
                return [2 /*return*/];
            });
        });
    };
    GitHubPRManagerAgent.prototype.handlePRReadyForReview = function (pr, repository) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.processPullRequest(pr, repository)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.handlePRConvertedToDraft = function (pr, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var prKey, tasks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prKey = "".concat(repository.full_name, "#").concat(pr.number);
                        tasks = this.activeTasks.get(prKey);
                        if (!tasks) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.orchestrator.pauseTasks(tasks.map(function (t) { return t.id; }))];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.logger.info('PR converted to draft, paused tasks', { pr: prKey });
                        return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.rerunTests = function (pr, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var context, testTask;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        context = this.prContexts.get("".concat(repository.full_name, "#").concat(pr.number));
                        if (!context) return [3 /*break*/, 2];
                        testTask = {
                            id: "rerun-tests-".concat(pr.number, "-").concat(Date.now()),
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
                        return [4 /*yield*/, this.delegator.delegateTask(testTask, context)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.triggerSecurityReview = function (pr, repository) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    GitHubPRManagerAgent.prototype.triggerPerformanceCheck = function (pr, repository) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    GitHubPRManagerAgent.prototype.triggerFullReview = function (pr, repository) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.processPullRequest(pr, repository)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.reportCurrentStatus = function (pr, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var prKey, context, tasks, status_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prKey = "".concat(repository.full_name, "#").concat(pr.number);
                        context = this.prContexts.get(prKey);
                        tasks = this.activeTasks.get(prKey);
                        if (!(context && tasks)) return [3 /*break*/, 2];
                        status_1 = {
                            activeTasks: tasks.length,
                            completedTasks: tasks.filter(function (t) { return t.status === 'completed'; }).length,
                            failedTasks: tasks.filter(function (t) { return t.status === 'failed'; }).length,
                            context: context.status
                        };
                        return [4 /*yield*/, this.reporter.postComment(pr, repository, "**Current Status:** ".concat(JSON.stringify(status_1, null, 2)))];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // Issue management methods
    GitHubPRManagerAgent.prototype.retriageIssue = function (issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        context = this.issueManager.getIssueContext(repository.full_name, issue.number);
                        if (!context) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.issueManager.handleIssueEvent({
                                action: 'edited',
                                issue: issue,
                                repository: repository
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.octokit.issues.createComment({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                body: '🔄 Issue has been re-triaged. Check the updated analysis above.'
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.reestimateIssue = function (issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var context;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        context = this.issueManager.getIssueContext(repository.full_name, issue.number);
                        if (!context) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.octokit.issues.createComment({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                body: "\uD83D\uDCCA **Current Estimate:** ".concat(context.analysis.estimatedHours, " hours\n**Complexity:** ").concat(context.analysis.complexity, "\n**Type:** ").concat(context.analysis.type)
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.assignAgentToIssue = function (issue, repository, agentType) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Implementation would assign specific agent type to work on issue
                    return [4 /*yield*/, this.octokit.issues.createComment({
                            owner: repository.owner.login,
                            repo: repository.name,
                            issue_number: issue.number,
                            body: "\uD83E\uDD16 Assigned ".concat(agentType, " agent to work on this issue.")
                        })];
                    case 1:
                        // Implementation would assign specific agent type to work on issue
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.triggerCodeGeneration = function (issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var context, task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        context = this.issueManager.getIssueContext(repository.full_name, issue.number);
                        if (!(context && context.analysis.canAutoGenerate)) return [3 /*break*/, 3];
                        task = {
                            id: "code-gen-".concat(issue.number, "-").concat(Date.now()),
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
                        return [4 /*yield*/, this.orchestrator.executeTask(task)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.octokit.issues.createComment({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                body: '🔧 Code generation task has been queued. You will receive updates as the agent works on this issue.'
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, this.octokit.issues.createComment({
                            owner: repository.owner.login,
                            repo: repository.name,
                            issue_number: issue.number,
                            body: '❌ This issue is not suitable for automated code generation.'
                        })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.triggerDocumentationGeneration = function (issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        task = {
                            id: "doc-gen-".concat(issue.number, "-").concat(Date.now()),
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
                        return [4 /*yield*/, this.orchestrator.executeTask(task)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.octokit.issues.createComment({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                body: '📚 Documentation generation task has been queued.'
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.linkPRToIssue = function (issue, repository, prNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.octokit.issues.createComment({
                            owner: repository.owner.login,
                            repo: repository.name,
                            issue_number: issue.number,
                            body: "\uD83D\uDD17 Linked to PR #".concat(prNumber)
                        })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.markAsDuplicate = function (issue, repository, duplicateOfIssue) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.octokit.issues.createComment({
                            owner: repository.owner.login,
                            repo: repository.name,
                            issue_number: issue.number,
                            body: "\uD83D\uDD04 Marked as duplicate of #".concat(duplicateOfIssue)
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.octokit.issues.addLabels({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                labels: ['duplicate']
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.octokit.issues.update({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                state: 'closed'
                            })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.reportIssueStatus = function (issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var context, status_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        context = this.issueManager.getIssueContext(repository.full_name, issue.number);
                        if (!context) return [3 /*break*/, 2];
                        status_2 = {
                            status: context.status,
                            type: context.analysis.type,
                            priority: context.analysis.priority,
                            complexity: context.analysis.complexity,
                            estimatedHours: context.analysis.estimatedHours,
                            canAutoGenerate: context.analysis.canAutoGenerate,
                            assignedAgents: context.assignedAgents.length,
                            relatedPRs: context.relatedPRs.length
                        };
                        return [4 /*yield*/, this.octokit.issues.createComment({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                body: "**Issue Status:** ```json\n".concat(JSON.stringify(status_2, null, 2), "\n```")
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GitHubPRManagerAgent.prototype.createIssueFromPR = function (pr, repository, args) {
        return __awaiter(this, void 0, void 0, function () {
            var issueType, context, issueNumber;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        issueType = args[0] || 'general';
                        context = this.prContexts.get("".concat(repository.full_name, "#").concat(pr.number));
                        if (!context) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.issueManager.createIssueFromPR(context, issueType, {
                                analysis: context.analysis
                            })];
                    case 1:
                        issueNumber = _a.sent();
                        if (!issueNumber) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.reporter.postComment(pr, repository, "\uD83D\uDCDD Created issue #".concat(issueNumber, " for ").concat(issueType, " follow-up."))];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Add method to get comprehensive system status including issues
    GitHubPRManagerAgent.prototype.getSystemStatus = function () {
        var orchestratorStatus = this.orchestrator.getSystemStatus();
        var issueMetrics = this.issueManager.generateIssueMetrics();
        return __assign(__assign({}, orchestratorStatus), { issues: issueMetrics, prs: {
                active: this.prContexts.size,
                activeTasks: this.activeTasks.size
            }, integration: {
                totalItems: this.prContexts.size + issueMetrics.total,
                issueToPR: issueMetrics.total > 0 ? this.prContexts.size / issueMetrics.total : 0
            } });
    };
    return GitHubPRManagerAgent;
}(events_1.EventEmitter));
exports.GitHubPRManagerAgent = GitHubPRManagerAgent;
