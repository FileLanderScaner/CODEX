import { z } from 'zod';
import { createPayPalSubscription } from '../paypal/_utils.js';
import {
  buildPageMeta,
  encodeFilterValue,
  ilikeFilter,
  json,
  paginationSchema,
  requireRole,
  requireUser,
  runEndpoint,
  supabaseRest,
  supabaseRestWithMeta,
  validate,
  cronAuthorized,
} from './_utils.js';

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

const uuidSchema = z.string().uuid();

const favoriteSchema = z.object({
  product: z.string().min(1).optional(),
  price_id: uuidSchema.optional(),
  priceId: uuidSchema.optional(),
}).refine((body) => body.product || body.price_id || body.priceId, {
  message: 'product or priceId is required',
});

const reportSchema = z.object({
  price_id: uuidSchema.optional(),
  priceId: uuidSchema.optional(),
  product: z.string().min(1).optional(),
  store: z.string().min(1).optional(),
  reason: z.string().min(3).max(500),
});

const billingCreateSchema = z.object({
  plan: z.enum(['premium_monthly', 'premium_yearly', 'monthly', 'yearly']).default('premium_monthly'),
});

const approvePriceSchema = z.object({
  id: uuidSchema,
});

const importOptionsSchema = z.object({
  dryRun: z.coerce.boolean().optional(),
  url: z.string().url().optional(),
  content: z.string().optional(),
  fixturePath: z.string().min(1).optional(),
}).passthrough();

export function listHandler(table, select = '*') {
  return (req, res) => runEndpoint(req, res, ['GET'], table, async (_req, _res, reqId) => {
    const query = validate(paginationSchema, req.query);
    const { data, total } = await supabaseRestWithMeta(`${table}?select=${encodeURIComponent(select)}&limit=${query.limit}&offset=${query.offset}`);
    json(res, 200, { data, pagination: buildPageMeta(query, total) }, reqId);
  });
}

function dateRangeFilters(query, column = 'observed_at') {
  const filters = [];
  if (query.date) {
    const nextDate = new Date(`${query.date}T00:00:00.000Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    filters.push(`${column}=gte.${encodeFilterValue(`${query.date}T00:00:00.000Z`)}`);
    filters.push(`${column}=lt.${encodeFilterValue(nextDate.toISOString())}`);
    return filters;
  }
  if (query.from) {
    filters.push(`${column}=gte.${encodeFilterValue(`${query.from}T00:00:00.000Z`)}`);
  }
  if (query.to) {
    filters.push(`${column}=lte.${encodeFilterValue(`${query.to}T23:59:59.999Z`)}`);
  }
  return filters;
}

function isMissingRelationError(error) {
  const message = String(error?.message || '');
  return message.includes('schema cache') || message.includes('Could not find the table');
}

function normalizeLegacyText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function legacySlug(value) {
  return normalizeLegacyText(value || 'general').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
}

function legacyCountryAllowed(query) {
  return !query.country || query.country === 'UY';
}

function buildLegacyPricesPath(query, overrides = {}) {
  const effective = { ...query, ...overrides };
  const params = [
    'select=*',
    'status=eq.approved',
    `limit=${effective.limit}`,
    `offset=${effective.offset}`,
    'order=created_at.desc',
  ];

  if (effective.q) params.push(`normalized_product=${ilikeFilter(effective.q)}`);
  if (effective.currency) params.push(`currency=eq.${encodeFilterValue(effective.currency)}`);
  if (effective.brand) params.push(`brand=${ilikeFilter(effective.brand)}`);
  if (effective.category) params.push(`category=${ilikeFilter(effective.category)}`);
  if (effective.region) params.push(`neighborhood=${ilikeFilter(effective.region)}`);
  params.push(...dateRangeFilters(effective, 'created_at'));

  return `prices?${params.join('&')}`;
}

function mapLegacyPrice(row) {
  return {
    id: row.id,
    source_code: 'community_prices',
    country_code: 'UY',
    product_name: row.display_name || row.product,
    normalized_product: row.normalized_product || normalizeLegacyText(row.product),
    store_name: row.store,
    normalized_store: normalizeLegacyText(row.store),
    region_name: row.neighborhood || 'Montevideo',
    price: row.price,
    currency: row.currency || 'UYU',
    unit: row.unit || 'unidad',
    observed_at: row.created_at,
    effective_at: row.updated_at || row.created_at,
    quality_score: row.trust_score || 70,
    moderation_status: row.status === 'approved' ? 'approved' : 'pending',
    products: {
      name: row.display_name || row.product,
      brands: { name: row.brand || 'Sin marca', normalized_name: normalizeLegacyText(row.brand || 'Sin marca') },
      categories: { name: row.category || 'General', slug: legacySlug(row.category || 'General') },
    },
    stores: { name: row.store },
    regions: { name: row.neighborhood || 'Montevideo' },
  };
}

async function legacyPricesList(query) {
  if (!legacyCountryAllowed(query)) {
    return { data: [], total: 0 };
  }
  const { data, total } = await supabaseRestWithMeta(buildLegacyPricesPath(query));
  return { data: data.map(mapLegacyPrice), total };
}

async function legacyCatalogRows(query) {
  if (!legacyCountryAllowed(query)) {
    return [];
  }
  const { data } = await supabaseRestWithMeta(buildLegacyPricesPath(query, { limit: 1000, offset: 0 }));
  return data;
}

function paginateDerived(rows, query) {
  return {
    data: rows.slice(query.offset, query.offset + query.limit),
    total: rows.length,
  };
}

async function legacyProductsList(query) {
  const seen = new Map();
  for (const row of await legacyCatalogRows(query)) {
    const key = row.normalized_product || normalizeLegacyText(row.product);
    if (seen.has(key)) continue;
    seen.set(key, {
      id: `legacy-product-${legacySlug(key)}`,
      name: row.display_name || row.product,
      normalized_name: key,
      default_unit: row.unit || 'unidad',
      moderation_status: 'approved',
      created_at: row.created_at,
      updated_at: row.updated_at || row.created_at,
      brands: { name: row.brand || 'Sin marca', normalized_name: normalizeLegacyText(row.brand || 'Sin marca') },
      categories: { name: row.category || 'General', slug: legacySlug(row.category || 'General') },
      latest_price: {
        price: row.price,
        currency: row.currency || 'UYU',
        store: row.store,
        neighborhood: row.neighborhood || 'Montevideo',
      },
    });
  }
  return paginateDerived([...seen.values()], query);
}

async function legacyStoresList(query) {
  const seen = new Map();
  for (const row of await legacyCatalogRows(query)) {
    const key = normalizeLegacyText(row.store);
    if (seen.has(key)) continue;
    seen.set(key, {
      id: `legacy-store-${legacySlug(key)}`,
      name: row.store,
      normalized_name: key,
      country_code: 'UY',
      created_at: row.created_at,
      store_locations: [{ regions: { name: row.neighborhood || 'Montevideo' } }],
    });
  }
  return paginateDerived([...seen.values()], query);
}

async function legacyCategoriesList(query) {
  const seen = new Map();
  for (const row of await legacyCatalogRows(query)) {
    const name = row.category || 'General';
    const key = legacySlug(name);
    if (seen.has(key)) continue;
    seen.set(key, {
      id: `legacy-category-${key}`,
      name,
      slug: key,
      created_at: row.created_at,
    });
  }
  return paginateDerived([...seen.values()], query);
}

function buildProductsPath(query) {
  const hasPriceFilters = Boolean(query.country || query.region || query.currency || query.date || query.from || query.to);
  const brandSelect = query.brand ? 'brands!inner(name,normalized_name)' : 'brands(name,normalized_name)';
  const categorySelect = query.category ? 'categories!inner(name,slug)' : 'categories(name,slug)';
  const observationSelect = hasPriceFilters ? ',price_observations!inner(id)' : '';
  const params = [
    `select=${encodeURIComponent(`*,${brandSelect},${categorySelect}${observationSelect}`)}`,
    'moderation_status=eq.approved',
    `limit=${query.limit}`,
    `offset=${query.offset}`,
    'order=name.asc',
  ];

  if (query.q) {
    params.push(`or=${encodeURIComponent(`(name.ilike.*${query.q}*,normalized_name.ilike.*${query.q}*)`)}`);
  }
  if (query.brand) params.push(`brands.normalized_name=${ilikeFilter(query.brand)}`);
  if (query.category) {
    params.push(`or=${encodeURIComponent(`(categories.slug.eq.${query.category},categories.name.ilike.*${query.category}*)`)}`);
  }
  if (query.country) params.push(`price_observations.country_code=eq.${encodeFilterValue(query.country)}`);
  if (query.currency) params.push(`price_observations.currency=eq.${encodeFilterValue(query.currency)}`);
  if (query.region) params.push(`price_observations.region_name=${ilikeFilter(query.region)}`);
  params.push(...dateRangeFilters(query, 'price_observations.observed_at'));

  return `products?${params.join('&')}`;
}

function buildPricesPath(query) {
  const productSelect = query.brand ? 'products!inner(name,brands!inner(name,normalized_name),categories(name,slug))' : 'products(name,brands(name),categories(name,slug))';
  const params = [
    `select=${encodeURIComponent(`*,${productSelect},stores(name),regions(name)`)}`,
    'moderation_status=eq.approved',
    `limit=${query.limit}`,
    `offset=${query.offset}`,
    'order=observed_at.desc',
  ];

  if (query.q) params.push(`normalized_product=${ilikeFilter(query.q)}`);
  if (query.country) params.push(`country_code=eq.${encodeFilterValue(query.country)}`);
  if (query.currency) params.push(`currency=eq.${encodeFilterValue(query.currency)}`);
  if (query.region) params.push(`region_name=${ilikeFilter(query.region)}`);
  if (query.brand) params.push(`products.brands.normalized_name=${ilikeFilter(query.brand)}`);
  params.push(...dateRangeFilters(query));

  return `price_observations?${params.join('&')}`;
}

function buildStoresPath(query) {
  const hasLocationFilters = Boolean(query.region);
  const hasObservationFilters = Boolean(query.currency || query.brand || query.date || query.from || query.to);
  const locationSelect = hasLocationFilters ? ',store_locations!inner(regions!inner(name))' : ',store_locations(regions(name))';
  const observationSelect = hasObservationFilters ? ',price_observations!inner(products!inner(brands!inner(name,normalized_name)))' : '';
  const params = [
    `select=${encodeURIComponent(`*${locationSelect}${observationSelect}`)}`,
    `limit=${query.limit}`,
    `offset=${query.offset}`,
    'order=name.asc',
  ];

  if (query.q) {
    params.push(`or=${encodeURIComponent(`(name.ilike.*${query.q}*,normalized_name.ilike.*${query.q}*)`)}`);
  }
  if (query.country) params.push(`country_code=eq.${encodeFilterValue(query.country)}`);
  if (query.region) params.push(`store_locations.regions.name=${ilikeFilter(query.region)}`);
  if (query.currency) params.push(`price_observations.currency=eq.${encodeFilterValue(query.currency)}`);
  if (query.brand) params.push(`price_observations.products.brands.normalized_name=${ilikeFilter(query.brand)}`);
  params.push(...dateRangeFilters(query, 'price_observations.observed_at'));

  return `stores?${params.join('&')}`;
}

function buildCategoriesPath(query) {
  const hasProductFilters = Boolean(query.brand);
  const hasObservationFilters = Boolean(query.country || query.region || query.currency || query.date || query.from || query.to);
  let productSelect = '';
  if (hasProductFilters || hasObservationFilters) {
    const brandSelect = hasProductFilters ? 'brands!inner(name,normalized_name)' : 'brands(name,normalized_name)';
    const observationSelect = hasObservationFilters ? ',price_observations!inner(id)' : '';
    productSelect = `,products!inner(${brandSelect}${observationSelect})`;
  }
  const params = [
    `select=${encodeURIComponent(`*${productSelect}`)}`,
    `limit=${query.limit}`,
    `offset=${query.offset}`,
    'order=name.asc',
  ];

  if (query.q || query.category) {
    const term = query.q || query.category;
    params.push(`or=${encodeURIComponent(`(name.ilike.*${term}*,slug.ilike.*${term}*)`)}`);
  }
  if (query.brand) params.push(`products.brands.normalized_name=${ilikeFilter(query.brand)}`);
  if (query.country) params.push(`products.price_observations.country_code=eq.${encodeFilterValue(query.country)}`);
  if (query.currency) params.push(`products.price_observations.currency=eq.${encodeFilterValue(query.currency)}`);
  if (query.region) params.push(`products.price_observations.region_name=${ilikeFilter(query.region)}`);
  params.push(...dateRangeFilters(query, 'products.price_observations.observed_at'));

  return `categories?${params.join('&')}`;
}

export function productsList(req, res) {
  return runEndpoint(req, res, ['GET'], 'products', async (_req, _res, reqId) => {
    const query = validate(paginationSchema, req.query);
    let data;
    let total;
    try {
      ({ data, total } = await supabaseRestWithMeta(buildProductsPath(query)));
    } catch (error) {
      if (!isMissingRelationError(error)) throw error;
      ({ data, total } = await legacyProductsList(query));
    }
    json(res, 200, { data, pagination: buildPageMeta(query, total) }, reqId);
  });
}

export function priceObservationsList(req, res) {
  return runEndpoint(req, res, ['GET'], 'price-observations', async (_req, _res, reqId) => {
    const query = validate(paginationSchema, req.query);
    let data;
    let total;
    try {
      ({ data, total } = await supabaseRestWithMeta(buildPricesPath(query)));
    } catch (error) {
      if (!isMissingRelationError(error)) throw error;
      ({ data, total } = await legacyPricesList(query));
    }
    json(res, 200, { data, pagination: buildPageMeta(query, total) }, reqId);
  });
}

export function storesList(req, res) {
  return runEndpoint(req, res, ['GET'], 'stores', async (_req, _res, reqId) => {
    const query = validate(paginationSchema, req.query);
    let data;
    let total;
    try {
      ({ data, total } = await supabaseRestWithMeta(buildStoresPath(query)));
    } catch (error) {
      if (!isMissingRelationError(error)) throw error;
      ({ data, total } = await legacyStoresList(query));
    }
    json(res, 200, { data, pagination: buildPageMeta(query, total) }, reqId);
  });
}

export function categoriesList(req, res) {
  return runEndpoint(req, res, ['GET'], 'categories', async (_req, _res, reqId) => {
    const query = validate(paginationSchema, req.query);
    let data;
    let total;
    try {
      ({ data, total } = await supabaseRestWithMeta(buildCategoriesPath(query)));
    } catch (error) {
      if (!isMissingRelationError(error)) throw error;
      ({ data, total } = await legacyCategoriesList(query));
    }
    json(res, 200, { data, pagination: buildPageMeta(query, total) }, reqId);
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
    const schema = table === 'price_alerts' ? alertSchema : favoriteSchema;
    const body = validate(schema, req.body);
    const mappedBody = table === 'user_favorites'
      ? { product: body.product || null, price_id: body.price_id || body.priceId || null }
      : bodyMapper(body);
    const rows = await supabaseRest(table, {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, ...mappedBody }),
    });
    return json(res, 201, { data: rows?.[0] || null }, reqId);
  });
}

export function reports(req, res) {
  return runEndpoint(req, res, ['POST'], 'reports', async (_req, _res, reqId) => {
    const user = await requireUser(req);
    const body = validate(reportSchema, req.body);
    const rows = await supabaseRest('reports', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        price_id: body.price_id || body.priceId || null,
        product: body.product || null,
        store: body.store || null,
        reason: body.reason,
        status: 'open',
      }),
    });
    json(res, 201, { data: rows?.[0] || null }, reqId);
  });
}

export function billingCreate(req, res) {
  return runEndpoint(req, res, ['POST'], 'billing-create', async (_req, _res, reqId) => {
    const user = await requireUser(req);
    const body = validate(billingCreateSchema, req.body);
    if (!user.email) {
      const error = new Error('User email is required for PayPal subscription');
      error.statusCode = 400;
      throw error;
    }
    const paypalSubscription = await createPayPalSubscription({ user, plan: body.plan });
    const rows = await supabaseRest('subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        provider: 'paypal',
        provider_subscription_id: paypalSubscription.id,
        provider_plan_id: paypalSubscription.planId,
        plan_code: paypalSubscription.planCode,
        status: paypalSubscription.status?.toLowerCase() || 'approval_pending',
      }),
    });
    json(res, 201, { data: { ...(rows?.[0] || {}), approval_url: paypalSubscription.approvalUrl } }, reqId);
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
    const { id } = validate(approvePriceSchema, req.body);
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
    const options = validate(importOptionsSchema, req.body);
    const { runPricingJob } = await import('../../../src/services/pricing/jobs.js');
    const result = await runPricingJob(req.query.source, options);
    json(res, 202, { data: result }, reqId);
  });
}
