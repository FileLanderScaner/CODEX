import { MONTEVIDEO_SEED_PRICES } from '../../data/seed-prices.js';
import { getAllPrices, getPopularDeals, getPriceStats, normalizeProduct } from '../../services/price-service.js';
import { optimizeCart } from '../../services/savings-intelligence-service.js';

export class AgentToolbox {
  constructor({ prices = MONTEVIDEO_SEED_PRICES, routes = [], env = process.env } = {}) {
    this.prices = prices;
    this.routes = routes;
    this.env = env;
  }

  getPrices(inputPrices) {
    return getAllPrices(inputPrices || this.prices);
  }

  getPriceStats(prices) {
    return getPriceStats(prices);
  }

  getPopularDeals(prices) {
    return getPopularDeals(prices || this.prices);
  }

  normalizeProduct(value) {
    return normalizeProduct(value);
  }

  optimizeCart(items, prices, options) {
    return optimizeCart(items, prices || this.prices, options);
  }
}
