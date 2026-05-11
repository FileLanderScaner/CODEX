import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/config', () => ({
  getApiUrl: (path) => `https://api.ahorroya.test${path}`,
}));

vi.mock('../../services/account-service', () => ({
  getAuthHeaders: vi.fn(async () => ({ Authorization: 'Bearer test-token' })),
}));

describe('tracking-service', () => {
  beforeEach(() => {
    vi.resetModules();
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));
  });

  it('sends production readiness tracking events through the tracking endpoint', async () => {
    const { trackEvent } = await import('../../services/tracking-service.js');

    await trackEvent('app_opened', { platform: 'web' });
    await trackEvent('landing_viewed', { source: 'landing' });
    await trackEvent('search_started', { product: 'yerba' });
    await trackEvent('search_completed', { product: 'yerba', results: 3 });
    await trackEvent('whatsapp_share_clicked', { product: 'yerba' });
    await trackEvent('savings_copied', { product: 'yerba' });
    await trackEvent('premium_cta_seen', { source: 'contextual_card' });
    await trackEvent('checkout_started', { provider: 'paypal' });
    await trackEvent('app_loaded', { platform: 'web' });
    await trackEvent('web_session_started', { path: '/' });
    await trackEvent('client_error', { type: 'error', message: 'boom' });

    expect(global.fetch).toHaveBeenCalledTimes(11);
    expect(global.fetch.mock.calls.map((call) => JSON.parse(call[1].body).eventName)).toEqual([
      'app_opened',
      'landing_viewed',
      'search_started',
      'search_completed',
      'whatsapp_share_clicked',
      'savings_copied',
      'premium_cta_seen',
      'checkout_started',
      'app_loaded',
      'web_session_started',
      'client_error',
    ]);
  });

  it('drops unknown events before sending network requests', async () => {
    const { trackEvent } = await import('../../services/tracking-service.js');

    const result = await trackEvent('unknown_event', {});

    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
