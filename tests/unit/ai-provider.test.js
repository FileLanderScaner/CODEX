import { describe, expect, it, vi } from 'vitest';
import { createAIProvider, InMemoryRateLimiter } from '../../lib/ai-agents/AIProvider.js';

describe('AIProvider', () => {
  it('respects AI_PROVIDER instead of selecting by whichever key exists first', () => {
    const provider = createAIProvider({
      AI_PROVIDER: 'gemini',
      OPENAI_API_KEY: 'openai-key',
      GEMINI_API_KEY: 'gemini-key',
    });

    expect(provider.name).toBe('gemini');
    expect(provider.configured).toBe(true);
  });

  it('uses mock mode without external calls', async () => {
    const provider = createAIProvider({ AI_PROVIDER: 'mock' });
    const result = await provider.generateJSON('audit', { SUPABASE_SERVICE_ROLE_KEY: 'must-not-leak' });

    expect(result.provider).toBe('mock');
    expect(result.contextKeys).toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('rate limits provider calls before network execution', async () => {
    const fetchImpl = vi.fn();
    const provider = createAIProvider({
      AI_PROVIDER: 'openai',
      OPENAI_API_KEY: 'openai-key',
    }, {
      fetchImpl,
      rateLimiter: new InMemoryRateLimiter({ limit: 0 }),
    });

    await expect(provider.generateJSON('audit')).rejects.toMatchObject({ status: 429 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('keeps AI Gateway disabled unless the explicit flag is enabled', async () => {
    const generateTextImpl = vi.fn();
    const provider = createAIProvider({
      AI_PROVIDER: 'vercel_gateway',
      AI_GATEWAY_ENABLED: 'false',
      VERCEL_OIDC_TOKEN: 'vercel-secret-token',
    }, { generateTextImpl });

    expect(provider.name).toBe('vercel_gateway');
    expect(provider.configured).toBe(false);
    await expect(provider.generateJSON('audit')).rejects.toThrow('disabled');
    expect(generateTextImpl).not.toHaveBeenCalled();
  });

  it('requires Gateway auth when vercel_gateway is enabled', async () => {
    const provider = createAIProvider({
      AI_PROVIDER: 'vercel_gateway',
      AI_GATEWAY_ENABLED: 'true',
    });

    expect(provider.configured).toBe(false);
    await expect(provider.generateJSON('audit')).rejects.toMatchObject({ status: 401 });
  });

  it('uses GPT-5.5 as the default Gateway model', () => {
    const provider = createAIProvider({
      AI_PROVIDER: 'vercel_gateway',
      AI_GATEWAY_ENABLED: 'true',
      VERCEL_OIDC_TOKEN: 'vercel-secret-token',
    });

    expect(provider.model).toBe('openai/gpt-5.5');
    expect(provider.configured).toBe(true);
  });

  it('redacts sensitive context before sending it to Gateway', async () => {
    const generateTextImpl = vi.fn(async () => ({ output: { ok: true } }));
    const provider = createAIProvider({
      AI_PROVIDER: 'vercel_gateway',
      AI_GATEWAY_ENABLED: 'true',
      VERCEL_OIDC_TOKEN: 'vercel-secret-token',
    }, { generateTextImpl });

    await provider.generateJSON('audit', {
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
      SUPABASE_DB_URL: 'postgresql://postgres:password@example.supabase.co/postgres',
      nested: { Authorization: 'Bearer abc.secret' },
    });

    const sentPrompt = generateTextImpl.mock.calls[0][0].prompt;
    expect(sentPrompt).not.toContain('service-role-secret');
    expect(sentPrompt).not.toContain('postgresql://');
    expect(sentPrompt).not.toContain('Bearer abc.secret');
    expect(sentPrompt).toContain('[redacted]');
  });

  it('redacts secrets from Gateway errors', async () => {
    const generateTextImpl = vi.fn(() => {
      throw new Error('failed with Bearer abc.secret and sk-testsecret');
    });
    const provider = createAIProvider({
      AI_PROVIDER: 'vercel_gateway',
      AI_GATEWAY_ENABLED: 'true',
      VERCEL_OIDC_TOKEN: 'vercel-secret-token',
    }, { generateTextImpl });

    await expect(provider.generateJSON('audit')).rejects.toThrow('[REDACTED]');
    await expect(provider.generateJSON('audit')).rejects.not.toThrow('sk-testsecret');
  });

  it('does not allow Gateway provider execution in a browser context', async () => {
    const originalWindow = globalThis.window;
    globalThis.window = {};
    const provider = createAIProvider({
      AI_PROVIDER: 'vercel_gateway',
      AI_GATEWAY_ENABLED: 'true',
      VERCEL_OIDC_TOKEN: 'vercel-secret-token',
    });

    await expect(provider.generateJSON('audit')).rejects.toThrow('server-side only');
    globalThis.window = originalWindow;
  });
});
