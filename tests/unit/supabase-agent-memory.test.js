import { describe, expect, it, vi } from 'vitest';
import { SupabaseAgentMemory } from '../../lib/ai-agents/SupabaseAgentMemory.js';

const result = {
  agent: 'ProductAuditAgent',
  status: 'completed',
  risk: 'low',
  permissionLevel: 'LEVEL_0_READ_ONLY',
  dryRun: true,
  startedAt: '2026-05-02T00:00:00.000Z',
  finishedAt: '2026-05-02T00:00:01.000Z',
  output: {
    report: { type: 'ProductAuditReport', ok: true },
    suggestions: [{ title: 'Improve CTA', impact: 'high', effort: 'low', risk: 'low' }],
  },
  suggestions: [{ title: 'Improve CTA', impact: 'high', effort: 'low', risk: 'low' }],
  errors: [],
};

describe('SupabaseAgentMemory', () => {
  it('uses in-memory fallback when Supabase is not configured', async () => {
    const memory = new SupabaseAgentMemory({ env: { APP_ENV: 'test' } });
    expect(memory.available).toBe(false);
    await memory.recordExecution(result, { token: 'secret' });
    expect(memory.snapshot().executions).toHaveLength(1);
    expect(memory.snapshot().persistent).toBe(false);
  });

  it('persists execution, report and suggestions when configured', async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(new Response(JSON.stringify([{ id: 'row-1' }]), { status: 201 })));
    const memory = new SupabaseAgentMemory({
      env: { APP_ENV: 'test', SUPABASE_URL: 'https://supabase.example.com', SUPABASE_SERVICE_ROLE_KEY: 'service-role' },
      fetchImpl,
    });
    const saved = await memory.recordExecution(result, { OPENAI_API_KEY: 'must-not-leak' }, { autonomyLevel: 'LEVEL_0_READ_ONLY' });
    expect(saved.executionId).toBe('row-1');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const firstBody = fetchImpl.mock.calls[0][1].body;
    expect(firstBody).toContain('[redacted]');
    expect(firstBody).not.toContain('must-not-leak');
  });

  it('records logs and handles Supabase errors without throwing', async () => {
    const fetchImpl = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ message: 'db down' }), { status: 500 })));
    const memory = new SupabaseAgentMemory({
      env: { APP_ENV: 'test', SUPABASE_URL: 'https://supabase.example.com', SUPABASE_SERVICE_ROLE_KEY: 'service-role' },
      fetchImpl,
    });
    await expect(memory.recordLog({ agent: 'QARegressionAgent', event: 'blocked', level: 'blocked_action' })).resolves.toBeTruthy();
    expect(memory.snapshot().logs).toHaveLength(1);
  });
});
