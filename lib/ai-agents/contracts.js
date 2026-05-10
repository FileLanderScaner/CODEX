export const AgentPermissionLevel = Object.freeze({
  LEVEL_0_READ_ONLY: 'LEVEL_0_READ_ONLY',
  LEVEL_1_ASSISTED: 'LEVEL_1_ASSISTED',
  LEVEL_2_STAGING_WRITE: 'LEVEL_2_STAGING_WRITE',
  LEVEL_3_LIMITED_AUTOMATION: 'LEVEL_3_LIMITED_AUTOMATION',
  LEVEL_4_HIGH_AUTONOMY: 'LEVEL_4_HIGH_AUTONOMY',
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

const PERMISSION_RANK = new Map([
  [AgentPermissionLevel.LEVEL_0_READ_ONLY, 0],
  [AgentPermissionLevel.LEVEL_1_ASSISTED, 1],
  [AgentPermissionLevel.LEVEL_1_SUGGEST, 1],
  [AgentPermissionLevel.LEVEL_2_STAGING_WRITE, 2],
  [AgentPermissionLevel.LEVEL_2_SAFE_AUTOMATION, 2],
  [AgentPermissionLevel.LEVEL_3_LIMITED_AUTOMATION, 3],
  [AgentPermissionLevel.LEVEL_3_CODE_PROPOSAL, 3],
  [AgentPermissionLevel.LEVEL_4_HIGH_AUTONOMY, 4],
  [AgentPermissionLevel.LEVEL_4_CONTROLLED_EXECUTION, 4],
]);

export function permissionRank(level) {
  return PERMISSION_RANK.has(level) ? PERMISSION_RANK.get(level) : -1;
}

export function isLevel4Permission(level) {
  return permissionRank(level) >= 4;
}

export function permissionAllows(granted, required) {
  return permissionRank(granted) >= permissionRank(required);
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
