import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import growthMetrics from '../../server/api/v1/growth-metrics.js';

const originalEnv = { ...process.env };

function mockReq() {
  return {
    method: 'GET',
    query: {},
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    url: '/api/v1/growth/metrics',
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

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('GET /api/v1/growth/metrics', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role',
      APP_URL: 'https://codex-kohl-mu.vercel.app',
    };

    global.fetch = vi.fn((url) => {
      const target = String(url);
      if (target.includes('/price_observations?')) {
        return Promise.resolve(jsonResponse({ message: "Could not find the table 'public.price_observations' in the schema cache" }, 404));
      }
      if (target.includes('/prices?')) {
        return Promise.resolve(jsonResponse([
          { id: '1', product: 'leche', normalized_product: 'leche', display_name: 'Leche entera 1L', store: 'Disco', neighborhood: 'Centro', price: 58, currency: 'UYU', status: 'approved', created_at: '2026-04-27T03:00:00Z' },
          { id: '2', product: 'leche', normalized_product: 'leche', display_name: 'Leche entera 1L', store: 'Devoto', neighborhood: 'Pocitos', price: 54, currency: 'UYU', status: 'approved', created_at: '2026-04-27T03:00:00Z' },
        ], 200, { 'content-range': '0-1/2' }));
      }
      if (target.includes('/monetization_events?')) {
        return Promise.resolve(jsonResponse([
          { event_name: 'landing_view', metadata: { city: 'Montevideo' }, created_at: '2026-04-28T03:00:00Z' },
          { event_name: 'open_app', metadata: { source: 'landing_cta' }, created_at: '2026-04-28T03:01:00Z' },
          { event_name: 'search_product', metadata: { product: 'leche', time_to_first_result_ms: 42 }, created_at: '2026-04-28T03:02:00Z' },
          { event_name: 'click_whatsapp', metadata: { product: 'leche' }, created_at: '2026-04-28T03:03:00Z' },
          { event_name: 'share_click', metadata: { product: 'leche', source: 'whatsapp' }, created_at: '2026-04-28T03:04:00Z' },
        ], 200, { 'content-range': '0-3/4' }));
      }
      return Promise.resolve(jsonResponse([]));
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns growth funnel and activation metrics from Supabase events', async () => {
    const res = mockRes();
    await growthMetrics(mockReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.funnel).toMatchObject({
      landing_views: 1,
      open_app: 1,
      searches: 1,
      shares: 1,
      share_clicks: 1,
      whatsapp_clicks: 1,
    });
    expect(res.body.activation).toMatchObject({
      prices_active: 2,
      savings_detected: 1,
      avg_time_to_first_result_ms: 42,
    });
    expect(res.body.top_products).toEqual([{ product: 'leche', searches: 1 }]);
  });

  it('reads legacy event_type monetization rows when event_name columns are unavailable', async () => {
    global.fetch = vi.fn((url) => {
      const target = String(url);
      if (target.includes('/price_observations?')) {
        return Promise.resolve(jsonResponse({ message: "Could not find the table 'public.price_observations' in the schema cache" }, 404));
      }
      if (target.includes('/prices?')) {
        return Promise.resolve(jsonResponse([
          { id: '1', product: 'leche', normalized_product: 'leche', display_name: 'Leche entera 1L', store: 'Disco', neighborhood: 'Centro', price: 58, currency: 'UYU', status: 'approved', created_at: '2026-04-27T03:00:00Z' },
          { id: '2', product: 'leche', normalized_product: 'leche', display_name: 'Leche entera 1L', store: 'Devoto', neighborhood: 'Pocitos', price: 54, currency: 'UYU', status: 'approved', created_at: '2026-04-27T03:00:00Z' },
        ], 200, { 'content-range': '0-1/2' }));
      }
      if (target.includes('/monetization_events?select=event_name')) {
        return Promise.resolve(jsonResponse({ message: "Could not find the 'event_name' column of 'monetization_events' in the schema cache" }, 400));
      }
      if (target.includes('/monetization_events?select=event_type')) {
        return Promise.resolve(jsonResponse([
          { event_type: 'share_click', metadata: { product: 'leche', source: 'whatsapp', amount: 8, currency: 'UYU' }, created_at: '2026-04-28T03:04:00Z' },
        ], 200, { 'content-range': '0-0/1' }));
      }
      return Promise.resolve(jsonResponse([]));
    });

    const res = mockRes();
    await growthMetrics(mockReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.funnel.share_clicks).toBe(1);
  });
});
