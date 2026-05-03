export const DEFAULT_AI_AGENT_NAMES = [
  'ProductAuditAgent',
  'PriceIntelligenceAgent',
  'SavingsOptimizerAgent',
  'PersonalizationAgent',
  'GrowthAgent',
  'MonetizationAgent',
  'SupportWhatsAppAgent',
  'DataIngestionAgent',
  'QARegressionAgent',
  'DevAutonomyAgent',
  'SecurityComplianceAgent',
  'ObservabilityAgent',
];

export function getAdminAIAgentsViewModel(payload, enabled) {
  return {
    enabled,
    agents: payload?.agents?.length ? payload.agents : DEFAULT_AI_AGENT_NAMES.map((name) => ({ name, description: '', permissionLevel: 'unknown', risk: 'unknown' })),
    executions: payload?.executions || [],
    suggestions: payload?.suggestions || [],
    results: payload?.results || [],
    memory: payload?.memory || {},
    runtime: payload?.runtime || {},
    flags: payload?.enabled || {},
  };
}
