import { mockPrices } from '../data/mockPrices';

export const normalizeProduct = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

export const formatProductName = (value) =>
  normalizeProduct(value)
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');

export function getAllPrices(extraPrices = []) {
  return [...extraPrices, ...mockPrices].map((item) => ({
    trustScore: 82,
    status: 'approved',
    reports: 0,
    category: 'Supermercado',
    unit: 'unidad',
    brand: 'Generico',
    ...item,
    product: normalizeProduct(item.product),
    normalizedProduct: normalizeProduct(item.product),
  }));
}

export function searchPrices(query, extraPrices = [], filters = {}) {
  const normalizedQuery = normalizeProduct(query);
  const allPrices = getAllPrices(extraPrices);

  if (!normalizedQuery) {
    return [];
  }

  return allPrices
    .filter((item) => {
      const haystack = normalizeProduct(`${item.product} ${item.displayName} ${item.store} ${item.neighborhood} ${item.brand}`);
      const matchesQuery = haystack.includes(normalizedQuery);
      const matchesNeighborhood = !filters.neighborhood || filters.neighborhood === 'Todos' || item.neighborhood === filters.neighborhood;
      return matchesQuery && matchesNeighborhood && item.status !== 'hidden';
    })
    .sort((a, b) => a.price - b.price);
}

export function getCheapest(prices) {
  return prices.length ? prices[0] : null;
}

export function getSavingsOpportunity(prices) {
  if (prices.length < 2) {
    return 0;
  }

  return prices[prices.length - 1].price - prices[0].price;
}

export function getSavingsText(prices) {
  const difference = getSavingsOpportunity(prices);
  return `Ahorro estimado: $${difference} frente al mas caro`;
}

export function buildShareText(prices) {
  const cheapest = getCheapest(prices);
  if (!cheapest) {
    return 'Estoy comparando precios con AhorroYA.';
  }

  const difference = getSavingsOpportunity(prices);
  return `AhorroYA te muestra esto en segundos:\n${cheapest.displayName}: $${cheapest.price} en ${cheapest.store}.\nAhorro estimado: $${difference}.\nCompara antes de comprar.`;
}

export function getPriceStats(prices) {
  if (!prices.length) {
    return null;
  }

  const total = prices.reduce((sum, item) => sum + Number(item.price), 0);
  const average = Math.round(total / prices.length);
  const cheapest = prices[0];
  const mostExpensive = prices[prices.length - 1];
  const spread = mostExpensive.price - cheapest.price;
  const trend = spread >= average * 0.15 ? 'mucho margen de ahorro' : 'estable';

  return {
    average,
    trend,
    count: prices.length,
    spread,
  };
}

export function getPopularDeals(extraPrices = []) {
  const grouped = getAllPrices(extraPrices).reduce((acc, item) => {
    if (!acc[item.product]) {
      acc[item.product] = [];
    }
    acc[item.product].push(item);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([product, prices]) => {
      const sorted = prices.sort((a, b) => a.price - b.price);
      return {
        product,
        best: sorted[0],
        savings: getSavingsOpportunity(sorted),
      };
    })
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 4);
}
