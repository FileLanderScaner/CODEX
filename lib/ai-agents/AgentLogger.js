export class AgentLogger {
  constructor({ sink = [], onLog = null } = {}) {
    this.sink = sink;
    this.onLog = onLog;
  }

  log(agent, event, metadata = {}, level = 'info') {
    const entry = {
      id: `agent-log-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      agent,
      level,
      event,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.sink.push(entry);
    if (this.onLog) {
      Promise.resolve(this.onLog(entry)).catch(() => null);
    }
    return entry;
  }

  list() {
    return [...this.sink];
  }
}
