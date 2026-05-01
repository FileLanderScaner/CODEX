import { z } from 'zod';
import { MONTEVIDEO_SEED_PRICES } from '../../../data/seed-prices.js';
import { fetchUnifiedCatalogPrices } from '../../../services/catalog-service.js';
import { rankOffers, findSubstitutes } from '../../../services/savings-intelligence-service.js';
import { json, runEndpoint, validate } from './_utils.js';

const schema = z.object({
  q: z.string().trim().min(1),
  sort: z.enum(['relevance', 'price', 'trust']).optional().default('relevance'),
});

export default function smartSearch(req, res) {
  return runEndpoint(req, res, ['GET'], 'smart-search', async (_req, _res, reqId) => {
    const query = validate(schema, req.query);
    const catalog = await fetchUnifiedCatalogPrices(query.q).catch(() => ({ data: [], sources: [] }));
    const offers = [...MONTEVIDEO_SEED_PRICES, ...(catalog.data || [])];
    const ranked = rankOffers(query.q, offers, { sort: query.sort });
    const best = ranked[0] || null;
    json(res, 200, {
      query: query.q,
      generated_at: new Date().toISOString(),
      ranking: {
        factors: ['precio', 'disponibilidad', 'confianza', 'sinonimos', 'tolerancia_errores'],
        sources_considered: catalog.sources || [],
      },
      data: ranked.slice(0, 30),
      substitutes: best ? findSubstitutes(best, ranked) : [],
    }, reqId);
  });
}
