export class AgentMemory {
  constructor({ maxEntries = 500 } = {}) {
    this.maxEntries = maxEntries;
    this.executions = [];
    this.reports = [];
    this.suggestions = [];
    this.tasks = [];
  }

  recordExecution(result) {
    this.executions = [result, ...this.executions].slice(0, this.maxEntries);
    if (result.output?.report) {
      this.reports = [result.output.report, ...this.reports].slice(0, this.maxEntries);
    }
    if (Array.isArray(result.suggestions)) {
      this.suggestions = [...result.suggestions, ...this.suggestions].slice(0, this.maxEntries);
    }
    return result;
  }

  recordLog(entry) {
    this.logs = [entry, ...(this.logs || [])].slice(0, this.maxEntries);
    return entry;
  }

  updateSuggestion(id, status, metadata = {}) {
    this.suggestions = this.suggestions.map((suggestion) => (
      suggestion.id === id ? { ...suggestion, status, ...metadata } : suggestion
    ));
    return this.suggestions.find((suggestion) => suggestion.id === id) || null;
  }

  listExecutions(limit = 25) {
    return this.executions.slice(0, limit);
  }

  listLogs(limit = 50) {
    return (this.logs || []).slice(0, limit);
  }

  listPendingSuggestions(limit = 50, status = 'pending') {
    const allowed = new Set([status, 'proposed']);
    return this.suggestions
      .filter((item) => !item.status || allowed.has(item.status))
      .slice(0, limit);
  }

  enqueue(task) {
    const next = {
      id: task.id || `agent-task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      status: 'queued',
      createdAt: new Date().toISOString(),
      ...task,
    };
    this.tasks.push(next);
    return next;
  }

  snapshot() {
    return {
      executions: [...this.executions],
      reports: [...this.reports],
      suggestions: [...this.suggestions],
      logs: [...(this.logs || [])],
      tasks: [...this.tasks],
    };
  }
}
