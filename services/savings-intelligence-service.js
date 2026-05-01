import { normalizeComparableProduct, pricePerUnit } from './product-normalizer';
import { getAllPrices, normalizeProduct, normalizeStoreKey } from './price-service';

const SYNONYMS = new Map([
  ['yerba mate', ['yerba', 'mate']],
  ['refresco', ['gaseosa', 'bebida cola', 'cola']],
  ['panales', ['panal', 'panales', 'pañales', 'pañal', 'diapers']],
  ['leche', ['milk', 'lactea', 'lacteo']],
  ['arroz', ['rice']],
  ['asado', ['carne', 'tira de asado', 'parrilla']],
]);

function tokens(value) {
  return normalizeProduct(value).split(' ').filter(Boolean);
}

function editDistance(a, b) {
  const left = normalizeProduct(a);
  const right = normalizeProduct(b);
  if (!left || !right) return Math.max(left.length, right.length);
  const dp = Array.from({ length: left.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= right.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[left.length][right.length];
}

export function expandQuery(query) {
  const normalized = normalizeProduct(query);
  const expanded = new Set([normalized]);
  for (const [canonical, alternatives] of SYNONYMS.entries()) {
    if (normalized.includes(canonical) || alternatives.some((term) => normalized.includes(normalizeProduct(term)))) {
      expanded.add(canonical);
      alternatives.forEach((term) => expanded.add(normalizeProduct(term)));
    }
  }
  return [...expanded].filter(Boolean);
}

export function rankOffers(query, offers = [], options = {}) {
  const expanded = expandQuery(query);
  const queryTokens = new Set(tokens(expanded.join(' ')));
  const userStore = normalizeStoreKey(options.preferredStore || '');

  return getAllPrices(offers)
    .map((offer) => normalizeComparableProduct(offer, query))
    .map((offer) => {
      const haystack = normalizeProduct(`${offer.displayName} ${offer.product} ${offer.brand} ${offer.category}`);
      const offerTokens = new Set(tokens(haystack));
      const overlap = [...queryTokens].filter((token) => offerTokens.has(token)).length;
      const tokenScore = queryTokens.size ? overlap / queryTokens.size : 0;
      const synonymScore = expanded.some((term) => haystack.includes(term)) ? 1 : 0;
      const typoScore = Math.max(0, 1 - editDistance(query, haystack.slice(0, query.length + 8)) / Math.max(query.length, 1));
      const availabilityScore = Number.isFinite(Number(offer.price)) && Number(offer.price) > 0 ? 1 : 0;
      const trustScore = Math.min(1, Number(offer.trustScore || offer.quality_score || 70) / 100);
      const storeAffinity = userStore && normalizeStoreKey(offer.store) === userStore ? 0.08 : 0;
      const confidence = Math.round(Math.min(0.99, (tokenScore * 0.34) + (synonymScore * 0.2) + (typoScore * 0.16) + (availabilityScore * 0.15) + (trustScore * 0.15) + storeAffinity) * 100);
      return { ...offer, rankingScore: confidence, confidence_score: confidence };
    })
    .filter((offer) => offer.rankingScore >= (options.minScore || 32))
    .sort((a, b) => {
      if (options.sort === 'price') return Number(a.price || Infinity) - Number(b.price || Infinity);
      if (options.sort === 'trust') return Number(b.trustScore || 0) - Number(a.trustScore || 0);
      return Number(b.rankingScore) - Number(a.rankingScore) || Number(a.price || Infinity) - Number(b.price || Infinity);
    });
}

export function findSubstitutes(targetOffer, offers = []) {
  const target = normalizeComparableProduct(targetOffer);
  const targetUnitPrice = target.pricePerUnit || pricePerUnit(target.price, target.unitInfo);
  return getAllPrices(offers)
    .map((offer) => normalizeComparableProduct(offer, target.displayName))
    .filter((offer) => offer.id !== target.id && offer.unitInfo?.unit === target.unitInfo?.unit)
    .map((offer) => {
      const offerUnitPrice = offer.pricePerUnit || pricePerUnit(offer.price, offer.unitInfo);
      const baseline = targetUnitPrice || Number(target.price);
      const candidate = offerUnitPrice || Number(offer.price);
      const savings = Number.isFinite(baseline) && Number.isFinite(candidate) ? Math.max(0, Math.round((baseline - candidate) * (target.unitInfo?.baseAmount || 1))) : 0;
      const familyPack = offer.unitInfo?.baseAmount && target.unitInfo?.baseAmount && offer.unitInfo.baseAmount > target.unitInfo.baseAmount;
      return {
        offer,
        savings,
        reason: familyPack ? 'pack_familiar_menor_precio_unitario' : 'marca_alternativa_mas_barata',
        pricePerUnit: offerUnitPrice,
      };
    })
    .filter((item) => item.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 5);
}

export function optimizeCart(items = [], offers = [], options = {}) {
  const normalizedItems = items.map((item) => ({
    query: typeof item === 'string' ? item : item.product || item.query,
    quantity: Number(typeof item === 'string' ? 1 : item.quantity || 1),
  })).filter((item) => item.query);
  const allOffers = getAllPrices(offers);
  const perItem = normalizedItems.map((item) => ({
    ...item,
    matches: rankOffers(item.query, allOffers, { minScore: 25, sort: 'price' }).slice(0, 8),
  }));

  const byStore = new Map();
  for (const line of perItem) {
    for (const offer of line.matches) {
      const key = normalizeStoreKey(offer.store);
      if (!byStore.has(key)) byStore.set(key, { store: offer.store, lines: [], subtotal: 0, missing: 0 });
      const bucket = byStore.get(key);
      if (!bucket.lines.find((existing) => existing.query === line.query)) {
        bucket.lines.push({ query: line.query, quantity: line.quantity, offer, total: Number(offer.price) * line.quantity });
        bucket.subtotal += Number(offer.price) * line.quantity;
      }
    }
  }

  for (const bucket of byStore.values()) {
    bucket.missing = normalizedItems.length - bucket.lines.length;
    bucket.transportCost = Number(options.transportCost ?? (bucket.missing ? 0 : 120));
    bucket.total = Math.round(bucket.subtotal + bucket.transportCost);
  }

  const singleStore = [...byStore.values()]
    .filter((bucket) => bucket.missing === 0)
    .sort((a, b) => a.total - b.total)[0] || null;

  const splitLines = perItem.map((line) => {
    const offer = line.matches[0] || null;
    return offer ? { query: line.query, quantity: line.quantity, offer, total: Number(offer.price) * line.quantity } : { query: line.query, quantity: line.quantity, offer: null, total: 0 };
  });
  const splitStores = new Set(splitLines.filter((line) => line.offer).map((line) => normalizeStoreKey(line.offer.store)));
  const splitSubtotal = splitLines.reduce((sum, line) => sum + Number(line.total || 0), 0);
  const splitTransportCost = Math.max(0, splitStores.size - 1) * Number(options.extraStoreTransportCost ?? 80);
  const split = {
    lines: splitLines,
    stores: splitStores.size,
    subtotal: Math.round(splitSubtotal),
    transportCost: splitTransportCost,
    total: Math.round(splitSubtotal + splitTransportCost),
    missing: splitLines.filter((line) => !line.offer).length,
  };

  const baseline = [...byStore.values()].filter((bucket) => bucket.missing === 0).sort((a, b) => b.total - a.total)[0] || singleStore;
  const recommended = singleStore && singleStore.total <= split.total ? { strategy: 'single_store', ...singleStore } : { strategy: 'split_stores', ...split };
  const estimatedSavings = baseline ? Math.max(0, Math.round(Number(baseline.total) - Number(recommended.total))) : 0;

  return {
    items: perItem,
    singleStore,
    splitStores: split,
    recommendation: {
      ...recommended,
      estimatedSavings,
      explanation: recommended.strategy === 'single_store'
        ? 'Conviene comprar todo en una tienda porque el ahorro de dividir no compensa el traslado.'
        : 'Conviene dividir la compra porque el menor precio por producto supera el costo estimado de traslado.',
      confidence: Math.round(100 - (split.missing + (singleStore?.missing || 0)) * 12),
    },
  };
}
