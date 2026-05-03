import { z } from 'zod';
import { AgentOrchestrator, createAgentMemoryForEnv } from '../../../lib/ai-agents/index.js';
import { readEnv } from '../../../lib/env.js';
import { json, requireRole, runEndpoint, validate } from './_utils.js';

const schema = z.object({
  action: z.enum([
    'list',
    'run',
    'runAllSafe',
    'history',
    'suggestions',
    'pendingSuggestions',
    'logs',
    'reports',
    'approveSuggestion',
    'rejectSuggestion',
  ]).default('list'),
  agent: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional().default({}),
  dryRun: z.coerce.boolean().optional().default(true),
  suggestionId: z.string().uuid().optional(),
  status: z.enum(['pending', 'proposed', 'approved', 'rejected', 'applied', 'failed', 'blocked']).optional().default('pending'),
  reason: z.string().trim().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

const ROUTES = ['/app', '/app/buscar', '/app/alertas', '/app/favoritos', '/app/perfil', '/app/premium', '/app/productos/:product', '/app/qr', '/app/escanear', '/app/supermercados', '/app/configuracion', '/app/historial', '/admin/ai-agents'];

function bodyFromGet(req) {
  return {
    action: req.query?.action || 'list',
    agent: req.query?.agent,
    suggestionId: req.query?.suggestionId,
    status: req.query?.status,
    reason: req.query?.reason,
    limit: req.query?.limit,
    dryRun: true,
    input: {},
  };
}

export default function aiAgents(req, res) {
  return runEndpoint(req, res, ['GET', 'POST'], 'ai-agents', async (_req, _res, reqId) => {
    const env = readEnv();
    if (env.ENABLE_ADMIN_AI_PANEL !== true) {
      return json(res, 403, { error: 'admin_ai_panel_disabled' }, reqId);
    }
    await requireRole(req, ['admin', 'internal_job']);

    const body = validate(schema, req.method === 'GET' ? bodyFromGet(req) : req.body);
    const memory = createAgentMemoryForEnv(env);
    const orchestrator = new AgentOrchestrator({
      env,
      dryRun: body.dryRun !== false,
      routes: ROUTES,
      autonomyLevel: env.AI_AUTONOMY_LEVEL,
      memory,
    });

    if (body.action === 'list') {
      return json(res, 200, {
        data: {
          agents: orchestrator.listAgents(),
          scheduler: orchestrator.scheduler.plannedJobs(),
          memory: orchestrator.memory.snapshot(),
          enabled: {
            aiAgents: env.ENABLE_AI_AGENTS,
            adminPanel: env.ENABLE_ADMIN_AI_PANEL,
            scheduler: env.ENABLE_AGENT_SCHEDULER,
            level4Override: env.ENABLE_AI_LEVEL4_OVERRIDE,
          },
          runtime: {
            provider: env.AI_PROVIDER,
            autonomyLevel: env.AI_AUTONOMY_LEVEL,
            dryRunDefault: true,
          },
        },
      }, reqId);
    }

    if (body.action === 'history') {
      return json(res, 200, { data: { executions: await memory.listExecutions(body.limit) } }, reqId);
    }

    if (body.action === 'pendingSuggestions' || body.action === 'suggestions') {
      return json(res, 200, { data: { suggestions: await memory.listPendingSuggestions(body.limit, body.status) } }, reqId);
    }

    if (body.action === 'logs') {
      return json(res, 200, { data: { logs: await memory.listLogs(body.limit) } }, reqId);
    }

    if (body.action === 'reports') {
      return json(res, 200, { data: { reports: await memory.latestReports?.(body.limit) || [] } }, reqId);
    }

    if (body.action === 'approveSuggestion' || body.action === 'rejectSuggestion') {
      if (!body.suggestionId) {
        return json(res, 400, { error: 'suggestionId_required' }, reqId);
      }
      const status = body.action === 'approveSuggestion' ? 'approved' : 'rejected';
      const suggestion = await memory.updateSuggestion(body.suggestionId, status, { reason: body.reason });
      return json(res, 200, { data: { suggestion, status } }, reqId);
    }

    if (env.ENABLE_AI_AGENTS !== true) {
      return json(res, 403, { error: 'ai_agents_disabled' }, reqId);
    }

    if (env.APP_ENV === 'production' && body.dryRun === false) {
      return json(res, 403, { error: 'real_execution_blocked_in_production' }, reqId);
    }

    if (env.AI_AUTONOMY_LEVEL === 'LEVEL_4_CONTROLLED_EXECUTION' && env.ENABLE_AI_LEVEL4_OVERRIDE !== true) {
      return json(res, 403, { error: 'level_4_blocked_by_default' }, reqId);
    }

    if (body.action === 'runAllSafe') {
      const results = await orchestrator.runAllSafeAgents(body.input);
      return json(res, 200, { data: { results, memory: orchestrator.memory.snapshot() } }, reqId);
    }

    if (!body.agent) {
      return json(res, 400, { error: 'agent_required' }, reqId);
    }
    const result = await orchestrator.runAgent(body.agent, body.input);
    return json(res, 200, { data: { result, memory: orchestrator.memory.snapshot() } }, reqId);
  });
}
