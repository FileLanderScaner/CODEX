export const AgentPermissionLevel = Object.freeze({
  LEVEL_0_READ_ONLY: 'LEVEL_0_READ_ONLY',
  LEVEL_1_SUGGEST: 'LEVEL_1_SUGGEST',
  LEVEL_2_SAFE_AUTOMATION: 'LEVEL_2_SAFE_AUTOMATION',
  LEVEL_3_CODE_PROPOSAL: 'LEVEL_3_CODE_PROPOSAL',
  LEVEL_4_CONTROLLED_EXECUTION: 'LEVEL_4_CONTROLLED_EXECUTION',
});

export const AgentRiskLevel = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

export const AGENT_PERMISSION_ORDER = [
  AgentPermissionLevel.LEVEL_0_READ_ONLY,
  AgentPermissionLevel.LEVEL_1_SUGGEST,
  AgentPermissionLevel.LEVEL_2_SAFE_AUTOMATION,
  AgentPermissionLevel.LEVEL_3_CODE_PROPOSAL,
  AgentPermissionLevel.LEVEL_4_CONTROLLED_EXECUTION,
];

export function permissionAllows(granted, required) {
  return AGENT_PERMISSION_ORDER.indexOf(granted) >= AGENT_PERMISSION_ORDER.indexOf(required);
}

export function createAgentResult(agentName, output, options = {}) {
  return {
    agent: agentName,
    status: options.status || 'completed',
    risk: options.risk || AgentRiskLevel.LOW,
    permissionLevel: options.permissionLevel || AgentPermissionLevel.LEVEL_0_READ_ONLY,
    dryRun: Boolean(options.dryRun),
    startedAt: options.startedAt,
    finishedAt: new Date().toISOString(),
    output,
    errors: options.errors || [],
    suggestions: output?.suggestions || [],
  };
}
