import { describe, expect, it } from 'vitest';
import { getAdminAIAgentsViewModel } from '../../screens/admin-ai-agents-view-model.js';

describe('AdminAIAgentsScreen view model', () => {
  it('renders blocked state data without API payload', () => {
    const vm = getAdminAIAgentsViewModel(null, false);
    expect(vm.enabled).toBe(false);
    expect(vm.agents.length).toBeGreaterThan(0);
    expect(vm.memory).toEqual({});
  });

  it('uses API payload for agents, history and suggestions', () => {
    const vm = getAdminAIAgentsViewModel({
      agents: [{ name: 'ProductAuditAgent', permissionLevel: 'LEVEL_0_READ_ONLY', risk: 'low' }],
      executions: [{ id: 'exec-1' }],
      suggestions: [{ id: 'suggestion-1' }],
      memory: { persistent: true },
      runtime: { provider: 'mock' },
    }, true);
    expect(vm.enabled).toBe(true);
    expect(vm.agents[0].name).toBe('ProductAuditAgent');
    expect(vm.executions).toHaveLength(1);
    expect(vm.suggestions).toHaveLength(1);
    expect(vm.memory.persistent).toBe(true);
  });
});
