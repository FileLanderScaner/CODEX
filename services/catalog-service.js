import { getApiUrl } from '../lib/config';
import { MONTEVIDEO_SEED_PRICES } from '../data/seed-prices';
import { formatProductName, normalizeProduct, normalizeStoreKey } from './price-service';

export const CATALOG_STORES = [
  {
    key: 'disco',
    store: 'Disco',
    baseUrl: 'https://www.disco.com.uy',
    searchUrl: (query) => `https://www.disco.com.uy/${encodeURIComponent(query)}`,
    apiUrls: (query) => [
      `https://www.disco.com.uy/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?_from=0&_to=23`,
      `https://www.disco.com.uy/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=23`,
    ],
  },
  {
    key: 'devoto',
    store: 'Devoto',
    baseUrl: 'https://www.devoto.com.uy',
    searchUrl: (query) => `https://www.devoto.com.uy/${encodeURIComponent(query)}`,
    apiUrls: (query) => [
      `https://www.devoto.com.uy/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?_from=0&_to=23`,
      `https://www.devoto.com.uy/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=23`,
    ],
  },
  {
    key: 'tata',
    store: 'Ta-Ta',
    baseUrl: 'https://www.tata.com.uy',
    searchUrl: (query) => `https://www.tata.com.uy/${encodeURIComponent(query)}`,
    apiUrls: (query) => [
      `https://www.tata.com.uy/api/catalog_system/pub/products/search/${encodeURIComponent(query)}?_from=0&_to=23`,
      `https://www.tata.com.uy/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=23`,
    ],
  },
  {
    key: 'tiendainglesa',
    store: 'Tienda Inglesa',
    baseUrl: 'https://www.tiendainglesa.com.uy',
    searchUrl: (query) => `https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,${encodeURIComponent(query)},0`,
    apiUrls: () => [],
    htmlUrls: (query) => [
      `https://www.tiendainglesa.com.uy/supermercado/busqueda?0,0,${encodeURIComponent(query)},0`,
      `https://www.tiendainglesa.com.uy/busqueda?0,0,${encodeURIComponent(query)},0`,
    ],
  },
];

function nowIso() {
  return new Date().toISOString();
}

function absoluteUrl(baseUrl, value) {
  if (!value) return baseUrl;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

function parsePrice(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function firstFinite(values) {
  for (const value of values) {
    const parsed = parsePrice(value);
    if (parsed) return parsed;
  }
  return null;
}

function productNameFromVtex(row) {
  return row.productName || row.productTitle || row.name || row.product_name || row.title || '';
}

function priceFromVtex(row) {
  const sellers = row.items?.flatMap((item) => item.sellers || []) || [];
  const offers = sellers.flatMap((seller) => seller.commertialOffer ? [seller.commertialOffer] : []);
  return firstFinite([
    row.price,
    row.Price,
    row.listPrice,
    row.priceRange?.sellingPrice?.lowPrice,
    ...offers.flatMap((offer) => [offer.Price, offer.ListPrice, offer.spotPrice, offer.PriceWithoutDiscount]),
  ]);
}

function mapCatalogRow(row, adapter, query, index) {
  const name = productNameFromVtex(row);
  const product = normalizeProduct(name || query);
  const price = priceFromVtex(row);
  if (!product || !price) return null;

  const url = absoluteUrl(adapter.baseUrl, row.link || row.linkText || row.url || adapter.searchUrl(query));
  return {
    id: `catalog-${adapter.key}-${row.productId || row.productReference || index}-${Math.round(price * 100)}`,
    product,
    normalizedProduct: product,
    displayName: name || formatProductName(product),
    brand: row.brand || row.brandName || '',
    category: row.categories?.[0]?.replace(/\//g, ' ').trim() || row.category || 'Catalogo online',
    unit: row.unit || 'unidad',
    store: adapter.store,
    neighborhood: 'Catalogo online',
    region: 'Online',
    price,
    currency: 'UYU',
    updatedAt: nowIso(),
    source: `catalog:${adapter.key}`,
    status: 'approved',
    reports: 0,
    trustScore: 82,
    catalogUrl: url,
  };
}

function flattenJsonProducts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function parseJsonLdProducts(html) {
  const scripts = [...String(html || '').matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const products = [];
  for (const [, raw] of scripts) {
    try {
      const parsed = JSON.parse(raw.replace(/&quot;/g, '"'));
      const list = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of list) {
        if (item['@type'] === 'Product') products.push(item);
        if (Array.isArray(item.itemListElement)) {
          item.itemListElement.forEach((entry) => {
            if (entry.item?.['@type'] === 'Product') products.push(entry.item);
          });
        }
      }
    } catch {
      // Ignore invalid vendor JSON-LD.
    }
  }
  return products;
}

function mapJsonLdProduct(row, adapter, query, index) {
  const name = row.name || row.description || query;
  const product = normalizeProduct(name);
  const price = firstFinite([row.offers?.price, row.offers?.lowPrice, row.offers?.highPrice]);
  if (!product || !price) return null;
  return {
    id: `catalog-${adapter.key}-jsonld-${index}-${Math.round(price * 100)}`,
    product,
    normalizedProduct: product,
    displayName: name,
    brand: row.brand?.name || row.brand || '',
    category: 'Catalogo online',
    unit: 'unidad',
    store: adapter.store,
    neighborhood: 'Catalogo online',
    region: 'Online',
    price,
    currency: row.offers?.priceCurrency || 'UYU',
    updatedAt: nowIso(),
    source: `catalog:${adapter.key}`,
    status: 'approved',
    reports: 0,
    trustScore: 78,
    catalogUrl: absoluteUrl(adapter.baseUrl, row.url || adapter.searchUrl(query)),
  };
}

function dedupePrices(prices) {
  const seen = new Set();
  return prices.filter((price) => {
    const key = [
      normalizeStoreKey(price.store),
      normalizeProduct(price.displayName || price.product),
      Math.round(Number(price.price) * 100),
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 4500);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
        'User-Agent': 'AhorroYA/1.0 catalog-unifier',
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAdapterCatalog(adapter, query) {
  const normalizedQuery = normalizeProduct(query);
  if (!normalizedQuery) return { store: adapter.store, data: [], status: 'empty_query' };

  const data = [];
  const errors = [];

  for (const url of adapter.apiUrls?.(normalizedQuery) || []) {
    try {
      const response = await fetchWithTimeout(url);
      if (!response.ok) {
        errors.push(`${response.status} ${url}`);
        continue;
      }
      const payload = await response.json();
      data.push(...flattenJsonProducts(payload).map((row, index) => mapCatalogRow(row, adapter, normalizedQuery, index)).filter(Boolean));
      if (data.length) break;
    } catch (error) {
      errors.push(`${error.name || 'Error'} ${url}`);
    }
  }

  if (!data.length) {
    for (const url of adapter.htmlUrls?.(normalizedQuery) || [adapter.searchUrl(normalizedQuery)]) {
      try {
        const response = await fetchWithTimeout(url, { headers: { Accept: 'text/html,*/*;q=0.8' } });
        if (!response.ok) {
          errors.push(`${response.status} ${url}`);
          continue;
        }
        const html = await response.text();
        data.push(...parseJsonLdProducts(html).map((row, index) => mapJsonLdProduct(row, adapter, normalizedQuery, index)).filter(Boolean));
        if (data.length) break;
      } catch (error) {
        errors.push(`${error.name || 'Error'} ${url}`);
      }
    }
  }

  return {
    store: adapter.store,
    status: data.length ? 'ok' : 'linked',
    searchUrl: adapter.searchUrl(normalizedQuery),
    data: dedupePrices(data).slice(0, 12),
    errors,
  };
}

export function buildCatalogLinks(product) {
  const query = normalizeProduct(product);
  if (!query) return [];
  return CATALOG_STORES.map((adapter) => ({
    id: `catalog-link-${adapter.key}-${query}`,
    product: query,
    title: `Buscar ${formatProductName(query)} en ${adapter.store}`,
    store: adapter.store,
    kind: 'catalog',
    url: adapter.searchUrl(query),
  }));
}

export function buildCatalogFallbackPrices(product) {
  const query = normalizeProduct(product);
  if (!query) return [];
  return MONTEVIDEO_SEED_PRICES
    .filter((price) => normalizeProduct(`${price.product} ${price.displayName} ${price.brand}`).includes(query))
    .map((price) => ({
      ...price,
      id: `fallback-${price.id}`,
      source: 'catalog-fallback:seed',
      catalogUrl: CATALOG_STORES.find((adapter) => adapter.store === price.store)?.searchUrl(query),
    }));
}

export async function fetchUnifiedCatalogPrices(product) {
  const query = normalizeProduct(product);
  if (!query) {
    return { data: [], sources: [], links: [] };
  }
  const settled = await Promise.all(CATALOG_STORES.map((adapter) => fetchAdapterCatalog(adapter, query)));
  const data = dedupePrices(settled.flatMap((source) => source.data)).slice(0, 48);
  return {
    query,
    generatedAt: nowIso(),
    data,
    sources: settled.map(({ store, status, searchUrl, errors }) => ({ store, status, searchUrl, errors })),
    links: buildCatalogLinks(query),
  };
}

export async function loadUnifiedCatalogPrices(product) {
  const query = normalizeProduct(product);
  if (!query) return { data: [], sources: [], links: [] };
  const response = await fetch(getApiUrl(`/api/v1/catalog/search?q=${encodeURIComponent(query)}`), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  }).catch(() => null);
  if (!response?.ok) {
    return {
      query,
      generatedAt: nowIso(),
      data: buildCatalogFallbackPrices(query),
      sources: CATALOG_STORES.map((adapter) => ({
        store: adapter.store,
        status: 'local_link',
        searchUrl: adapter.searchUrl(query),
        errors: ['api_unavailable'],
      })),
      links: buildCatalogLinks(query),
    };
  }
  return response.json();
}

export function mergeCatalogPrices(basePrices = [], catalogPrices = []) {
  return dedupePrices([...catalogPrices, ...basePrices]);
}
