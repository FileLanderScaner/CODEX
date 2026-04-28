import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import growthContent from '../../server/api/v1/growth-content.js';

const originalEnv = { ...process.env };

function mockReq() {
  return {
    method: 'GET',
    query: {},
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    url: '/api/v1/growth/content',
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

describe('GET /api/v1/growth/content', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role',
      APP_URL: 'https://codex-kohl-mu.vercel.app',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('generates local scripts from real legacy prices when official observations are not migrated', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ message: "Could not find the table 'public.price_observations' in the schema cache" }, 404))
      .mockResolvedValueOnce(jsonResponse([
        { id: '1', product: 'leche', normalized_product: 'leche', display_name: 'Leche entera 1L', store: 'Disco', neighborhood: 'Centro', price: 58, currency: 'UYU', status: 'approved', created_at: '2026-04-27T03:00:00Z' },
        { id: '2', product: 'leche', normalized_product: 'leche', display_name: 'Leche entera 1L', store: 'Devoto', neighborhood: 'Pocitos', price: 54, currency: 'UYU', status: 'approved', created_at: '2026-04-27T03:00:00Z' },
      ], 200, { 'content-range': '0-1/2' }))
      .mockResolvedValue(jsonResponse([], 200, { 'content-range': '0-0/0' }));

    const res = mockRes();
    await growthContent(mockReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.city).toBe('Montevideo');
    expect(res.body.data[0].whatsapp_text).toBe('Estoy ahorrando $4 en Leche entera 1L en Devoto usando AhorroYA 👉 https://codex-kohl-mu.vercel.app/app/buscar?q=leche&utm_source=whatsapp&utm_medium=share&utm_campaign=montevideo_launch&store=Devoto&savings=4');
    expect(res.body.data[0].tiktok_script).toContain('Leche entera 1L');
  });
});
