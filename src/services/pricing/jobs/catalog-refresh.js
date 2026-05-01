import { scrapeAllCatalogStores } from '../scrapers/catalog-scraper.js';
import { normalizeRows } from '../normalize.js';

export async function runCatalogRefreshJob(queries = [], options = {}) {
  const startedAt = new Date().toISOString();
  const raw = [];
  for (const query of queries) {
    const sources = await scrapeAllCatalogStores(query, options);
    raw.push(...sources.flatMap((source) => source.results || []));
  }
  const prices = normalizeRows(raw.map((row) => ({
    sourceCode: row.source || 'catalog_refresh',
    countryCode: 'UY',
    productName: row.displayName || row.product,
    storeName: row.store,
    regionName: row.region || row.neighborhood || 'Online',
    currency: row.currency || 'UYU',
    price: row.price,
    unit: row.unit || 'unidad',
    observedAt: row.updatedAt || new Date().toISOString(),
    payload: row,
  })).filter((row) => row.productName && row.storeName && row.price));

  return {
    status: 'succeeded',
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    rows_downloaded: raw.length,
    rows_normalized: prices.length,
    prices,
  };
}
