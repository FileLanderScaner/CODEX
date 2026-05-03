import { afterEach, describe, expect, it, vi } from 'vitest';

function mockReq(body, headers = {}) {
  return {
    method: 'POST',
    headers: { 'x-forwarded-for': `127.0.0.${Math.floor(Math.random() * 200) + 20}`, ...headers },
    socket: { remoteAddress: '127.0.0.1' },
    url: '/api/v1/ai/agents',
    body,
    query: {},
  };
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

async function loadHandler(env = {}) {
  vi.resetModules();
  process.env = {
    ...process.env,
    APP_ENV: 'test',
    ENABLE_LOCAL_FALLBACK: 'true',
    ENABLE_ADMIN_AI_PANEL: 'true',
    ENABLE_AI_AGENTS: 'false',
    SUPABASE_URL: 'https://supabase.example.com',
    EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    SUPABASE_SERVICE_ROLE_KEY: '',
    ...env,
  };
  const mod = await import('../../server/api/v1/ai-agents.js');
  return mod.default;
}

describe('/api/v1/ai/agents', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('stays disabled by default when the admin panel flag is off', async () => {
    const handler = await loadHandler({ ENABLE_ADMIN_AI_PANEL: 'false' });
    const res = mockRes();
    await handler(mockReq({ action: 'list' }), res);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('admin_ai_panel_disabled');
  });

  it('lists agents for admin users without requiring persistent memory', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      id: 'user-1',
      email: 'admin@ahorroya.test',
      app_metadata: { role: 'admin' },
    }), { status: 200 }))));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ action: 'list' }, { authorization: 'Bearer valid-token' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.agents.map((agent) => agent.name)).toContain('ProductAuditAgent');
    expect(res.body.data.memory.persistent).toBe(false);
  });

  it('blocks unauthenticated users', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 401 }))));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ action: 'list' }, { authorization: 'Bearer bad-token' }), res);
    expect(res.statusCode).toBe(401);
  });

  it('blocks authenticated users without admin or internal_job role', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      id: 'user-2',
      email: 'user@ahorroya.test',
      app_metadata: { role: 'authenticated' },
    }), { status: 200 }))));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ action: 'list' }, { authorization: 'Bearer valid-token' }), res);
    expect(res.statusCode).toBe(403);
  });

  it('blocks execution when ENABLE_AI_AGENTS is false', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      id: 'user-1',
      email: 'admin@ahorroya.test',
      app_metadata: { role: 'admin' },
    }), { status: 200 }))));
    const handler = await loadHandler({ ENABLE_AI_AGENTS: 'false' });
    const res = mockRes();
    await handler(mockReq({ action: 'run', agent: 'ProductAuditAgent' }, { authorization: 'Bearer valid-token' }), res);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('ai_agents_disabled');
  });

  it('runs a read-only agent in dry-run when enabled', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      id: 'user-1',
      email: 'admin@ahorroya.test',
      app_metadata: { role: 'admin' },
    }), { status: 200 }))));
    const handler = await loadHandler({ ENABLE_AI_AGENTS: 'true', AI_AUTONOMY_LEVEL: 'LEVEL_0_READ_ONLY' });
    const res = mockRes();
    await handler(mockReq({ action: 'run', agent: 'ProductAuditAgent', dryRun: true }, { authorization: 'Bearer valid-token' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.result.status).toBe('completed');
    expect(res.body.data.result.dryRun).toBe(true);
  });

  it('blocks LEVEL_4 unless explicit override is configured', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      id: 'user-1',
      email: 'admin@ahorroya.test',
      app_metadata: { role: 'admin' },
    }), { status: 200 }))));
    const handler = await loadHandler({
      ENABLE_AI_AGENTS: 'true',
      AI_AUTONOMY_LEVEL: 'LEVEL_4_CONTROLLED_EXECUTION',
      ENABLE_AI_LEVEL4_OVERRIDE: 'false',
    });
    const res = mockRes();
    await handler(mockReq({ action: 'run', agent: 'ProductAuditAgent', dryRun: true }, { authorization: 'Bearer valid-token' }), res);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('level_4_blocked_by_default');
  });

  it('supports suggestions alias and does not leak configured secrets', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      id: 'user-1',
      email: 'admin@ahorroya.test',
      app_metadata: { role: 'admin' },
    }), { status: 200 }))));
    const handler = await loadHandler({
      SUPABASE_SERVICE_ROLE_KEY: 'super-secret-service-role',
      PAYPAL_CLIENT_SECRET: 'paypal-secret',
    });
    const res = mockRes();
    await handler(mockReq({ action: 'suggestions', status: 'pending' }, { authorization: 'Bearer valid-token' }), res);
    expect(res.statusCode).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('super-secret-service-role');
    expect(JSON.stringify(res.body)).not.toContain('paypal-secret');
  });
});
