"use strict";
/**
 * GitHub Issue Manager
 *
 * Handles GitHub issues creation, management, and coordination with PRs
 */
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubIssueManager = void 0;
var GitHubIssueManager = /** @class */ (function () {
    function GitHubIssueManager(octokit, logger) {
        this.issueContexts = new Map();
        this.issueTemplates = new Map();
        this.octokit = octokit;
        this.logger = logger;
        this.initializeIssueTemplates();
    }
    /**
     * Handle GitHub issue webhook events
     */
    GitHubIssueManager.prototype.handleIssueEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var action, issue, repository, issueKey, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        action = event.action, issue = event.issue, repository = event.repository;
                        issueKey = "".concat(repository.full_name, "#").concat(issue.number);
                        this.logger.info('Handling issue event', {
                            action: action,
                            issue: issueKey,
                            title: issue.title
                        });
                        _a = action;
                        switch (_a) {
                            case 'opened': return [3 /*break*/, 1];
                            case 'edited': return [3 /*break*/, 3];
                            case 'assigned': return [3 /*break*/, 5];
                            case 'labeled': return [3 /*break*/, 7];
                            case 'closed': return [3 /*break*/, 9];
                            case 'reopened': return [3 /*break*/, 11];
                        }
                        return [3 /*break*/, 13];
                    case 1: return [4 /*yield*/, this.processNewIssue(issue, repository)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 3: return [4 /*yield*/, this.processIssueUpdate(issue, repository)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 5: return [4 /*yield*/, this.handleIssueAssignment(issue, repository, event.assignee)];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 7: return [4 /*yield*/, this.handleIssueLabelUpdate(issue, repository, event.label)];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 9: return [4 /*yield*/, this.handleIssueClosure(issue, repository)];
                    case 10:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 11: return [4 /*yield*/, this.handleIssueReopened(issue, repository)];
                    case 12:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process a newly opened issue
     */
    GitHubIssueManager.prototype.processNewIssue = function (issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var issueKey, analysis, context, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        issueKey = "".concat(repository.full_name, "#").concat(issue.number);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, this.analyzeIssue(issue, repository)];
                    case 2:
                        analysis = _a.sent();
                        context = {
                            issue: issue,
                            repository: repository,
                            analysis: analysis,
                            timestamp: new Date(),
                            status: 'new',
                            relatedPRs: [],
                            assignedAgents: []
                        };
                        this.issueContexts.set(issueKey, context);
                        // Auto-triage the issue
                        return [4 /*yield*/, this.triageIssue(context)];
                    case 3:
                        // Auto-triage the issue
                        _a.sent();
                        if (!analysis.canAutoGenerate) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.generateAutomatedTasks(context)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: 
                    // Check for duplicate issues
                    return [4 /*yield*/, this.checkForDuplicates(context)];
                    case 6:
                        // Check for duplicate issues
                        _a.sent();
                        // Link to related issues/PRs
                        return [4 /*yield*/, this.linkRelatedItems(context)];
                    case 7:
                        // Link to related issues/PRs
                        _a.sent();
                        this.logger.info('New issue processed', {
                            issue: issueKey,
                            type: analysis.type,
                            priority: analysis.priority,
                            complexity: analysis.complexity
                        });
                        return [3 /*break*/, 9];
                    case 8:
                        error_1 = _a.sent();
                        this.logger.error('Error processing new issue', {
                            issue: issueKey,
                            error: error_1 instanceof Error ? error_1.message : String(error_1)
                        });
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyze an issue to determine type, priority, and required actions
     */
    GitHubIssueManager.prototype.analyzeIssue = function (issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var title, body, labels, text, type, priority, complexity, estimatedHours, requiredSkills, acceptanceCriteria, suggestedApproach, riskFactors, needsMoreInfo, canAutoGenerate;
            return __generator(this, function (_a) {
                title = issue.title.toLowerCase();
                body = (issue.body || '').toLowerCase();
                labels = issue.labels.map(function (l) { return l.name.toLowerCase(); });
                text = "".concat(title, " ").concat(body);
                type = this.determineIssueType(text, labels);
                priority = this.determinePriority(text, labels, type);
                complexity = this.assessComplexity(text, type);
                estimatedHours = this.estimateEffort(complexity, type);
                requiredSkills = this.extractRequiredSkills(text, type);
                acceptanceCriteria = this.generateAcceptanceCriteria(text, type);
                suggestedApproach = this.suggestApproach(text, type, complexity);
                riskFactors = this.identifyRiskFactors(text, type);
                needsMoreInfo = this.needsMoreInformation(text, type);
                canAutoGenerate = this.canAutoGenerateCode(text, type);
                return [2 /*return*/, {
                        id: "analysis-".concat(issue.number, "-").concat(Date.now()),
                        issueNumber: issue.number,
                        repository: repository.full_name,
                        type: type,
                        priority: priority,
                        complexity: complexity,
                        estimatedHours: estimatedHours,
                        labels: labels,
                        assignees: issue.assignees.map(function (a) { return a.login; }),
                        requiredSkills: requiredSkills,
                        dependencies: this.extractDependencies(text),
                        blockers: [],
                        relatedIssues: [],
                        suggestedApproach: suggestedApproach,
                        acceptanceCriteria: acceptanceCriteria,
                        riskFactors: riskFactors,
                        needsMoreInfo: needsMoreInfo,
                        canAutoGenerate: canAutoGenerate,
                        requiresHumanReview: !canAutoGenerate || complexity === 'complex' || complexity === 'very-complex'
                    }];
            });
        });
    };
    /**
     * Determine issue type from text and labels
     */
    GitHubIssueManager.prototype.determineIssueType = function (text, labels) {
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
        var bugKeywords = ['bug', 'error', 'issue', 'problem', 'broken', 'not working', 'fails', 'crash', 'exception'];
        var featureKeywords = ['feature', 'add', 'implement', 'new', 'create', 'build', 'develop'];
        var docKeywords = ['documentation', 'docs', 'readme', 'guide', 'tutorial', 'example'];
        var securityKeywords = ['security', 'vulnerability', 'exploit', 'unauthorized', 'permission', 'auth'];
        var performanceKeywords = ['performance', 'slow', 'optimization', 'speed', 'memory', 'cpu'];
        var questionKeywords = ['how', 'why', 'what', 'question', 'help', 'clarification'];
        if (bugKeywords.some(function (keyword) { return text.includes(keyword); }))
            return 'bug';
        if (securityKeywords.some(function (keyword) { return text.includes(keyword); }))
            return 'security';
        if (performanceKeywords.some(function (keyword) { return text.includes(keyword); }))
            return 'performance';
        if (docKeywords.some(function (keyword) { return text.includes(keyword); }))
            return 'documentation';
        if (questionKeywords.some(function (keyword) { return text.includes(keyword); }))
            return 'question';
        if (featureKeywords.some(function (keyword) { return text.includes(keyword); }))
            return 'feature';
        return 'enhancement'; // Default
    };
    /**
     * Determine priority level
     */
    GitHubIssueManager.prototype.determinePriority = function (text, labels, type) {
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
            var criticalBugKeywords = ['crash', 'data loss', 'security', 'production', 'critical', 'urgent'];
            if (criticalBugKeywords.some(function (keyword) { return text.includes(keyword); }))
                return 'critical';
            var highBugKeywords = ['error', 'broken', 'not working', 'fails'];
            if (highBugKeywords.some(function (keyword) { return text.includes(keyword); }))
                return 'high';
            return 'medium';
        }
        // Feature priority based on keywords
        var highPriorityKeywords = ['urgent', 'asap', 'blocking', 'critical', 'important'];
        var lowPriorityKeywords = ['nice to have', 'later', 'future', 'optional', 'enhancement'];
        if (highPriorityKeywords.some(function (keyword) { return text.includes(keyword); }))
            return 'high';
        if (lowPriorityKeywords.some(function (keyword) { return text.includes(keyword); }))
            return 'low';
        return 'medium'; // Default
    };
    /**
     * Assess complexity of the issue
     */
    GitHubIssueManager.prototype.assessComplexity = function (text, type) {
        var complexityScore = 0;
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
        var complexKeywords = ['refactor', 'architecture', 'design', 'algorithm', 'optimization', 'migration', 'integration'];
        var simpleKeywords = ['typo', 'text', 'color', 'style', 'copy', 'link'];
        if (complexKeywords.some(function (keyword) { return text.includes(keyword); }))
            complexityScore += 2;
        if (simpleKeywords.some(function (keyword) { return text.includes(keyword); }))
            complexityScore -= 1;
        // Multiple system involvement
        var systemKeywords = ['database', 'api', 'frontend', 'backend', 'deployment', 'infrastructure'];
        var systemCount = systemKeywords.filter(function (keyword) { return text.includes(keyword); }).length;
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
    };
    /**
     * Estimate effort in hours
     */
    GitHubIssueManager.prototype.estimateEffort = function (complexity, type) {
        var baseHours = {
            'trivial': 1,
            'simple': 3,
            'moderate': 8,
            'complex': 20,
            'very-complex': 40
        };
        var hours = baseHours[complexity];
        // Type multipliers
        var typeMultipliers = {
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
    };
    /**
     * Extract required skills from issue content
     */
    GitHubIssueManager.prototype.extractRequiredSkills = function (text, type) {
        var skills = [];
        // Programming languages
        var languages = ['javascript', 'typescript', 'python', 'java', 'go', 'rust', 'php', 'ruby', 'c#', 'swift', 'kotlin'];
        languages.forEach(function (lang) {
            if (text.includes(lang))
                skills.push(lang);
        });
        // Frameworks and libraries
        var frameworks = ['react', 'vue', 'angular', 'next.js', 'express', 'fastapi', 'django', 'spring', 'rails'];
        frameworks.forEach(function (framework) {
            if (text.includes(framework))
                skills.push(framework);
        });
        // Technologies
        var technologies = ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'postgresql', 'mongodb', 'redis', 'graphql', 'rest'];
        technologies.forEach(function (tech) {
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
        return __spreadArray([], new Set(skills), true); // Remove duplicates
    };
    /**
     * Generate acceptance criteria based on issue content
     */
    GitHubIssueManager.prototype.generateAcceptanceCriteria = function (text, type) {
        var criteria = [];
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
    };
    /**
     * Suggest approach for solving the issue
     */
    GitHubIssueManager.prototype.suggestApproach = function (text, type, complexity) {
        var approach = [];
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
    };
    /**
     * Identify potential risk factors
     */
    GitHubIssueManager.prototype.identifyRiskFactors = function (text, type) {
        var risks = [];
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
    };
    /**
     * Check if issue needs more information
     */
    GitHubIssueManager.prototype.needsMoreInformation = function (text, type) {
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
    };
    /**
     * Check if code can be auto-generated
     */
    GitHubIssueManager.prototype.canAutoGenerateCode = function (text, type) {
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
    };
    /**
     * Extract dependency issue numbers
     */
    GitHubIssueManager.prototype.extractDependencies = function (text) {
        var dependencies = [];
        // Look for patterns like "depends on #123" or "blocked by #456"
        var patterns = [
            /depends?\s+on\s+#(\d+)/gi,
            /blocked?\s+by\s+#(\d+)/gi,
            /requires?\s+#(\d+)/gi,
            /needs?\s+#(\d+)/gi
        ];
        patterns.forEach(function (pattern) {
            var match;
            while ((match = pattern.exec(text)) !== null) {
                dependencies.push(parseInt(match[1]));
            }
        });
        return __spreadArray([], new Set(dependencies), true); // Remove duplicates
    };
    /**
     * Auto-triage the issue based on analysis
     */
    GitHubIssueManager.prototype.triageIssue = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var issue, repository, analysis, labelsToAdd, triageComment, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        issue = context.issue, repository = context.repository, analysis = context.analysis;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        labelsToAdd = this.generateLabels(analysis);
                        if (!(labelsToAdd.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.octokit.issues.addLabels({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                labels: labelsToAdd
                            })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        // Set milestone if applicable
                        if (analysis.priority === 'critical' || analysis.priority === 'urgent') {
                            // Could set to current sprint/milestone
                        }
                        triageComment = this.generateTriageComment(analysis);
                        return [4 /*yield*/, this.octokit.issues.createComment({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                body: triageComment
                            })];
                    case 4:
                        _a.sent();
                        if (!analysis.needsMoreInfo) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.requestMoreInformation(context)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        context.status = 'triaged';
                        this.logger.info('Issue triaged', {
                            issue: "".concat(repository.full_name, "#").concat(issue.number),
                            type: analysis.type,
                            priority: analysis.priority
                        });
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _a.sent();
                        this.logger.error('Error triaging issue', {
                            issue: "".concat(repository.full_name, "#").concat(issue.number),
                            error: error_2 instanceof Error ? error_2.message : String(error_2)
                        });
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate appropriate labels for the issue
     */
    GitHubIssueManager.prototype.generateLabels = function (analysis) {
        var labels = [];
        // Type label
        labels.push(analysis.type);
        // Priority label
        if (analysis.priority !== 'medium') {
            labels.push("priority-".concat(analysis.priority));
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
        analysis.requiredSkills.forEach(function (skill) {
            labels.push("skill-".concat(skill));
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
    };
    /**
     * Generate triage comment
     */
    GitHubIssueManager.prototype.generateTriageComment = function (analysis) {
        return "## \uD83E\uDD16 Automated Triage\n\n**Issue Analysis:**\n- **Type:** ".concat(analysis.type, "\n- **Priority:** ").concat(analysis.priority, "\n- **Complexity:** ").concat(analysis.complexity, "\n- **Estimated Effort:** ").concat(analysis.estimatedHours, " hours\n\n**Required Skills:** ").concat(analysis.requiredSkills.join(', ') || 'None specified', "\n\n**Suggested Approach:**\n").concat(analysis.suggestedApproach.map(function (step) { return "- ".concat(step); }).join('\n'), "\n\n**Acceptance Criteria:**\n").concat(analysis.acceptanceCriteria.map(function (criteria) { return "- [ ] ".concat(criteria); }).join('\n'), "\n\n").concat(analysis.riskFactors.length > 0 ? "\n**Risk Factors:**\n".concat(analysis.riskFactors.map(function (risk) { return "\u26A0\uFE0F ".concat(risk); }).join('\n')) : '', "\n\n").concat(analysis.canAutoGenerate ? '\n✨ **This issue may be suitable for automated code generation**' : '', "\n\n---\n*This analysis was generated automatically. Please review and adjust as needed.*");
    };
    /**
     * Request more information from issue author
     */
    GitHubIssueManager.prototype.requestMoreInformation = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var issue, repository, analysis, infoRequest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        issue = context.issue, repository = context.repository, analysis = context.analysis;
                        infoRequest = '## ℹ️ More Information Needed\n\n';
                        if (analysis.type === 'bug') {
                            infoRequest += "To help us resolve this bug, please provide:\n\n- **Steps to reproduce:** Detailed steps to recreate the issue\n- **Expected behavior:** What should happen\n- **Actual behavior:** What actually happens\n- **Environment:** OS, browser, version numbers\n- **Screenshots/logs:** If applicable\n\nYou can edit your original issue description to add this information.";
                        }
                        else if (analysis.type === 'feature') {
                            infoRequest += "To help us implement this feature, please provide:\n\n- **User story:** As a [user type], I want [functionality] so that [benefit]\n- **Detailed requirements:** Specific functionality needed\n- **Use cases:** How this feature would be used\n- **Success criteria:** How to measure success\n- **Mockups/wireframes:** If applicable\n\nYou can edit your original issue description to add this information.";
                        }
                        else {
                            infoRequest += "Please provide more detailed information about this ".concat(analysis.type, ". The current description is too brief for us to effectively address the issue.");
                        }
                        return [4 /*yield*/, this.octokit.issues.createComment({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                body: infoRequest
                            })];
                    case 1:
                        _a.sent();
                        // Add "needs-info" label
                        return [4 /*yield*/, this.octokit.issues.addLabels({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                labels: ['needs-info']
                            })];
                    case 2:
                        // Add "needs-info" label
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate automated tasks for auto-generatable issues
     */
    GitHubIssueManager.prototype.generateAutomatedTasks = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var analysis, tasks;
            return __generator(this, function (_a) {
                analysis = context.analysis;
                if (!analysis.canAutoGenerate)
                    return [2 /*return*/];
                tasks = [];
                // Documentation generation task
                if (analysis.type === 'documentation') {
                    tasks.push({
                        id: "doc-gen-".concat(analysis.issueNumber, "-").concat(Date.now()),
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
                        id: "code-gen-".concat(analysis.issueNumber, "-").concat(Date.now()),
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
                        issue: "".concat(analysis.repository, "#").concat(analysis.issueNumber),
                        taskCount: tasks.length
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Check for duplicate issues
     */
    GitHubIssueManager.prototype.checkForDuplicates = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var issue, repository, searchQuery, searchResults, potentialDuplicates, duplicateComment, error_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        issue = context.issue, repository = context.repository;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        searchQuery = "repo:".concat(repository.full_name, " is:issue \"").concat(issue.title.substring(0, 50), "\"");
                        return [4 /*yield*/, this.octokit.search.issuesAndPullRequests({
                                q: searchQuery
                            })];
                    case 2:
                        searchResults = (_a.sent()).data;
                        potentialDuplicates = searchResults.items
                            .filter(function (item) { return item.number !== issue.number && item.state === 'open'; })
                            .filter(function (item) { return _this.calculateSimilarity(issue.title, item.title) > 0.7; });
                        if (!(potentialDuplicates.length > 0)) return [3 /*break*/, 5];
                        duplicateComment = "## \uD83D\uDD0D Potential Duplicates Found\n\nThis issue may be related to or duplicate of:\n".concat(potentialDuplicates.map(function (dup) { return "- #".concat(dup.number, ": ").concat(dup.title); }).join('\n'), "\n\nPlease review these issues to see if they address the same concern.");
                        return [4 /*yield*/, this.octokit.issues.createComment({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                body: duplicateComment
                            })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.octokit.issues.addLabels({
                                owner: repository.owner.login,
                                repo: repository.name,
                                issue_number: issue.number,
                                labels: ['possible-duplicate']
                            })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_3 = _a.sent();
                        this.logger.error('Error checking for duplicates', {
                            issue: "".concat(repository.full_name, "#").concat(issue.number),
                            error: error_3 instanceof Error ? error_3.message : String(error_3)
                        });
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculate text similarity (simple implementation)
     */
    GitHubIssueManager.prototype.calculateSimilarity = function (text1, text2) {
        var words1 = text1.toLowerCase().split(/\s+/);
        var words2 = text2.toLowerCase().split(/\s+/);
        var intersection = words1.filter(function (word) { return words2.includes(word); });
        var union = __spreadArray([], new Set(__spreadArray(__spreadArray([], words1, true), words2, true)), true);
        return intersection.length / union.length;
    };
    /**
     * Link related issues and PRs
     */
    GitHubIssueManager.prototype.linkRelatedItems = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Create issue from PR analysis
     */
    GitHubIssueManager.prototype.createIssueFromPR = function (prContext, issueType, details) {
        return __awaiter(this, void 0, void 0, function () {
            var pr, repository, analysis, template, issueTitle, issueBody, issue, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pr = prContext.pr, repository = prContext.repository, analysis = prContext.analysis;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        template = this.issueTemplates.get(issueType);
                        if (!template) {
                            this.logger.error('Unknown issue template', { issueType: issueType });
                            return [2 /*return*/, null];
                        }
                        issueTitle = template.title
                            .replace('{PR_NUMBER}', pr.number.toString())
                            .replace('{PR_TITLE}', pr.title);
                        issueBody = template.body
                            .replace('{PR_NUMBER}', pr.number.toString())
                            .replace('{PR_URL}', pr.html_url)
                            .replace('{DETAILS}', JSON.stringify(details, null, 2));
                        return [4 /*yield*/, this.octokit.issues.create({
                                owner: repository.owner.login,
                                repo: repository.name,
                                title: issueTitle,
                                body: issueBody,
                                labels: template.labels,
                                assignees: template.assignees
                            })];
                    case 2:
                        issue = (_a.sent()).data;
                        this.logger.info('Created issue from PR', {
                            pr: "".concat(repository.full_name, "#").concat(pr.number),
                            issue: "".concat(repository.full_name, "#").concat(issue.number),
                            type: issueType
                        });
                        return [2 /*return*/, issue.number];
                    case 3:
                        error_4 = _a.sent();
                        this.logger.error('Error creating issue from PR', {
                            pr: "".concat(repository.full_name, "#").concat(pr.number),
                            error: error_4 instanceof Error ? error_4.message : String(error_4)
                        });
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Initialize issue templates
     */
    GitHubIssueManager.prototype.initializeIssueTemplates = function () {
        this.issueTemplates.set('security-vulnerability', {
            type: 'security-vulnerability',
            title: 'Security Review Required for PR #{PR_NUMBER}',
            body: "# Security Review Required\n\nThis issue was automatically created because PR #{PR_NUMBER} requires security review.\n\n**PR:** {PR_URL}\n**PR Title:** {PR_TITLE}\n\n## Security Concerns\n{DETAILS}\n\n## Next Steps\n- [ ] Conduct security code review\n- [ ] Perform vulnerability assessment\n- [ ] Update security documentation if needed\n- [ ] Approve or request changes on the PR\n\n**Priority:** High\n**Type:** Security Review",
            labels: ['security', 'review-required', 'high-priority'],
            assignees: [] // Would be configured based on team
        });
        this.issueTemplates.set('performance-regression', {
            type: 'performance-regression',
            title: 'Performance Review Required for PR #{PR_NUMBER}',
            body: "# Performance Review Required\n\nThis issue was automatically created because PR #{PR_NUMBER} may impact performance.\n\n**PR:** {PR_URL}\n**PR Title:** {PR_TITLE}\n\n## Performance Concerns\n{DETAILS}\n\n## Next Steps\n- [ ] Conduct performance analysis\n- [ ] Run performance benchmarks\n- [ ] Identify potential optimizations\n- [ ] Approve or request changes on the PR\n\n**Priority:** Medium\n**Type:** Performance Review",
            labels: ['performance', 'review-required'],
            assignees: []
        });
        this.issueTemplates.set('documentation-missing', {
            type: 'documentation-missing',
            title: 'Documentation Update Required for PR #{PR_NUMBER}',
            body: "# Documentation Update Required\n\nThis issue was automatically created because PR #{PR_NUMBER} requires documentation updates.\n\n**PR:** {PR_URL}\n**PR Title:** {PR_TITLE}\n\n## Documentation Needed\n{DETAILS}\n\n## Next Steps\n- [ ] Update relevant documentation\n- [ ] Add code comments if needed\n- [ ] Update API documentation\n- [ ] Update README if applicable\n\n**Priority:** Low\n**Type:** Documentation",
            labels: ['documentation', 'good-first-issue'],
            assignees: []
        });
        this.issueTemplates.set('test-coverage', {
            type: 'test-coverage',
            title: 'Test Coverage Required for PR #{PR_NUMBER}',
            body: "# Test Coverage Required\n\nThis issue was automatically created because PR #{PR_NUMBER} needs additional test coverage.\n\n**PR:** {PR_URL}\n**PR Title:** {PR_TITLE}\n\n## Testing Needed\n{DETAILS}\n\n## Next Steps\n- [ ] Add unit tests for new functionality\n- [ ] Add integration tests if needed\n- [ ] Ensure edge cases are covered\n- [ ] Verify test coverage meets requirements\n\n**Priority:** Medium\n**Type:** Testing",
            labels: ['testing', 'good-first-issue'],
            assignees: []
        });
    };
    // Event handlers for different issue actions
    GitHubIssueManager.prototype.processIssueUpdate = function (issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var issueKey, context, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        issueKey = "".concat(repository.full_name, "#").concat(issue.number);
                        context = this.issueContexts.get(issueKey);
                        if (!context) return [3 /*break*/, 2];
                        // Re-analyze if significant changes
                        _a = context;
                        return [4 /*yield*/, this.analyzeIssue(issue, repository)];
                    case 1:
                        // Re-analyze if significant changes
                        _a.analysis = _b.sent();
                        context.timestamp = new Date();
                        _b.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    GitHubIssueManager.prototype.handleIssueAssignment = function (issue, repository, assignee) {
        return __awaiter(this, void 0, void 0, function () {
            var issueKey, context;
            return __generator(this, function (_a) {
                issueKey = "".concat(repository.full_name, "#").concat(issue.number);
                context = this.issueContexts.get(issueKey);
                if (context) {
                    context.status = 'assigned';
                    // Send notification to assignee if configured
                    this.logger.info('Issue assigned', {
                        issue: issueKey,
                        assignee: assignee.login
                    });
                }
                return [2 /*return*/];
            });
        });
    };
    GitHubIssueManager.prototype.handleIssueLabelUpdate = function (issue, repository, label) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Handle label changes - might trigger different workflows
                if (label.name === 'needs-info') {
                    // Issue needs more information
                }
                else if (label.name === 'ready-for-development') {
                    // Issue is ready to be worked on
                }
                return [2 /*return*/];
            });
        });
    };
    GitHubIssueManager.prototype.handleIssueClosure = function (issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            var issueKey, context;
            return __generator(this, function (_a) {
                issueKey = "".concat(repository.full_name, "#").concat(issue.number);
                context = this.issueContexts.get(issueKey);
                if (context) {
                    context.status = 'closed';
                    // Clean up resources
                    this.issueContexts.delete(issueKey);
                    this.logger.info('Issue closed', { issue: issueKey });
                }
                return [2 /*return*/];
            });
        });
    };
    GitHubIssueManager.prototype.handleIssueReopened = function (issue, repository) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Re-process the issue when reopened
                    return [4 /*yield*/, this.processNewIssue(issue, repository)];
                    case 1:
                        // Re-process the issue when reopened
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get issue context
     */
    GitHubIssueManager.prototype.getIssueContext = function (repository, issueNumber) {
        return this.issueContexts.get("".concat(repository, "#").concat(issueNumber));
    };
    /**
     * Get all active issues
     */
    GitHubIssueManager.prototype.getActiveIssues = function () {
        return Array.from(this.issueContexts.values())
            .filter(function (context) { return context.status !== 'closed'; });
    };
    /**
     * Generate issue metrics
     */
    GitHubIssueManager.prototype.generateIssueMetrics = function () {
        var contexts = Array.from(this.issueContexts.values());
        return {
            total: contexts.length,
            byStatus: this.groupByStatus(contexts),
            byType: this.groupByType(contexts),
            byPriority: this.groupByPriority(contexts),
            averageResolutionTime: this.calculateAverageResolutionTime(contexts),
            autoGeneratedCount: contexts.filter(function (c) { return c.analysis.canAutoGenerate; }).length
        };
    };
    GitHubIssueManager.prototype.groupByStatus = function (contexts) {
        return contexts.reduce(function (acc, context) {
            acc[context.status] = (acc[context.status] || 0) + 1;
            return acc;
        }, {});
    };
    GitHubIssueManager.prototype.groupByType = function (contexts) {
        return contexts.reduce(function (acc, context) {
            acc[context.analysis.type] = (acc[context.analysis.type] || 0) + 1;
            return acc;
        }, {});
    };
    GitHubIssueManager.prototype.groupByPriority = function (contexts) {
        return contexts.reduce(function (acc, context) {
            acc[context.analysis.priority] = (acc[context.analysis.priority] || 0) + 1;
            return acc;
        }, {});
    };
    GitHubIssueManager.prototype.calculateAverageResolutionTime = function (contexts) {
        var resolved = contexts.filter(function (c) { return c.status === 'resolved' || c.status === 'closed'; });
        if (resolved.length === 0)
            return 0;
        var totalTime = resolved.reduce(function (sum, context) {
            var createdAt = new Date(context.issue.created_at);
            var resolvedAt = context.issue.closed_at ? new Date(context.issue.closed_at) : new Date();
            return sum + (resolvedAt.getTime() - createdAt.getTime());
        }, 0);
        return totalTime / resolved.length / (1000 * 60 * 60 * 24); // Average days
    };
    return GitHubIssueManager;
}());
exports.GitHubIssueManager = GitHubIssueManager;
