import { afterEach, describe, expect, it, vi } from 'vitest';
import { rateLimit } from '../../api/_security.js';

describe('rate limiting', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('blocks after configured limit with local fallback', async () => {
    process.env = { ...originalEnv, APP_ENV: 'test', UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '' };
    const req = { headers: { 'x-forwarded-for': '10.0.0.1' }, socket: {} };
    expect((await rateLimit(req, 'security-test', { limit: 1, windowMs: 60_000 })).ok).toBe(true);
    expect((await rateLimit(req, 'security-test', { limit: 1, windowMs: 60_000 })).ok).toBe(false);
  });

  it('uses Upstash Redis when configured', async () => {
    process.env = {
      ...originalEnv,
      APP_ENV: 'production',
      UPSTASH_REDIS_REST_URL: 'https://upstash.example.com',
      UPSTASH_REDIS_REST_TOKEN: 'token',
    };
    global.fetch = vi.fn(() => Promise.resolve(new Response(JSON.stringify([
      { result: 42 },
      { result: 1 },
    ]), { status: 200 })));

    const req = { headers: { 'x-forwarded-for': '203.0.113.10' }, socket: {} };
    const result = await rateLimit(req, 'api', { limit: 100, windowMs: 60_000 });

    expect(result).toMatchObject({ ok: true, current: 42, limit: 100, ip: '203.0.113.10' });
    expect(global.fetch).toHaveBeenCalledWith('https://upstash.example.com/pipeline', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer token' }),
    }));
  });

  it('fails closed in production when Redis is missing', async () => {
    process.env = { ...originalEnv, APP_ENV: 'production', UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '' };
    const req = { headers: { 'x-forwarded-for': '203.0.113.11' }, socket: {} };

    await expect(rateLimit(req, 'api', { limit: 100, windowMs: 60_000 })).resolves.toMatchObject({
      ok: false,
      error: 'rate_limit_not_configured',
    });
  });
});
