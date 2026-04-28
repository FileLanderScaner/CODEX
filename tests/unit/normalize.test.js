import { describe, expect, it } from 'vitest';
import { canonicalPrice, normalizeText } from '../../src/services/pricing/normalize.js';

describe('pricing normalization', () => {
  it('normalizes accents and spacing', () => {
    expect(normalizeText('  Leche  Entera Ácida ')).toBe('leche entera acida');
  });

  it('builds canonical records with idempotency and timestamps', () => {
    const row = canonicalPrice({
      sourceCode: 'uy_uam_mgap',
      countryCode: 'UY',
      productName: 'Papa blanca',
      storeName: 'UAM',
      regionName: 'Montevideo',
      currency: 'UYU',
      price: 45,
      unit: 'kg',
      observedAt: '2026-04-27T12:00:00Z',
    });

    expect(row.normalized_product).toBe('papa blanca');
    expect(row.price).toBe(45);
    expect(row.idempotency_key).toHaveLength(64);
    expect(row.moderation_status).toBe('approved');
  });
});
