import { describe, expect, it } from 'vitest';
import { AgentOrchestrator, AgentPermissionLevel, AgentPermissions } from '../../lib/ai-agents/index.js';
import { MONTEVIDEO_SEED_PRICES } from '../../data/seed-prices.js';

describe('ai agents autonomy layer', () => {
  it('lists the default agents', () => {
    const orchestrator = new AgentOrchestrator({ prices: MONTEVIDEO_SEED_PRICES });
    const names = orchestrator.listAgents().map((agent) => agent.name);
    expect(names).toContain('ProductAuditAgent');
    expect(names).toContain('SecurityComplianceAgent');
    expect(names).toContain('ObservabilityAgent');
  });

  it('blocks agents above the configured autonomy level', async () => {
    const orchestrator = new AgentOrchestrator({
      prices: MONTEVIDEO_SEED_PRICES,
      autonomyLevel: AgentPermissionLevel.LEVEL_0_READ_ONLY,
    });
    const result = await orchestrator.runAgent('PriceIntelligenceAgent');
    expect(result.status).toBe('blocked');
    expect(result.errors[0]).toBe('requires_LEVEL_2_SAFE_AUTOMATION');
  });

  it('runs safe automation in dry-run mode when explicitly allowed', async () => {
    const orchestrator = new AgentOrchestrator({
      prices: MONTEVIDEO_SEED_PRICES,
      autonomyLevel: AgentPermissionLevel.LEVEL_2_SAFE_AUTOMATION,
      dryRun: true,
    });
    const result = await orchestrator.runAgent('PriceIntelligenceAgent');
    expect(result.status).toBe('completed');
    expect(result.dryRun).toBe(true);
    expect(result.output.report.type).toBe('PriceQualityReport');
  });

  it('never allows blocked dangerous actions', () => {
    const permissions = new AgentPermissions({ autonomyLevel: AgentPermissionLevel.LEVEL_4_CONTROLLED_EXECUTION });
    expect(permissions.canExecuteAction({ type: 'touch_real_payments', risk: 'low' }).ok).toBe(false);
    expect(permissions.canExecuteAction({ type: 'generate_report', risk: 'low' }).ok).toBe(true);
  });
});
