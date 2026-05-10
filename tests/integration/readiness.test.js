import { afterEach, describe, expect, it, vi } from 'vitest';

function mockReq(method = 'GET') {
  return { method, headers: {}, socket: { remoteAddress: '127.0.0.1' }, url: '/api/v1/readiness' };
}

function mockRes() {
  return {
    headers: {},
    statusCode: 0,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

describe('GET /api/v1/readiness', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  async function loadReadiness(env = {}) {
    vi.resetModules();
    process.env = { ...originalEnv, ...env };
    const mod = await import('../../server/api/v1/readiness.js');
    return mod.default;
  }

  it('reports production capabilities without exposing secrets', async () => {
    const res = mockRes();
    const readiness = await loadReadiness();
    await readiness(mockReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.checks).toHaveProperty('supabase_server');
    expect(res.body.checks).toHaveProperty('paypal');
    expect(JSON.stringify(res.body)).not.toMatch(/service_role|password|secret/i);
  });

  it('does not report production mode with sandbox PayPal or public-only Google config', async () => {
    const readiness = await loadReadiness({
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role',
      PAYPAL_ENV: 'sandbox',
      PAYPAL_CLIENT_ID: 'paypal-client',
      PAYPAL_CLIENT_SECRET: 'paypal-secret',
      EXPO_PUBLIC_GOOGLE_CLIENT_ID: 'google-public',
      ALLOWED_ORIGINS: 'https://staging.ahorroya.app',
      ENABLE_LOCAL_FALLBACK: 'true',
    });
    const res = mockRes();

    await readiness(mockReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.mode).toBe('demo_or_partial');
    expect(res.body.checks.paypal).toBe('sandbox_only');
    expect(res.body.checks.google_auth).toBe('public_only');
  });

  it('reports production mode only with live PayPal and server-side Google OAuth', async () => {
    const readiness = await loadReadiness({
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role',
      PAYPAL_ENV: 'live',
      PAYPAL_CLIENT_ID: 'paypal-client',
      PAYPAL_CLIENT_SECRET: 'paypal-secret',
      GOOGLE_OAUTH_CLIENT_ID: 'google-server',
      GOOGLE_OAUTH_CLIENT_SECRET: 'google-secret',
      ALLOWED_ORIGINS: 'https://ahorroya.app',
      ENABLE_LOCAL_FALLBACK: 'true',
    });
    const res = mockRes();

    await readiness(mockReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.mode).toBe('production');
    expect(res.body.checks.paypal).toBe('live_ready');
    expect(res.body.checks.google_auth).toBe('server_ready');
  });
});
