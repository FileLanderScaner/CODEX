import { z } from 'zod';
import { runPricingJob } from '../../src/services/pricing/jobs.js';
import { json, paginationSchema, requireRole, requireUser, runEndpoint, supabaseRest, validate, cronAuthorized } from './_utils.js';

const communityPriceSchema = z.object({
  product: z.string().min(1),
  displayName: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().optional(),
  store: z.string().min(1),
  neighborhood: z.string().optional(),
  price: z.coerce.number().positive(),
  currency: z.string().length(3).default('UYU'),
});

const alertSchema = z.object({
  product: z.string().min(1),
  targetPrice: z.coerce.number().positive(),
  currency: z.string().length(3).default('UYU'),
});

export function listHandler(table, select = '*') {
  return (req, res) => runEndpoint(req, res, ['GET'], table, async (_req, _res, reqId) => {
    const query = validate(paginationSchema, req.query);
    const rows = await supabaseRest(`${table}?select=${encodeURIComponent(select)}&limit=${query.limit}&offset=${query.offset}`);
    json(res, 200, { data: rows }, reqId);
  });
}

export function productById(req, res) {
  return runEndpoint(req, res, ['GET'], 'products-id', async (_req, _res, reqId) => {
    const id = req.query.id;
    const rows = await supabaseRest(`products?id=eq.${encodeURIComponent(id)}&select=*`);
    if (!rows?.length) return json(res, 404, { error: 'not_found' }, reqId);
    return json(res, 200, { data: rows[0] }, reqId);
  });
}

export function latestPrices(req, res) {
  return runEndpoint(req, res, ['GET'], 'prices-latest', async (_req, _res, reqId) => {
    const query = validate(paginationSchema, req.query);
    const filter = query.q ? `&normalized_product=ilike.*${encodeURIComponent(query.q)}*` : '';
    const rows = await supabaseRest(`price_current?select=*&limit=${query.limit}&offset=${query.offset}${filter}`);
    json(res, 200, { data: rows }, reqId);
  });
}

export function priceHistory(req, res) {
  return runEndpoint(req, res, ['GET'], 'prices-history', async (_req, _res, reqId) => {
    const productId = req.query.productId;
    const rows = await supabaseRest(`price_observations?product_id=eq.${encodeURIComponent(productId)}&select=*&order=observed_at.desc&limit=100`);
    json(res, 200, { data: rows }, reqId);
  });
}

export function communityPrice(req, res) {
  return runEndpoint(req, res, ['POST'], 'prices-community', async (_req, _res, reqId) => {
    const user = await requireUser(req);
    const body = validate(communityPriceSchema, req.body);
    const rows = await supabaseRest('prices', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        product: body.product.toLowerCase().trim(),
        normalized_product: body.product.toLowerCase().trim(),
        display_name: body.displayName || body.product,
        brand: body.brand || 'Sin marca',
        category: body.category || 'General',
        unit: body.unit || 'unidad',
        store: body.store,
        neighborhood: body.neighborhood || 'Cerca tuyo',
        price: body.price,
        currency: body.currency,
        status: 'pending',
        trust_score: 70,
      }),
    });
    json(res, 201, { data: rows?.[0] || null }, reqId);
  });
}

export function userCollection(table, bodyMapper = (body) => body) {
  return (req, res) => runEndpoint(req, res, ['GET', 'POST', 'DELETE'], table, async (_req, _res, reqId) => {
    const user = await requireUser(req);
    if (req.method === 'GET') {
      const rows = await supabaseRest(`${table}?user_id=eq.${user.id}&select=*`);
      return json(res, 200, { data: rows }, reqId);
    }
    if (req.method === 'DELETE') {
      const id = req.query.id || req.body?.id;
      await supabaseRest(`${table}?id=eq.${encodeURIComponent(id)}&user_id=eq.${user.id}`, { method: 'DELETE' });
      return json(res, 204, {}, reqId);
    }
    const body = table === 'price_alerts' ? validate(alertSchema, req.body) : req.body;
    const rows = await supabaseRest(table, {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, ...bodyMapper(body) }),
    });
    return json(res, 201, { data: rows?.[0] || null }, reqId);
  });
}

export function reports(req, res) {
  return runEndpoint(req, res, ['POST'], 'reports', async (_req, _res, reqId) => {
    const user = await requireUser(req);
    const rows = await supabaseRest('reports', { method: 'POST', body: JSON.stringify({ user_id: user.id, ...req.body, status: 'open' }) });
    json(res, 201, { data: rows?.[0] || null }, reqId);
  });
}

export function billingCreate(req, res) {
  return runEndpoint(req, res, ['POST'], 'billing-create', async (_req, _res, reqId) => {
    const user = await requireUser(req);
    const rows = await supabaseRest('subscriptions', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, provider: 'paypal', plan_code: req.body?.plan || 'premium_monthly', status: 'pending' }),
    });
    json(res, 201, { data: rows?.[0] || null }, reqId);
  });
}

export function billingMe(req, res) {
  return runEndpoint(req, res, ['GET'], 'billing-me', async (_req, _res, reqId) => {
    const user = await requireUser(req);
    const rows = await supabaseRest(`subscriptions?user_id=eq.${user.id}&select=*&order=created_at.desc`);
    json(res, 200, { data: rows }, reqId);
  });
}

export function adminList(table) {
  return (req, res) => runEndpoint(req, res, ['GET'], `admin-${table}`, async (_req, _res, reqId) => {
    await requireRole(req, ['admin', 'moderator', 'internal_job']);
    const rows = await supabaseRest(`${table}?select=*&order=created_at.desc&limit=100`);
    json(res, 200, { data: rows }, reqId);
  });
}

export function approvePrice(req, res) {
  return runEndpoint(req, res, ['POST'], 'admin-approve-price', async (_req, _res, reqId) => {
    await requireRole(req, ['admin', 'moderator']);
    const id = req.body?.id;
    const rows = await supabaseRest(`prices?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
    });
    json(res, 200, { data: rows?.[0] || null }, reqId);
  });
}

export function retryJob(req, res) {
  return runEndpoint(req, res, ['POST'], 'admin-retry-job', async (_req, _res, reqId) => {
    await requireRole(req, ['admin', 'internal_job']);
    const id = req.query.id;
    const rows = await supabaseRest(`source_jobs?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status: 'queued', retry_count: 1 }) });
    json(res, 200, { data: rows?.[0] || null }, reqId);
  });
}

export function internalImport(req, res) {
  return runEndpoint(req, res, ['POST'], 'internal-import', async (_req, _res, reqId) => {
    if (!cronAuthorized(req)) {
      await requireRole(req, ['admin', 'internal_job']);
    }
    const result = await runPricingJob(req.query.source, req.body || {});
    json(res, 202, { data: result }, reqId);
  });
}
