import { AgentMemory } from './AgentMemory.js';

function compactJSON(value, maxChars = 6000) {
  if (value === undefined) return {};
  const text = JSON.stringify(value, (_key, nested) => {
    if (/secret|token|key|password|credential/i.test(_key)) return '[redacted]';
    if (typeof nested === 'string' && nested.length > 1000) return `${nested.slice(0, 1000)}...`;
    return nested;
  });
  if (!text) return {};
  if (text.length > maxChars) {
    return { truncated: true, preview: text.slice(0, maxChars) };
  }
  return JSON.parse(text);
}

function arrayify(value) {
  return Array.isArray(value) ? value : [];
}

export class SupabaseAgentMemory extends AgentMemory {
  constructor({ env, fetchImpl = globalThis.fetch, fallback } = {}) {
    super();
    this.env = env || {};
    this.fetchImpl = fetchImpl;
    this.fallback = fallback || new AgentMemory();
    this.available = Boolean(this.env.SUPABASE_URL && this.env.SUPABASE_SERVICE_ROLE_KEY && this.fetchImpl);
    this.warning = this.available ? null : 'Supabase agent memory unavailable; using in-memory fallback.';
  }

  async rest(path, options = {}) {
    if (!this.available) throw new Error(this.warning);
    const response = await this.fetchImpl(`${this.env.SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: this.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || data?.hint || `Supabase agent memory failed (${response.status})`);
    }
    return data;
  }

  async recordExecution(result, input = {}, context = {}) {
    this.fallback.recordExecution(result);
    if (!this.available) return result;
    try {
      const rows = await this.rest('agent_executions', {
        method: 'POST',
        body: JSON.stringify({
          agent_name: result.agent,
          input_summary: compactJSON(input),
          output_summary: compactJSON(result.output),
          status: result.status,
          risk: result.risk,
          permission_level: result.permissionLevel,
          autonomy_level: context.autonomyLevel || result.permissionLevel,
          environment: context.environment || this.env.APP_ENV || 'local',
          dry_run: Boolean(result.dryRun),
          applied: false,
          app_version: context.appVersion || '1.0.0',
          error_message: arrayify(result.errors).join('; ') || null,
          started_at: result.startedAt,
          finished_at: result.finishedAt,
        }),
      });
      const execution = rows?.[0] || null;
      await Promise.all([
        this.recordReport(result, execution?.id, context),
        this.recordSuggestions(result, execution?.id, context),
      ]);
      return { ...result, executionId: execution?.id || result.executionId };
    } catch (error) {
      this.fallback.recordLog({
        agent: result.agent,
        level: 'warn',
        event: 'supabase_memory_fallback',
        metadata: { error: error.message },
        createdAt: new Date().toISOString(),
      });
      return result;
    }
  }

  async recordReport(result, executionId, context = {}) {
    const report = result.output?.report;
    if (!report || !this.available) return null;
    const rows = await this.rest('agent_reports', {
      method: 'POST',
      body: JSON.stringify({
        execution_id: executionId || null,
        agent_name: result.agent,
        report_type: report.type || `${result.agent}Report`,
        content: compactJSON(report),
        summary: compactJSON({ type: report.type, suggestions: result.suggestions?.length || 0 }),
        severity: result.risk === 'critical' ? 'critical' : result.risk === 'high' ? 'high' : result.risk === 'medium' ? 'medium' : 'low',
        recommendations: compactJSON(result.suggestions || []),
        risk: result.risk,
        environment: context.environment || this.env.APP_ENV || 'local',
      }),
    });
    return rows?.[0] || null;
  }

  async recordSuggestions(result, executionId, context = {}) {
    if (!this.available || !Array.isArray(result.suggestions) || !result.suggestions.length) return [];
    const payload = result.suggestions.map((item) => ({
      agent_name: result.agent,
      title: item.title,
      description: item.description || item.action || null,
      impact: item.impact || 'medium',
      effort: item.effort || 'medium',
      risk: item.risk || 'low',
      status: item.status || 'pending',
      payload: compactJSON({ ...item, execution_id: executionId || null }),
      environment: context.environment || this.env.APP_ENV || 'local',
      applied: false,
    }));
    return this.rest('agent_suggestions', { method: 'POST', body: JSON.stringify(payload) });
  }

  async recordLog(entry) {
    this.fallback.recordLog(entry);
    if (!this.available) return entry;
    try {
      const rows = await this.rest('agent_logs', {
        method: 'POST',
        body: JSON.stringify({
          execution_id: entry.executionId || null,
          agent_name: entry.agent || entry.agent_name || 'AgentOrchestrator',
          level: entry.level || 'info',
          event: entry.event,
          metadata: compactJSON(entry.metadata || {}),
          environment: this.env.APP_ENV || 'local',
        }),
      });
      return rows?.[0] || entry;
    } catch {
      return entry;
    }
  }

  async updateSuggestion(id, status, metadata = {}) {
    this.fallback.updateSuggestion(id, status, metadata);
    if (!this.available) return null;
    const rows = await this.rest(`agent_suggestions?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        reviewed_at: new Date().toISOString(),
        error_message: metadata.errorMessage || metadata.reason || null,
        applied: status === 'applied',
      }),
    });
    return rows?.[0] || null;
  }

  async listExecutions(limit = 25) {
    if (!this.available) return this.fallback.listExecutions(limit);
    return this.rest(`agent_executions?select=*&order=started_at.desc&limit=${limit}`);
  }

  async listLogs(limit = 50) {
    if (!this.available) return this.fallback.listLogs(limit);
    return this.rest(`agent_logs?select=*&order=created_at.desc&limit=${limit}`);
  }

  async listPendingSuggestions(limit = 50, status = 'pending') {
    if (!this.available) return this.fallback.listPendingSuggestions(limit, status);
    const filter = status ? `status=eq.${encodeURIComponent(status)}` : 'status=in.(pending,proposed)';
    return this.rest(`agent_suggestions?select=*&${filter}&order=created_at.desc&limit=${limit}`);
  }

  async latestReports(limit = 25) {
    if (!this.available) return this.fallback.reports.slice(0, limit);
    return this.rest(`agent_reports?select=*&order=created_at.desc&limit=${limit}`);
  }

  snapshot() {
    return {
      ...this.fallback.snapshot(),
      persistent: this.available,
      warning: this.warning,
    };
  }
}

export function createAgentMemoryForEnv(env, options = {}) {
  const memory = new SupabaseAgentMemory({ env, ...options });
  return memory.available ? memory : memory;
}
