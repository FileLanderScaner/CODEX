import { generateText, Output } from 'ai';

const SENSITIVE_KEY_PATTERN = /secret|token|key|password|credential|authorization|db_url|database_url|postgres|connection_string|dsn/i;
const SENSITIVE_VALUE_PATTERNS = [
  /Bearer\s+[A-Za-z0-9._-]+/g,
  /vck_[A-Za-z0-9._-]+/g,
  /vercel_[A-Za-z0-9._-]+/g,
  /sk-[A-Za-z0-9._-]+/g,
  /postgres(?:ql)?:\/\/[^\s"'`]+/g,
];

function redactString(value) {
  return SENSITIVE_VALUE_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, '[REDACTED]'),
    value,
  );
}

function redact(value) {
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (typeof value === 'string') return redactString(value);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [
    key,
    SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : redact(nested),
  ]));
}

function tryParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

function boolEnabled(value) {
  return value === true || String(value || '').toLowerCase() === 'true';
}

function hasGatewayAuth(env) {
  return Boolean(env.VERCEL_OIDC_TOKEN || env.AI_GATEWAY_API_KEY);
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return redactString(message);
}

export class AIProviderError extends Error {
  constructor(message, { provider, status, cause } = {}) {
    super(message);
    this.name = 'AIProviderError';
    this.provider = provider;
    this.status = status;
    this.cause = cause;
  }
}

export class InMemoryRateLimiter {
  constructor({ limit = 20, windowMs = 60_000 } = {}) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.buckets = new Map();
  }

  check(key) {
    const now = Date.now();
    const bucket = `${key}:${Math.floor(now / this.windowMs)}`;
    const current = this.buckets.get(bucket) || 0;
    this.buckets.set(bucket, current + 1);
    return { ok: current + 1 <= this.limit, current: current + 1, limit: this.limit };
  }
}

export class BaseAIProvider {
  constructor({ name, env = {}, fetchImpl = globalThis.fetch, logger, rateLimiter } = {}) {
    this.name = name;
    this.env = env;
    this.fetchImpl = fetchImpl;
    this.logger = logger;
    this.rateLimiter = rateLimiter || new InMemoryRateLimiter();
  }

  log(event, metadata = {}) {
    this.logger?.recordLog?.({
      agent: 'AIProvider',
      level: event === 'error' ? 'error' : 'info',
      event: `ai_provider_${event}`,
      metadata: redact({ provider: this.name, ...metadata }),
      createdAt: new Date().toISOString(),
    });
  }

  assertRateLimit() {
    const allowed = this.rateLimiter.check(this.name);
    if (!allowed.ok) {
      this.log('rate_limited', allowed);
      throw new AIProviderError('AI provider rate limit exceeded', { provider: this.name, status: 429 });
    }
  }
}

export class MockAIProvider extends BaseAIProvider {
  constructor(options = {}) {
    super({ ...options, name: 'mock' });
    this.configured = true;
  }

  async generateJSON(prompt, context = {}) {
    this.assertRateLimit();
    this.log('request', { contextKeys: Object.keys(context) });
    return {
      provider: this.name,
      prompt,
      contextKeys: Object.keys(context),
      warning: 'Mock provider activo: no consume tokens ni llama servicios externos.',
    };
  }
}

export class OpenAIProvider extends BaseAIProvider {
  constructor(options = {}) {
    super({ ...options, name: 'openai' });
    this.configured = Boolean(this.env.OPENAI_API_KEY);
    this.model = this.env.OPENAI_MODEL || 'gpt-4.1-mini';
  }

  async generateJSON(prompt, context = {}) {
    if (!this.configured) throw new AIProviderError('OPENAI_API_KEY is missing', { provider: this.name });
    this.assertRateLimit();
    this.log('request', { model: this.model, contextKeys: Object.keys(context) });
    const response = await this.fetchImpl('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          { role: 'system', content: 'Return only valid JSON. Do not include secrets or credentials.' },
          { role: 'user', content: JSON.stringify({ prompt, context: redact(context) }) },
        ],
        text: { format: { type: 'json_object' } },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      this.log('error', { status: response.status, error: data?.error?.message || data?.message });
      throw new AIProviderError('OpenAI request failed', { provider: this.name, status: response.status });
    }
    const text = data.output_text || data.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text || '{}';
    return { provider: this.name, model: this.model, data: tryParseJSON(text) };
  }
}

export class GeminiProvider extends BaseAIProvider {
  constructor(options = {}) {
    super({ ...options, name: 'gemini' });
    this.configured = Boolean(this.env.GEMINI_API_KEY);
    this.model = this.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  async generateJSON(prompt, context = {}) {
    if (!this.configured) throw new AIProviderError('GEMINI_API_KEY is missing', { provider: this.name });
    this.assertRateLimit();
    this.log('request', { model: this.model, contextKeys: Object.keys(context) });
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.env.GEMINI_API_KEY)}`;
    const response = await this.fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `Return only valid JSON. Do not include secrets.\n${JSON.stringify({ prompt, context: redact(context) })}` }],
        }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      this.log('error', { status: response.status, error: data?.error?.message || data?.message });
      throw new AIProviderError('Gemini request failed', { provider: this.name, status: response.status });
    }
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '{}';
    return { provider: this.name, model: this.model, data: tryParseJSON(text) };
  }
}

export class VercelGatewayProvider extends BaseAIProvider {
  constructor(options = {}) {
    super({ ...options, name: 'vercel_gateway' });
    this.enabled = boolEnabled(this.env.AI_GATEWAY_ENABLED);
    this.configured = this.enabled && hasGatewayAuth(this.env);
    this.model = this.env.AI_GATEWAY_MODEL || 'openai/gpt-5.5';
    this.maxOutputTokens = Number(this.env.AI_GATEWAY_MAX_OUTPUT_TOKENS || 600);
    this.generateTextImpl = options.generateTextImpl || generateText;
  }

  assertServerOnly() {
    if (typeof window !== 'undefined') {
      throw new AIProviderError('AI Gateway provider is server-side only', { provider: this.name });
    }
  }

  async generateJSON(prompt, context = {}) {
    this.assertServerOnly();
    if (!this.enabled) {
      throw new AIProviderError('AI Gateway provider is disabled by AI_GATEWAY_ENABLED', { provider: this.name });
    }
    if (!hasGatewayAuth(this.env)) {
      throw new AIProviderError('AI Gateway auth is missing', { provider: this.name, status: 401 });
    }
    this.assertRateLimit();
    this.log('request', { model: this.model, contextKeys: Object.keys(context) });

    try {
      const result = await this.generateTextImpl({
        model: this.model,
        output: Output.json(),
        system: 'Return only valid JSON. Do not include secrets or credentials.',
        prompt: JSON.stringify({ prompt, context: redact(context) }),
        maxOutputTokens: this.maxOutputTokens,
      });
      return { provider: this.name, model: this.model, data: result.output ?? tryParseJSON(result.text || '{}') };
    } catch (error) {
      this.log('error', { model: this.model, error: safeErrorMessage(error) });
      throw new AIProviderError(`AI Gateway request failed: ${safeErrorMessage(error)}`, { provider: this.name, cause: error });
    }
  }
}

export function createAIProvider(env = process.env, options = {}) {
  const provider = env.AI_PROVIDER || 'mock';
  if (provider === 'openai') return new OpenAIProvider({ env, ...options });
  if (provider === 'gemini') return new GeminiProvider({ env, ...options });
  if (provider === 'vercel_gateway') return new VercelGatewayProvider({ env, ...options });
  return new MockAIProvider({ env, ...options });
}
