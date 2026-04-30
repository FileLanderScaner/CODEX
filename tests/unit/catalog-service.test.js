import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildCatalogFallbackPrices,
  buildCatalogLinks,
  fetchUnifiedCatalogPrices,
  mergeCatalogPrices,
} from '../../services/catalog-service.js';

describe('catalog service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds official catalog links for the launch supermarkets', () => {
    const links = buildCatalogLinks('leche');

    expect(links.map((link) => link.store)).toEqual(['Disco', 'Devoto', 'Ta-Ta', 'Tienda Inglesa']);
    expect(links.every((link) => link.kind === 'catalog')).toBe(true);
    expect(links[0].url).toContain('disco.com.uy');
  });

  it('normalizes online catalog prices from VTEX-like payloads', async () => {
    global.fetch = vi.fn((url) => {
      if (String(url).includes('disco.com.uy')) {
        return Promise.resolve(new Response(JSON.stringify([
          {
            productId: '123',
            productName: 'Leche Entera 1 L',
            brand: 'Conaprole',
            link: '/leche-entera/p',
            items: [{
              sellers: [{
                commertialOffer: { Price: 54, ListPrice: 59 },
              }],
            }],
          },
        ]), { status: 200, headers: { 'content-type': 'application/json' } }));
      }

      return Promise.resolve(new Response('', { status: 404 }));
    });

    const result = await fetchUnifiedCatalogPrices('leche');

    expect(result.data[0]).toMatchObject({
      product: 'leche entera 1 l',
      displayName: 'Leche Entera 1 L',
      store: 'Disco',
      price: 54,
      source: 'catalog:disco',
    });
    expect(result.links).toHaveLength(4);
  });

  it('keeps fallback prices and dedupes merged catalog rows', () => {
    const fallback = buildCatalogFallbackPrices('leche');
    const merged = mergeCatalogPrices(fallback, [fallback[0]]);

    expect(fallback.length).toBeGreaterThan(0);
    expect(merged.filter((row) => row.id === fallback[0].id)).toHaveLength(1);
  });
});
