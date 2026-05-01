import { z } from 'zod';
import { MONTEVIDEO_SEED_PRICES } from '../../../data/seed-prices.js';
import { fetchUnifiedCatalogPrices } from '../../../services/catalog-service.js';
import { optimizeCart } from '../../../services/savings-intelligence-service.js';
import { json, runEndpoint, validate } from './_utils.js';

const schema = z.object({
  items: z.array(z.object({
    product: z.string().trim().min(1),
    quantity: z.coerce.number().positive().default(1),
  })).min(1).max(40),
  zone: z.string().optional().default('Montevideo'),
  transportCost: z.coerce.number().min(0).optional(),
});

export default function cartOptimize(req, res) {
  return runEndpoint(req, res, ['POST'], 'cart-optimize', async (_req, _res, reqId) => {
    const body = validate(schema, req.body);
    const catalogResults = await Promise.allSettled(body.items.map((item) => fetchUnifiedCatalogPrices(item.product)));
    const catalogPrices = catalogResults.flatMap((result) => (result.status === 'fulfilled' ? result.value.data || [] : []));
    const result = optimizeCart(body.items, [...MONTEVIDEO_SEED_PRICES, ...catalogPrices], {
      zone: body.zone,
      transportCost: body.transportCost,
    });
    json(res, 200, {
      generated_at: new Date().toISOString(),
      zone: body.zone,
      data: result,
    }, reqId);
  });
}
