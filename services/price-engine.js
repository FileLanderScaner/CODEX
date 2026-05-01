import { CATALOG_STORES, buildCatalogLinks } from './catalog-service';
import { getAllPrices, normalizeProduct, normalizeStoreKey } from './price-service';
import { normalizeComparableProduct } from './product-normalizer';

function asPriceList(items = [], query = '') {
  return getAllPrices(items).map((item) => normalizeComparableProduct(item, query));
}

function sourceRank(item) {
  if (String(item.source || '').startsWith('catalog:')) return 3;
  if (String(item.source || '').includes('seed')) return 2;
  return 1;
}

function dedupeOffers(items = []) {
  const bestByKey = new Map();
  for (const item of items) {
    const key = [
      item.comparableKey || item.normalizedProduct,
      normalizeStoreKey(item.store),
      Number.isFinite(Number(item.price)) ? Math.round(Number(item.price) * 100) : 'no-price',
    ].join('|');
    const current = bestByKey.get(key);
    if (!current || sourceRank(item) > sourceRank(current)) {
      bestByKey.set(key, item);
    }
  }
  return [...bestByKey.values()];
}

function fallbackOffer(query, commerceResult, template = null) {
  const store = commerceResult.commerce || commerceResult.store;
  const fallbackUrl = commerceResult.fallbackUrl || commerceResult.searchUrl || buildCatalogLinks(query).find((link) => link.store === store)?.url;
  if (!store || !fallbackUrl) return null;
  const normalized = normalizeComparableProduct({
    id: `fallback-link-${normalizeStoreKey(store)}-${normalizeProduct(query)}`,
    product: normalizeProduct(template?.product || query),
    normalizedProduct: normalizeProduct(template?.normalizedProduct || template?.product || query),
    displayName: template?.displayName || query,
    brand: template?.brand || '',
    unit: template?.unit || '',
    store,
    neighborhood: 'Catalogo online',
    region: 'Online',
    price: null,
    currency: 'UYU',
    updatedAt: commerceResult.generatedAt || new Date().toISOString(),
    source: 'catalog-fallback:official-link',
    status: commerceResult.status || 'linked',
    catalogUrl: fallbackUrl,
    fallbackUrl,
    trustScore: commerceResult.status === 'ok' ? 65 : 45,
  }, query);
  return template ? {
    ...normalized,
    comparableKey: template.comparableKey,
    normalizedName: template.normalizedName,
    unitInfo: template.unitInfo,
  } : normalized;
}

function ensureCommerceCoverage(query, offers, commerceResults = []) {
  const existing = new Set(offers.map((item) => normalizeStoreKey(item.store)));
  const byStore = new Map((commerceResults || []).map((source) => [normalizeStoreKey(source.commerce || source.store), source]));
  const template = offers.find((offer) => Number.isFinite(Number(offer.price)) && Number(offer.price) > 0) || offers[0] || null;
  const fallbackRows = CATALOG_STORES
    .filter((adapter) => !existing.has(normalizeStoreKey(adapter.store)))
    .map((adapter) => fallbackOffer(query, byStore.get(normalizeStoreKey(adapter.store)) || {
      commerce: adapter.store,
      fallbackUrl: adapter.searchUrl(query),
      status: 'linked',
    }, template))
    .filter(Boolean);
  return [...offers, ...fallbackRows];
}

function groupOffers(query, offers = []) {
  const groups = new Map();
  for (const offer of offers) {
    const key = offer.comparableKey || normalizeProduct(offer.displayName || offer.product || query);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(offer);
  }

  return [...groups.entries()].map(([key, groupOffersForProduct]) => {
    const priced = groupOffersForProduct
      .filter((offer) => Number.isFinite(Number(offer.price)) && Number(offer.price) > 0)
      .sort((a, b) => Number(a.price) - Number(b.price));
    const bestOffer = priced[0] || null;
    const highest = priced[priced.length - 1] || bestOffer;
    const difference = bestOffer && highest ? Math.max(0, Math.round(Number(highest.price) - Number(bestOffer.price))) : 0;
    const sample = bestOffer || groupOffersForProduct[0];
    const offersSorted = [
      ...priced,
      ...groupOffersForProduct.filter((offer) => !Number.isFinite(Number(offer.price)) || Number(offer.price) <= 0),
    ].map((offer) => ({
      ...offer,
      isBestOffer: bestOffer ? offer.id === bestOffer.id : false,
      priceDifference: bestOffer && Number.isFinite(Number(offer.price)) ? Math.max(0, Math.round(Number(offer.price) - Number(bestOffer.price))) : null,
    }));

    const confidence = Math.min(98, Math.max(35, Math.round(
      (priced.length >= 2 ? 45 : 25) +
      Math.min(25, groupOffersForProduct.length * 5) +
      Math.max(...groupOffersForProduct.map((offer) => Number(offer.similarity || 0)), 0) * 0.3,
    )));

    return {
      id: `comparison-${key}`,
      type: 'comparison',
      comparableKey: key,
      product: normalizeProduct(sample.product || query),
      normalizedProduct: normalizeProduct(sample.normalizedProduct || sample.product || query),
      displayName: sample.displayName || sample.product || query,
      brand: sample.brand || '',
      unit: sample.unit || '',
      store: bestOffer?.store || 'Catalogos oficiales',
      price: bestOffer?.price ?? null,
      currency: bestOffer?.currency || 'UYU',
      updatedAt: new Date().toISOString(),
      source: 'price-engine',
      trustScore: confidence,
      bestOffer,
      offers: offersSorted,
      commerceCount: new Set(groupOffersForProduct.map((offer) => normalizeStoreKey(offer.store))).size,
      priceDifference: difference,
      confidence,
      catalogUrl: bestOffer?.catalogUrl || bestOffer?.fallbackUrl || '',
    };
  }).sort((a, b) => {
    if (a.bestOffer && !b.bestOffer) return -1;
    if (!a.bestOffer && b.bestOffer) return 1;
    return Number(a.price || Number.MAX_SAFE_INTEGER) - Number(b.price || Number.MAX_SAFE_INTEGER);
  });
}

export function buildPriceComparison({
  query,
  seedPrices = [],
  catalogPrices = [],
  commerceResults = [],
  neighborhood = 'Todos',
} = {}) {
  const normalizedQuery = normalizeProduct(query);
  const seed = asPriceList(seedPrices, normalizedQuery);
  const catalog = asPriceList(catalogPrices, normalizedQuery);
  const merged = dedupeOffers([...catalog, ...seed]).filter((item) => {
    const haystack = normalizeProduct(`${item.product} ${item.displayName} ${item.brand} ${item.store}`);
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery) || Number(item.similarity || 0) >= 35;
    const matchesNeighborhood = !neighborhood || neighborhood === 'Todos' || normalizeProduct(item.neighborhood) === normalizeProduct(neighborhood) || item.region === 'Online';
    return matchesQuery && matchesNeighborhood;
  });
  const covered = ensureCommerceCoverage(normalizedQuery, merged, commerceResults);
  const finalResults = groupOffers(normalizedQuery, covered);
  return {
    partialResults: groupOffers(normalizedQuery, seed),
    finalResults,
    flatResults: finalResults.flatMap((group) => group.offers).filter((offer) => Number.isFinite(Number(offer.price))),
  };
}
