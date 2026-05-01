import { CATALOG_STORES, searchCatalogCommerce } from '../../../../services/catalog-service.js';

const DEFAULT_DELAY_MS = 350;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scrapeCatalogStore(storeKey, query, options = {}) {
  const adapter = CATALOG_STORES.find((store) => store.key === storeKey || store.store === storeKey);
  if (!adapter) throw new Error(`Unknown catalog store: ${storeKey}`);
  if (options.respectRobots === false) throw new Error('Scraping requires explicit robots/ToS review; pass a compliant adapter instead.');
  await sleep(Number(options.delayMs ?? DEFAULT_DELAY_MS));
  return searchCatalogCommerce(adapter, query);
}

export async function scrapeAllCatalogStores(query, options = {}) {
  const results = [];
  for (const adapter of CATALOG_STORES) {
    try {
      results.push(await scrapeCatalogStore(adapter.key, query, options));
    } catch (error) {
      results.push({ store: adapter.store, status: 'error', errors: [error.message], results: [] });
    }
  }
  return results;
}
