import { AgentPermissionLevel, AgentRiskLevel, createAgentResult } from './contracts.js';

export class BaseAgent {
  constructor({ name, description, permissionLevel = AgentPermissionLevel.LEVEL_0_READ_ONLY, risk = AgentRiskLevel.LOW } = {}) {
    this.name = name;
    this.description = description;
    this.permissionLevel = permissionLevel;
    this.risk = risk;
  }

  async analyze() {
    throw new Error(`${this.name} must implement analyze()`);
  }

  async run(input = {}, context = {}) {
    const startedAt = new Date().toISOString();
    context.logger?.log(this.name, 'started', { dryRun: context.dryRun, inputKeys: Object.keys(input || {}) });
    const output = await this.analyze(input, context);
    const result = createAgentResult(this.name, output, {
      risk: this.risk,
      permissionLevel: this.permissionLevel,
      dryRun: context.dryRun,
      startedAt,
    });
    context.logger?.log(this.name, 'completed', { status: result.status, suggestions: result.suggestions.length });
    return result;
  }
}
