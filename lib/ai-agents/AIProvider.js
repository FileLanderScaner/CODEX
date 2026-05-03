export class MockAIProvider {
  constructor() {
    this.name = 'mock';
  }

  async generateJSON(prompt, context = {}) {
    return {
      provider: this.name,
      prompt,
      contextKeys: Object.keys(context),
      warning: 'Mock provider activo: no consume tokens ni llama servicios externos.',
    };
  }
}

export function createAIProvider(env = process.env) {
  if (env.OPENAI_API_KEY) {
    return { name: 'openai', configured: true };
  }
  if (env.GEMINI_API_KEY) {
    return { name: 'gemini', configured: true };
  }
  return new MockAIProvider();
}
