/**
 * Task Delegator
 *
 * Manages task delegation to specialized agents and coordinates their execution
 */
import { Logger } from '../../lib/logger';
import { AgentOrchestrator } from './agent-orchestrator';
import { AgentTask, TaskResult, PRContext } from './types';
export declare class TaskDelegator {
    private orchestrator;
    private logger;
    private taskTimeouts;
    constructor(orchestrator: AgentOrchestrator, logger: Logger);
    /**
     * Delegate a single task to appropriate agent
     */
    delegateTask(task: AgentTask, context: PRContext): Promise<TaskResult>;
    /**
     * Delegate multiple tasks concurrently
     */
    delegateTasks(tasks: AgentTask[], context: PRContext): Promise<TaskResult[]>;
    /**
     * Cancel a delegated task
     */
    cancelTask(taskId: string): Promise<void>;
    /**
     * Pause delegated tasks
     */
    pauseTasks(taskIds: string[]): Promise<void>;
    /**
     * Retry a failed task
     */
    retryTask(task: AgentTask, context: PRContext): Promise<TaskResult>;
    /**
     * Get task delegation statistics
     */
    getDelegationStats(): any;
    /**
     * Group tasks by priority level
     */
    private groupTasksByPriority;
    /**
     * Clear task timeout
     */
    private clearTaskTimeout;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
//# sourceMappingURL=task-delegator.d.ts.map