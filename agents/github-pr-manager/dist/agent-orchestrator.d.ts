/**
 * Agent Orchestrator
 *
 * Manages multiple specialized agents, handles task distribution,
 * load balancing, health monitoring, and coordination
 */
import { EventEmitter } from 'events';
import { Logger } from '../../lib/logger';
import { AgentCapability } from './types';
export declare class AgentOrchestrator extends EventEmitter {
    private agents;
    private agentHealth;
    private taskQueue;
    private activeTasks;
    private agentLoad;
    private logger;
    private config;
    private healthCheckInterval;
    private queueProcessorInterval;
    constructor(config: any, logger: Logger);
    n: any;
    n: any; /**\n   * Register a new agent with the orchestrator\n   */
    n: any;
    registerAgent(capability: AgentCapability): Promise<void>;
}
//# sourceMappingURL=agent-orchestrator.d.ts.map