export class AgentRegistry {
  constructor() {
    this.agents = new Map();
  }

  register(agent) {
    if (!agent?.name) throw new Error('Agent must have a name');
    this.agents.set(agent.name, agent);
    return agent;
  }

  get(name) {
    return this.agents.get(name);
  }

  list() {
    return [...this.agents.values()].map((agent) => ({
      name: agent.name,
      description: agent.description,
      permissionLevel: agent.permissionLevel,
      risk: agent.risk,
    }));
  }
}
