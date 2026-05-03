import { readEnv } from '../env.js';
import { AgentLogger } from './AgentLogger.js';
import { AgentMemory } from './AgentMemory.js';
import { AgentPermissions } from './AgentPermissions.js';
import { AgentRegistry } from './AgentRegistry.js';
import { AgentToolbox } from './AgentToolbox.js';
import { AgentPermissionLevel, createAgentResult } from './contracts.js';
import {
  DataIngestionAgent,
  DevAutonomyAgent,
  GrowthAgent,
  MonetizationAgent,
  ObservabilityAgent,
  PersonalizationAgent,
  PriceIntelligenceAgent,
  ProductAuditAgent,
  QARegressionAgent,
  SavingsOptimizerAgent,
  SecurityComplianceAgent,
  SupportWhatsAppAgent,
} from './agents.js';

export const SAFE_AGENT_NAMES = [
  'ProductAuditAgent',
  'PriceIntelligenceAgent',
  'SavingsOptimizerAgent',
  'PersonalizationAgent',
  'GrowthAgent',
  'SupportWhatsAppAgent',
  'DataIngestionAgent',
  'QARegressionAgent',
  'SecurityComplianceAgent',
  'ObservabilityAgent',
];

export class AgentTaskQueue {
  constructor(memory) {
    this.memory = memory;
  }

  enqueue(task) {
    return this.memory.enqueue(task);
  }
}

export class AgentScheduler {
  plannedJobs() {
    return {
      daily: ['PriceIntelligenceAgent', 'QARegressionAgent', 'ObservabilityAgent'],
      weekly: ['ProductAuditAgent', 'GrowthAgent', 'MonetizationAgent', 'SecurityComplianceAgent'],
      deploy: ['QARegressionAgent', 'SecurityComplianceAgent'],
    };
  }
}

export class AgentEvaluation {
  evaluate(result) {
    const highRisk = result.suggestions.some((item) => item.risk === 'high' || item.risk === 'critical');
    return { pass: !highRisk && result.status === 'completed', highRisk };
  }
}

export class AgentOrchestrator {
  constructor(options = {}) {
    this.env = options.env || readEnv();
    this.dryRun = options.dryRun ?? true;
    this.routes = options.routes || [];
    this.memory = options.memory || new AgentMemory();
    this.logger = options.logger || new AgentLogger({
      onLog: (entry) => this.memory.recordLog?.(entry),
    });
    this.toolbox = options.toolbox || new AgentToolbox({ prices: options.prices, routes: this.routes, env: this.env });
    this.permissions = options.permissions || new AgentPermissions({
      autonomyLevel: options.autonomyLevel || this.env.AI_AUTONOMY_LEVEL || AgentPermissionLevel.LEVEL_0_READ_ONLY,
      environment: this.env.APP_ENV,
      productionApproval: options.productionApproval || false,
      allowLevel4: options.allowLevel4 || this.env.ENABLE_AI_LEVEL4_OVERRIDE === true,
    });
    this.registry = options.registry || createDefaultRegistry();
    this.taskQueue = new AgentTaskQueue(this.memory);
    this.scheduler = new AgentScheduler();
    this.evaluation = new AgentEvaluation();
  }

  listAgents() {
    return this.registry.list();
  }

  async runAgent(name, input = {}) {
    const agent = this.registry.get(name);
    if (!agent) throw new Error(`Unknown agent: ${name}`);
    const allowed = this.permissions.canRun(agent);
    if (!allowed.ok) {
      const blocked = createAgentResult(name, { report: { type: 'BlockedAgentReport', reason: allowed.reason }, suggestions: [] }, {
        status: 'blocked',
        risk: agent.risk,
        permissionLevel: agent.permissionLevel,
        dryRun: this.dryRun,
        startedAt: new Date().toISOString(),
        errors: [allowed.reason],
      });
      await this.memory.recordExecution(blocked, input, {
        autonomyLevel: this.permissions.autonomyLevel,
        environment: this.env.APP_ENV,
      });
      return blocked;
    }
    const result = await agent.run(input, {
      env: this.env,
      dryRun: this.dryRun,
      routes: this.routes,
      toolbox: this.toolbox,
      logger: this.logger,
      taskQueue: this.taskQueue,
      evaluation: this.evaluation,
    });
    const persisted = await this.memory.recordExecution(result, input, {
      autonomyLevel: this.permissions.autonomyLevel,
      environment: this.env.APP_ENV,
    });
    return persisted;
  }

  async runAllSafeAgents(input = {}) {
    const results = [];
    for (const name of SAFE_AGENT_NAMES) {
      results.push(await this.runAgent(name, input[name] || input));
    }
    return results;
  }
}

export function createDefaultRegistry() {
  const registry = new AgentRegistry();
  [
    new ProductAuditAgent(),
    new PriceIntelligenceAgent(),
    new SavingsOptimizerAgent(),
    new PersonalizationAgent(),
    new GrowthAgent(),
    new MonetizationAgent(),
    new SupportWhatsAppAgent(),
    new DataIngestionAgent(),
    new QARegressionAgent(),
    new DevAutonomyAgent(),
    new SecurityComplianceAgent(),
    new ObservabilityAgent(),
  ].forEach((agent) => registry.register(agent));
  return registry;
}
