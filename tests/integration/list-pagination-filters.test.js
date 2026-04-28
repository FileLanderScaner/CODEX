import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import products from '../../server/api/v1/products/index.js';
import prices from '../../server/api/v1/prices/index.js';
import stores from '../../server/api/v1/stores.js';
import categories from '../../server/api/v1/categories.js';

const originalEnv = { ...process.env };

function mockReq(path, query = {}) {
  return {
    method: 'GET',
    query,
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    url: path,
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

function jsonResponse(body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('paginated catalog endpoints', () => {
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role',
      ENABLE_LOCAL_FALLBACK: 'false',
    };
    global.fetch = vi.fn(() => Promise.resolve(jsonResponse([], { 'content-range': '20-29/57' })));
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('applies pagination and official-source filters to /products', async () => {
    const res = mockRes();
    await products(mockReq('/api/v1/products', {
      q: 'arroz',
      country: 'uy',
      region: 'Montevideo',
      currency: 'uyu',
      brand: 'Saman',
      from: '2026-04-01',
      to: '2026-04-27',
      limit: '10',
      page: '3',
    }), res);

    const url = global.fetch.mock.calls[0][0];
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toEqual({ limit: 10, offset: 20, page: 3, total: 57, has_more: true });
    expect(url).toContain('/rest/v1/products?');
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=20');
    expect(url).toContain('brands.normalized_name=ilike.*Saman*');
    expect(url).toContain('price_observations.country_code=eq.UY');
    expect(url).toContain('price_observations.currency=eq.UYU');
    expect(url).toContain('price_observations.region_name=ilike.*Montevideo*');
    expect(url).toContain('price_observations.observed_at=gte.2026-04-01T00%3A00%3A00.000Z');
  });

  it('applies pagination and filters to /prices', async () => {
    const res = mockRes();
    await prices(mockReq('/api/v1/prices', {
      q: 'leche',
      country: 'cl',
      region: 'Santiago',
      currency: 'clp',
      brand: 'Colun',
      date: '2026-04-27',
      limit: '25',
      offset: '50',
    }), res);

    const url = global.fetch.mock.calls[0][0];
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toEqual({ limit: 25, offset: 50, page: 3, total: 57, has_more: false });
    expect(url).toContain('/rest/v1/price_observations?');
    expect(url).toContain('normalized_product=ilike.*leche*');
    expect(url).toContain('country_code=eq.CL');
    expect(url).toContain('currency=eq.CLP');
    expect(url).toContain('region_name=ilike.*Santiago*');
    expect(url).toContain('products.brands.normalized_name=ilike.*Colun*');
    expect(url).toContain('observed_at=gte.2026-04-27T00%3A00%3A00.000Z');
    expect(url).toContain('observed_at=lt.2026-04-28T00%3A00%3A00.000Z');
  });

  it('rejects invalid date ranges before hitting Supabase', async () => {
    const res = mockRes();
    await prices(mockReq('/api/v1/prices', { from: '2026-04-27', to: '2026-04-01' }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('from must be before');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('applies pagination and location filters to /stores', async () => {
    const res = mockRes();
    await stores(mockReq('/api/v1/stores', {
      country: 'uy',
      region: 'Canelones',
      currency: 'uyu',
      brand: 'Conaprole',
      limit: '5',
      offset: '10',
    }), res);

    const url = global.fetch.mock.calls[0][0];
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toEqual({ limit: 5, offset: 10, page: 3, total: 57, has_more: true });
    expect(url).toContain('/rest/v1/stores?');
    expect(url).toContain('country_code=eq.UY');
    expect(url).toContain('store_locations.regions.name=ilike.*Canelones*');
    expect(url).toContain('price_observations.currency=eq.UYU');
    expect(url).toContain('price_observations.products.brands.normalized_name=ilike.*Conaprole*');
  });

  it('applies pagination and official-source filters to /categories', async () => {
    const res = mockRes();
    await categories(mockReq('/api/v1/categories', {
      q: 'lacteos',
      country: 'cl',
      region: 'Santiago',
      currency: 'clp',
      brand: 'Colun',
      limit: '20',
      page: '2',
    }), res);

    const url = global.fetch.mock.calls[0][0];
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toEqual({ limit: 20, offset: 20, page: 2, total: 57, has_more: true });
    expect(url).toContain('/rest/v1/categories?');
    expect(url).toContain('products.brands.normalized_name=ilike.*Colun*');
    expect(url).toContain('products.price_observations.country_code=eq.CL');
    expect(url).toContain('products.price_observations.currency=eq.CLP');
    expect(url).toContain('products.price_observations.region_name=ilike.*Santiago*');
  });
});
