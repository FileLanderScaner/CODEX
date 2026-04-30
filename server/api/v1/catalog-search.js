import { z } from 'zod';
import { fetchUnifiedCatalogPrices } from '../../../services/catalog-service.js';
import { json, runEndpoint, validate } from './_utils.js';

const catalogSearchSchema = z.object({
  q: z.string().trim().min(1),
});

export default function catalogSearch(req, res) {
  return runEndpoint(req, res, ['GET'], 'catalog-search', async (_req, _res, reqId) => {
    const query = validate(catalogSearchSchema, req.query);
    const payload = await fetchUnifiedCatalogPrices(query.q);
    json(res, 200, payload, reqId);
  });
}
