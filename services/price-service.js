import { getApiUrl, getAppUrl } from '../lib/config.js';

const MONTEVIDEO_LAUNCH_STORES = new Set(['disco', 'tiendainglesa', 'devoto', 'tata']);

export const normalizeProduct = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

export const normalizeStoreKey = (value) =>
  normalizeProduct(value).replace(/[^a-z0-9]/g, '');

export function isMontevideoLaunchStore(store) {
  return MONTEVIDEO_LAUNCH_STORES.has(normalizeStoreKey(store));
}

export function filterMontevideoLaunchPrices(prices = []) {
  return getAllPrices(prices).filter((price) => isMontevideoLaunchStore(price.store));
}

export const formatProductName = (value) =>
  normalizeProduct(value)
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');

export function mapObservation(row) {
  const normalized = normalizeProduct(row.normalized_product || row.normalizedProduct || row.product_name || row.product || row.products?.name);
  return {
    id: row.id,
    product: normalized,
    normalizedProduct: normalized,
    displayName: row.product_name || row.display_name || row.displayName || row.products?.name || formatProductName(normalized),
    brand: row.products?.brands?.name || row.raw_payload?.brand || row.brand || '',
    category: row.products?.categories?.name || row.category || 'Supermercado',
    unit: row.unit || 'unidad',
    store: row.store_name || row.stores?.name || row.store || '',
    neighborhood: row.region_name || row.regions?.name || row.neighborhood || 'Montevideo',
    region: row.region_name || row.regions?.name || '',
    price: Number(row.price),
    currency: row.currency || 'UYU',
    updatedAt: row.observed_at || row.updated_at || row.created_at || '',
    source: row.source_code || row.source || 'official',
    status: row.moderation_status || row.status || 'approved',
    reports: row.reports || 0,
    trustScore: row.quality_score || row.trust_score || 90,
  };
}

export async function fetchOfficialPrices(params = {}) {
  const query = new URLSearchParams();
  Object.entries({ country: 'UY', limit: 100, ...params }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') query.set(key, String(value));
  });

  const response = await fetch(getApiUrl(`/api/v1/prices?${query.toString()}`), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'No pudimos cargar precios reales.');
  }

  return {
    data: (payload.data || []).map(mapObservation).filter((item) => item.id && item.product && item.store && Number.isFinite(item.price)),
    pagination: payload.pagination || null,
  };
}

export function getAllPrices(prices = []) {
  return prices
    .map(mapObservation)
    .filter((item) => item.id && item.product && item.store && Number.isFinite(item.price) && item.status !== 'hidden');
}

export function searchPrices(query, prices = [], filters = {}) {
  const normalizedQuery = normalizeProduct(query);
  if (!normalizedQuery) return [];

  return getAllPrices(prices)
    .filter((item) => {
      const haystack = normalizeProduct(`${item.product} ${item.displayName} ${item.store} ${item.neighborhood} ${item.brand}`);
      const matchesQuery = haystack.includes(normalizedQuery);
      const matchesNeighborhood = !filters.neighborhood || filters.neighborhood === 'Todos' || normalizeProduct(item.neighborhood) === normalizeProduct(filters.neighborhood);
      return matchesQuery && matchesNeighborhood;
    })
    .sort((a, b) => Number(a.price) - Number(b.price));
}

export function getCheapest(prices) {
  const sorted = getAllPrices(prices).sort((a, b) => Number(a.price) - Number(b.price));
  return sorted.length ? sorted[0] : null;
}

export function getMostExpensive(prices) {
  const sorted = getAllPrices(prices).sort((a, b) => Number(a.price) - Number(b.price));
  return sorted.length ? sorted[sorted.length - 1] : null;
}

export function getSavingsOpportunity(prices) {
  const cheapest = getCheapest(prices);
  const mostExpensive = getMostExpensive(prices);
  if (!cheapest || !mostExpensive || cheapest.id === mostExpensive.id) return 0;
  return Math.max(0, Math.round(Number(mostExpensive.price) - Number(cheapest.price)));
}

export function getSavingsText(prices) {
  const difference = getSavingsOpportunity(prices);
  return difference > 0 ? `Ahorro real: $${difference} frente al mas caro` : 'Sin diferencia real entre tiendas';
}

export function buildShareUrl(product, metadata = {}) {
  const normalizedProduct = normalizeProduct(product);
  const baseUrl = String(getAppUrl() || '').replace(/\/+$/, '');
  const params = new URLSearchParams({
    q: normalizedProduct,
    utm_source: 'whatsapp',
    utm_medium: 'share',
    utm_campaign: 'montevideo_launch',
  });

  if (metadata.store) params.set('store', String(metadata.store));
  if (Number.isFinite(Number(metadata.savings))) params.set('savings', String(Math.round(Number(metadata.savings))));

  return `${baseUrl}/app/buscar?${params.toString()}`;
}

export function buildShareText(prices) {
  const sorted = getAllPrices(prices).sort((a, b) => Number(a.price) - Number(b.price));
  const cheapest = sorted[0];
  if (!cheapest) return `Estoy buscando ahorros reales con AhorroYA: ${getAppUrl()}`;

  const difference = getSavingsOpportunity(sorted);
  const product = cheapest.displayName || formatProductName(cheapest.product);
  const productUrl = buildShareUrl(cheapest.product, { savings: difference, store: cheapest.store });
  const store = cheapest.store || 'Montevideo';
  return `Encontre ${product} $${difference} mas barato en ${store} usando AhorroYA: ${productUrl}`;
}

export function getPriceStats(prices) {
  const sorted = getAllPrices(prices).sort((a, b) => Number(a.price) - Number(b.price));
  if (!sorted.length) return null;

  const total = sorted.reduce((sum, item) => sum + Number(item.price), 0);
  const average = Math.round(total / sorted.length);
  const cheapest = sorted[0];
  const mostExpensive = sorted[sorted.length - 1];
  const spread = Math.max(0, Math.round(Number(mostExpensive.price) - Number(cheapest.price)));
  const trend = spread >= average * 0.15 ? 'mucho margen de ahorro' : 'estable';

  return { average, trend, count: sorted.length, spread, cheapest, mostExpensive };
}

export function getPopularDeals(prices = []) {
  const grouped = getAllPrices(prices).reduce((acc, item) => {
    if (!acc[item.product]) acc[item.product] = [];
    acc[item.product].push(item);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([product, productPrices]) => {
      const sorted = productPrices.sort((a, b) => Number(a.price) - Number(b.price));
      const cheapest = sorted[0];
      const expensive = sorted[sorted.length - 1];
      return {
        product,
        cheapest,
        expensive,
        best: cheapest,
        savings: getSavingsOpportunity(sorted),
        observations: sorted.length,
      };
    })
    .filter((deal) => deal.cheapest && deal.expensive && deal.observations >= 2 && deal.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 8);
}

export function buildWhatsAppUrl(prices) {
  return `https://wa.me/?text=${encodeURIComponent(buildShareText(prices))}`;
}

export function buildMontevideoGrowthContent(prices = []) {
  const deals = getPopularDeals(filterMontevideoLaunchPrices(prices)).slice(0, 5);
  return deals.map((deal, index) => {
    const product = deal.cheapest?.displayName || formatProductName(deal.product);
    const cheapestStore = deal.cheapest?.store || 'Montevideo';
    const expensiveStore = deal.expensive?.store || 'otro supermercado';
    const savings = Number(deal.savings || 0);
    const shareText = buildShareText([deal.cheapest, deal.expensive].filter(Boolean));
    const hooks = [
      `Donde esta mas barato hoy en Montevideo: ${product}`,
      `No compres ${product} sin comparar ${cheapestStore} vs ${expensiveStore}`,
      `Ahorra $${savings} en 10 segundos con ${product}`,
      `Montevideo: este producto cambia $${savings} entre supermercados`,
      `El precio mas bajo que encontramos hoy: ${product} en ${cheapestStore}`,
    ];
    return {
      id: `montevideo-content-${deal.product}-${index}`,
      product,
      hook: hooks[index % hooks.length],
      whatsappText: shareText,
      tiktokScript: [
        `Plano 1 (0-3s): mostra ${product} y texto: "${hooks[index % hooks.length]}".`,
        `Plano 2 (3-12s): compara ${cheapestStore} a $${Number(deal.cheapest?.price || 0)} contra ${expensiveStore} a $${Number(deal.expensive?.price || 0)}.`,
        `Plano 3 (12-20s): remata con "Estoy ahorrando $${savings} en Montevideo usando AhorroYA".`,
        'Cierre (20-25s): abrir la app y buscar el producto.',
      ].join(' '),
      savings,
      cheapestStore,
      expensiveStore,
    };
  });
}
