"use strict";
/**
 * Task Delegator
 *
 * Manages task delegation to specialized agents and coordinates their execution
 */
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
exports.TaskDelegator = void 0;
var TaskDelegator = /** @class */ (function () {
    function TaskDelegator(orchestrator, logger) {
        this.taskTimeouts = new Map();
        this.orchestrator = orchestrator;
        this.logger = logger;
    }
    /**
     * Delegate a single task to appropriate agent
     */
    TaskDelegator.prototype.delegateTask = function (task, context) {
        return __awaiter(this, void 0, void 0, function () {
            var timeoutPromise, resultPromise, result, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info('Delegating task', {
                            taskId: task.id,
                            type: task.type,
                            agentType: task.agentType,
                            priority: task.priority
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        timeoutPromise = new Promise(function (_, reject) {
                            var timeout = setTimeout(function () {
                                reject(new Error("Task ".concat(task.id, " timed out after ").concat(task.timeout, "ms")));
                            }, task.timeout);
                            _this.taskTimeouts.set(task.id, timeout);
                        });
                        resultPromise = this.orchestrator.executeTask(task);
                        return [4 /*yield*/, Promise.race([resultPromise, timeoutPromise])];
                    case 2:
                        result = _a.sent();
                        // Clear timeout
                        this.clearTaskTimeout(task.id);
                        this.logger.info('Task completed', {
                            taskId: task.id,
                            status: result.status,
                            duration: result.completedAt && result.startedAt ?
                                result.completedAt.getTime() - result.startedAt.getTime() : null
                        });
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _a.sent();
                        this.clearTaskTimeout(task.id);
                        this.logger.error('Task delegation failed', {
                            taskId: task.id,
                            error: error_1 instanceof Error ? error_1.message : String(error_1)
                        });
                        return [2 /*return*/, {
                                task: task,
                                status: 'failed',
                                error: error_1 instanceof Error ? error_1 : new Error(String(error_1)),
                                completedAt: new Date()
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delegate multiple tasks concurrently
     */
    TaskDelegator.prototype.delegateTasks = function (tasks, context) {
        return __awaiter(this, void 0, void 0, function () {
            var tasksByPriority, results, _loop_1, this_1, _i, _a, priorityGroup, state_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.logger.info('Delegating batch of tasks', {
                            taskCount: tasks.length,
                            taskTypes: __spreadArray([], new Set(tasks.map(function (t) { return t.type; })), true),
                            pr: "".concat(context.repository.full_name, "#").concat(context.pr.number)
                        });
                        tasksByPriority = this.groupTasksByPriority(tasks);
                        results = [];
                        _loop_1 = function (priorityGroup) {
                            var priorityTasks, priorityResults, criticalFailures;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        priorityTasks = tasksByPriority[priorityGroup] || [];
                                        if (priorityTasks.length === 0)
                                            return [2 /*return*/, "continue"];
                                        this_1.logger.info('Executing priority group', {
                                            priority: priorityGroup,
                                            taskCount: priorityTasks.length
                                        });
                                        return [4 /*yield*/, Promise.allSettled(priorityTasks.map(function (task) { return _this.delegateTask(task, context); }))];
                                    case 1:
                                        priorityResults = _c.sent();
                                        // Process results
                                        priorityResults.forEach(function (result, index) {
                                            if (result.status === 'fulfilled') {
                                                results.push(result.value);
                                            }
                                            else {
                                                // Create failed result
                                                results.push({
                                                    task: priorityTasks[index],
                                                    status: 'failed',
                                                    error: result.reason,
                                                    completedAt: new Date()
                                                });
                                            }
                                        });
                                        criticalFailures = results
                                            .filter(function (r) { return r.task.priority === 'critical' && r.status === 'failed'; });
                                        if (criticalFailures.length > 0) {
                                            this_1.logger.warn('Critical task failures detected, halting execution', {
                                                failedTasks: criticalFailures.map(function (r) { return r.task.id; })
                                            });
                                            return [2 /*return*/, "break"];
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, _a = ['critical', 'high', 'medium', 'low'];
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        priorityGroup = _a[_i];
                        return [5 /*yield**/, _loop_1(priorityGroup)];
                    case 2:
                        state_1 = _b.sent();
                        if (state_1 === "break")
                            return [3 /*break*/, 4];
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        this.logger.info('Task delegation batch completed', {
                            totalTasks: tasks.length,
                            completedTasks: results.filter(function (r) { return r.status === 'completed'; }).length,
                            failedTasks: results.filter(function (r) { return r.status === 'failed'; }).length
                        });
                        return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Cancel a delegated task
     */
    TaskDelegator.prototype.cancelTask = function (taskId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.clearTaskTimeout(taskId);
                        return [4 /*yield*/, this.orchestrator.cancelTask(taskId)];
                    case 1:
                        _a.sent();
                        this.logger.info('Task cancelled', { taskId: taskId });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Pause delegated tasks
     */
    TaskDelegator.prototype.pauseTasks = function (taskIds) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.orchestrator.pauseTasks(taskIds)];
                    case 1:
                        _a.sent();
                        // Clear timeouts for paused tasks
                        taskIds.forEach(function (taskId) { return _this.clearTaskTimeout(taskId); });
                        this.logger.info('Tasks paused', { taskIds: taskIds });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retry a failed task
     */
    TaskDelegator.prototype.retryTask = function (task, context) {
        return __awaiter(this, void 0, void 0, function () {
            var retryTask;
            return __generator(this, function (_a) {
                this.logger.info('Retrying task', {
                    taskId: task.id,
                    attempt: (task.retries || 0) + 1
                });
                retryTask = __assign(__assign({}, task), { id: "".concat(task.id, "-retry-").concat(Date.now()), retries: Math.max(0, task.retries - 1) });
                return [2 /*return*/, this.delegateTask(retryTask, context)];
            });
        });
    };
    /**
     * Get task delegation statistics
     */
    TaskDelegator.prototype.getDelegationStats = function () {
        return this.orchestrator.getSystemStatus();
    };
    /**
     * Group tasks by priority level
     */
    TaskDelegator.prototype.groupTasksByPriority = function (tasks) {
        return tasks.reduce(function (groups, task) {
            var priority = task.priority;
            if (!groups[priority]) {
                groups[priority] = [];
            }
            groups[priority].push(task);
            return groups;
        }, {});
    };
    /**
     * Clear task timeout
     */
    TaskDelegator.prototype.clearTaskTimeout = function (taskId) {
        var timeout = this.taskTimeouts.get(taskId);
        if (timeout) {
            clearTimeout(timeout);
            this.taskTimeouts.delete(taskId);
        }
    };
    /**
     * Cleanup resources
     */
    TaskDelegator.prototype.destroy = function () {
        // Clear all timeouts
        this.taskTimeouts.forEach(function (timeout) { return clearTimeout(timeout); });
        this.taskTimeouts.clear();
    };
    return TaskDelegator;
}());
exports.TaskDelegator = TaskDelegator;
