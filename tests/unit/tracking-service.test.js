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

    await trackEvent('app_loaded', { platform: 'web' });
    await trackEvent('web_session_started', { path: '/' });
    await trackEvent('client_error', { type: 'error', message: 'boom' });

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch.mock.calls.map((call) => JSON.parse(call[1].body).eventName)).toEqual([
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
