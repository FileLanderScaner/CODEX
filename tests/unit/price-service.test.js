import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildMontevideoGrowthContent, buildShareText, fetchOfficialPrices, filterMontevideoLaunchPrices, getPopularDeals, searchPrices } from '../../services/price-service.js';

describe('price service real data mapping', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches /api/v1/prices and maps official observations', async () => {
    global.fetch = vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      data: [{
        id: 'obs-1',
        normalized_product: 'aceite',
        product_name: 'Aceite de girasol',
        store_name: 'Tienda Inglesa',
        region_name: 'Montevideo',
        price: '120',
        currency: 'UYU',
        unit: 'l',
        observed_at: '2026-04-27T12:00:00Z',
        source_code: 'uy_uam_mgap',
      }],
      pagination: { total: 1 },
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    const result = await fetchOfficialPrices({ q: 'aceite', country: 'UY' });

    expect(global.fetch.mock.calls[0][0]).toContain('/api/v1/prices?');
    expect(result.data[0]).toMatchObject({
      product: 'aceite',
      displayName: 'Aceite de girasol',
      store: 'Tienda Inglesa',
      price: 120,
      source: 'uy_uam_mgap',
    });
  });

  it('calculates real savings only from provided prices', () => {
    const prices = [
      { id: '1', product: 'aceite', displayName: 'Aceite', store: 'Disco', neighborhood: 'Montevideo', price: 140, status: 'approved' },
      { id: '2', product: 'aceite', displayName: 'Aceite', store: 'Tienda Inglesa', neighborhood: 'Montevideo', price: 120, status: 'approved' },
    ];

    expect(searchPrices('aceite', prices)).toHaveLength(2);
    expect(getPopularDeals(prices)[0].savings).toBe(20);
    expect(buildShareText(prices)).toBe('Encontre Aceite $20 mas barato en Tienda Inglesa usando AhorroYA: /app/buscar?q=aceite&utm_source=whatsapp&utm_medium=share&utm_campaign=montevideo_launch&store=Tienda+Inglesa&savings=20');
  });

  it('generates Montevideo launch content only from target supermarkets', () => {
    const prices = [
      { id: '1', product: 'leche', displayName: 'Leche entera 1L', store: 'Disco', neighborhood: 'Centro', price: 58, status: 'approved' },
      { id: '2', product: 'leche', displayName: 'Leche entera 1L', store: 'Devoto', neighborhood: 'Pocitos', price: 54, status: 'approved' },
      { id: '3', product: 'leche', displayName: 'Leche entera 1L', store: 'Geant', neighborhood: 'Roosevelt', price: 49, status: 'approved' },
    ];

    expect(filterMontevideoLaunchPrices(prices).map((row) => row.store)).toEqual(['Disco', 'Devoto']);
    const content = buildMontevideoGrowthContent(prices);
    expect(content[0]).toMatchObject({
      product: 'Leche entera 1L',
      cheapestStore: 'Devoto',
      expensiveStore: 'Disco',
      savings: 4,
    });
    expect(content[0].whatsappText).toContain('mas barato en Devoto usando AhorroYA:');
  });
});
