import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

function mockReq({ url = '/api/v1/b2b/dashboard', headers = {} } = {}) {
  return {
    method: 'GET',
    query: {},
    headers: { 'x-forwarded-for': '127.0.0.210', ...headers },
    socket: { remoteAddress: '127.0.0.1' },
    url,
  };
}

function mockRes() {
  return {
    headers: {},
    statusCode: 0,
    setHeader(key, value) { this.headers[key] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    send(body) { this.body = body; return this; },
    end() { this.ended = true; return this; },
  };
}

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function userResponse(role, status = 200) {
  return jsonResponse({
    id: `user-${role}`,
    email: `${role}@ahorroya.test`,
    app_metadata: { role },
  }, status);
}

describe('B2B monetization endpoints', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      APP_ENV: 'test',
      ENABLE_LOCAL_FALLBACK: 'true',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  async function loadHandlers() {
    const mod = await import('../../server/api/v1/monetization.js');
    return { b2bDashboard: mod.b2bDashboard, b2bExportCsv: mod.b2bExportCsv };
  }

  it('blocks unauthenticated B2B dashboard access', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(jsonResponse({}, 401))));
    const res = mockRes();
    const { b2bDashboard } = await loadHandlers();

    await b2bDashboard(mockReq(), res);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });

  it('blocks authenticated non-admin B2B dashboard access', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(userResponse('authenticated'))));
    const res = mockRes();
    const { b2bDashboard } = await loadHandlers();

    await b2bDashboard(mockReq({ headers: { authorization: 'Bearer user-token' } }), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('allows admin B2B dashboard access', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      const target = String(url);
      if (target.includes('/auth/v1/user')) return Promise.resolve(userResponse('admin'));
      if (target.includes('/monetization_events?')) return Promise.resolve(jsonResponse([
        { event_name: 'search_product', metadata: { product: 'leche' }, amount: null, currency: 'UYU', created_at: '2026-05-10T00:00:00Z' },
      ]));
      if (target.includes('/affiliate_clicks?')) return Promise.resolve(jsonResponse([]));
      if (target.includes('/commercial_leads?')) return Promise.resolve(jsonResponse([]));
      return Promise.resolve(jsonResponse([]));
    }));
    const res = mockRes();
    const { b2bDashboard } = await loadHandlers();

    await b2bDashboard(mockReq({ headers: { authorization: 'Bearer admin-token' } }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.top_products).toEqual([{ product: 'leche', searches: 1 }]);
  });

  it('blocks non-admin B2B CSV export', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(userResponse('authenticated'))));
    const res = mockRes();
    const { b2bExportCsv } = await loadHandlers();

    await b2bExportCsv(mockReq({ url: '/api/v1/b2b/export.csv', headers: { authorization: 'Bearer user-token' } }), res);

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });
});
