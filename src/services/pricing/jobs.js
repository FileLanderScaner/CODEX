import { adapters } from './adapters/index.js';
import { persistCanonicalPrices } from './persistence.js';

export async function runPricingJob(sourceCode, options = {}) {
  const adapter = adapters[sourceCode];
  if (!adapter) {
    throw new Error(`Unknown pricing source: ${sourceCode}`);
  }

  const startedAt = new Date().toISOString();
  const result = await adapter.ingest(options);
  const persisted = options.dryRun ? { inserted: 0, latestUpdated: 0 } : await persistCanonicalPrices(result.prices);

  return {
    source_code: sourceCode,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    status: 'succeeded',
    rows_downloaded: result.rawCount,
    rows_normalized: result.prices.length,
    ...persisted,
    metrics: result.metrics || {},
  };
}
