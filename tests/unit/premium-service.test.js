import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getPremiumStatus,
  getSavingsSummary,
  normalizeSubscriptionStatus,
  shouldShowPaywall,
  subscriptionHasActiveEntitlement,
} from '../../services/premium-service.js';

describe('premium service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('normalizes isPremium and is_premium fields', () => {
    expect(shouldShowPaywall({ isPremium: true }, { paywall_trigger_met: true }, null)).toBe(false);
    expect(shouldShowPaywall({ is_premium: false }, { paywall_trigger_met: true }, null)).toBe(true);
  });

  it('normalizes subscription status casing', () => {
    expect(normalizeSubscriptionStatus('ACTIVE')).toBe('active');
    expect(normalizeSubscriptionStatus(' payment_failed ')).toBe('payment_failed');
  });

  it('detects active premium subscriptions with unexpired periods', () => {
    const now = new Date('2026-05-10T12:00:00.000Z');
    expect(subscriptionHasActiveEntitlement({ status: 'ACTIVE' }, now)).toBe(true);
    expect(subscriptionHasActiveEntitlement({ status: 'active', current_period_end: '2026-05-11T00:00:00.000Z' }, now)).toBe(true);
    expect(subscriptionHasActiveEntitlement({ status: 'active', current_period_end: '2026-05-09T00:00:00.000Z' }, now)).toBe(false);
    expect(subscriptionHasActiveEntitlement({ status: 'approval_pending' }, now)).toBe(false);
  });

  it('fetches premium status from billing subscriptions', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      data: [
        { status: 'approval_pending' },
        { status: 'active', current_period_end: '2099-01-01T00:00:00.000Z' },
      ],
    }), { status: 200 }))));

    const premiumStatus = await getPremiumStatus('token');
    expect(premiumStatus.isPremium).toBe(true);
    expect(premiumStatus.subscriptions).toHaveLength(2);
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
