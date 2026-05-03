import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSavingsSummary, shouldShowPaywall } from '../../services/premium-service.js';

describe('premium service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('normalizes isPremium and is_premium fields', () => {
    expect(shouldShowPaywall({ isPremium: true }, { paywall_trigger_met: true }, null)).toBe(false);
    expect(shouldShowPaywall({ is_premium: false }, { paywall_trigger_met: true }, null)).toBe(true);
  });

  it('fetches real savings summary when available', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      this_month: { total: 80, count: 4, avg: 20, trend: 'up' },
      paywall_trigger_met: true,
    }), { status: 200 }))));
    const summary = await getSavingsSummary('token');
    expect(summary.source).toBe('api');
    expect(summary.this_month.total).toBe(80);
  });

  it('marks fallback summary explicitly when API is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 503 }))));
    const summary = await getSavingsSummary('token');
    expect(summary.source).toBe('fallback_unavailable');
    expect(summary.warning).toMatch(/not real savings/i);
  });
});
