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

  it('falls back to compact event_name tables when amount/currency columns are missing', async () => {
    global.fetch = vi.fn((_url, options) => {
      const body = JSON.parse(options.body);
      if (Object.prototype.hasOwnProperty.call(body, 'amount')) {
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
      event_name: 'share_click',
      metadata: {
        product: 'leche',
        source: 'whatsapp',
        amount: 8,
        currency: 'UYU',
      },
    });
  });

  it('falls back to legacy event_type tables when event_name is missing', async () => {
    global.fetch = vi.fn((_url, options) => {
      const body = JSON.parse(options.body);
      if (body.event_name) {
        return Promise.resolve(jsonResponse({ message: "Could not find the 'event_name' column of 'monetization_events' in the schema cache" }, 400));
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

    expect(global.fetch).toHaveBeenCalledTimes(6);
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

  it('falls back to event_name only when the table is minimal', async () => {
    global.fetch = vi.fn((_url, options) => {
      const body = JSON.parse(options.body);
      if (Object.prototype.hasOwnProperty.call(body, 'amount')) {
        return Promise.resolve(jsonResponse({ message: "Could not find the 'amount' column of 'monetization_events' in the schema cache" }, 400));
      }
      if (Object.prototype.hasOwnProperty.call(body, 'user_id')) {
        return Promise.resolve(jsonResponse({ message: "Could not find the 'user_id' column of 'monetization_events' in the schema cache" }, 400));
      }
      if (Object.prototype.hasOwnProperty.call(body, 'metadata')) {
        return Promise.resolve(jsonResponse({ message: "Could not find the 'metadata' column of 'monetization_events' in the schema cache" }, 400));
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

    expect(global.fetch).toHaveBeenCalledTimes(5);
    expect(rows[0]).toMatchObject({
      event_name: 'share_click',
    });
  });
});
