import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('monetization event schema compatibility', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('falls back to legacy event_type tables when amount/event_name columns are missing', async () => {
    global.fetch = vi.fn((_url, options) => {
      const body = JSON.parse(options.body);
      if (body.event_name) {
        return Promise.resolve(jsonResponse({ message: "Could not find the 'amount' column of 'monetization_events' in the schema cache" }, 400));
      }
      return Promise.resolve(jsonResponse([{ id: 'evt-1', ...body }]));
    });

    const { insertMonetizationEvent } = await import('../../server/api/_monetization.js');
    const rows = await insertMonetizationEvent({
      eventName: 'share_click',
      amount: 8,
      currency: 'UYU',
      metadata: { product: 'leche', source: 'whatsapp' },
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(rows[0]).toMatchObject({
      event_type: 'share_click',
      metadata: {
        product: 'leche',
        source: 'whatsapp',
        amount: 8,
        currency: 'UYU',
      },
    });
  });
});
