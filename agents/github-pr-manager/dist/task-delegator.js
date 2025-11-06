"use strict";
/**
 * Task Delegator
 *
 * Manages task delegation to specialized agents and coordinates their execution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskDelegator = void 0;
class TaskDelegator {
    orchestrator;
    logger;
    taskTimeouts = new Map();
    constructor(orchestrator, logger) {
        this.orchestrator = orchestrator;
        this.logger = logger;
    }
    /**
     * Delegate a single task to appropriate agent
     */
    async delegateTask(task, context) {
        this.logger.info('Delegating task', {
            taskId: task.id,
            type: task.type,
            agentType: task.agentType,
            priority: task.priority
        });
        try {
            // Set timeout for task
            const timeoutPromise = new Promise((_, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Task ${task.id} timed out after ${task.timeout}ms`));
                }, task.timeout);
                this.taskTimeouts.set(task.id, timeout);
            });
            // Execute task with timeout
            const resultPromise = this.orchestrator.executeTask(task);
            const result = await Promise.race([resultPromise, timeoutPromise]);
            // Clear timeout
            this.clearTaskTimeout(task.id);
            this.logger.info('Task completed', {
                taskId: task.id,
                status: result.status,
                duration: result.completedAt && result.startedAt ?
                    result.completedAt.getTime() - result.startedAt.getTime() : null
            });
            return result;
        }
        catch (error) {
            this.clearTaskTimeout(task.id);
            this.logger.error('Task delegation failed', {
                taskId: task.id,
                error: error instanceof Error ? error.message : String(error)
            });
            return {
                task,
                status: 'failed',
                error: error instanceof Error ? error : new Error(String(error)),
                completedAt: new Date()
            };
        }
    }
    /**
     * Delegate multiple tasks concurrently
     */
    async delegateTasks(tasks, context) {
        this.logger.info('Delegating batch of tasks', {
            taskCount: tasks.length,
            taskTypes: [...new Set(tasks.map(t => t.type))],
            pr: `${context.repository.full_name}#${context.pr.number}`
        });
        // Group tasks by priority for execution order
        const tasksByPriority = this.groupTasksByPriority(tasks);
        const results = [];
        // Execute critical and high priority tasks first
        for (const priorityGroup of ['critical', 'high', 'medium', 'low']) {
            const priorityTasks = tasksByPriority[priorityGroup] || [];
            if (priorityTasks.length === 0)
                continue;
            this.logger.info('Executing priority group', {
                priority: priorityGroup,
                taskCount: priorityTasks.length
            });
            // Execute tasks in this priority group concurrently
            const priorityResults = await Promise.allSettled(priorityTasks.map(task => this.delegateTask(task, context)));
            // Process results
            priorityResults.forEach((result, index) => {
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
            // Check if any critical failures should halt execution
            const criticalFailures = results
                .filter(r => r.task.priority === 'critical' && r.status === 'failed');
            if (criticalFailures.length > 0) {
                this.logger.warn('Critical task failures detected, halting execution', {
                    failedTasks: criticalFailures.map(r => r.task.id)
                });
                break;
            }
        }
        this.logger.info('Task delegation batch completed', {
            totalTasks: tasks.length,
            completedTasks: results.filter(r => r.status === 'completed').length,
            failedTasks: results.filter(r => r.status === 'failed').length
        });
        return results;
    }
    /**
     * Cancel a delegated task
     */
    async cancelTask(taskId) {
        this.clearTaskTimeout(taskId);
        await this.orchestrator.cancelTask(taskId);
        this.logger.info('Task cancelled', { taskId });
    }
    /**
     * Pause delegated tasks
     */
    async pauseTasks(taskIds) {
        await this.orchestrator.pauseTasks(taskIds);
        // Clear timeouts for paused tasks
        taskIds.forEach(taskId => this.clearTaskTimeout(taskId));
        this.logger.info('Tasks paused', { taskIds });
    }
    /**
     * Retry a failed task
     */
    async retryTask(task, context) {
        this.logger.info('Retrying task', {
            taskId: task.id,
            attempt: (task.retries || 0) + 1
        });
        // Create new task with updated retry count
        const retryTask = {
            ...task,
            id: `${task.id}-retry-${Date.now()}`,
            retries: Math.max(0, task.retries - 1)
        };
        return this.delegateTask(retryTask, context);
    }
    /**
     * Get task delegation statistics
     */
    getDelegationStats() {
        return this.orchestrator.getSystemStatus();
    }
    /**
     * Group tasks by priority level
     */
    groupTasksByPriority(tasks) {
        return tasks.reduce((groups, task) => {
            const priority = task.priority;
            if (!groups[priority]) {
                groups[priority] = [];
            }
            groups[priority].push(task);
            return groups;
        }, {});
    }
    /**
     * Clear task timeout
     */
    clearTaskTimeout(taskId) {
        const timeout = this.taskTimeouts.get(taskId);
        if (timeout) {
            clearTimeout(timeout);
            this.taskTimeouts.delete(taskId);
        }
    }
    /**
     * Cleanup resources
     */
    destroy() {
        // Clear all timeouts
        this.taskTimeouts.forEach(timeout => clearTimeout(timeout));
        this.taskTimeouts.clear();
    }
}
exports.TaskDelegator = TaskDelegator;
//# sourceMappingURL=task-delegator.js.map