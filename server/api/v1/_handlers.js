import { z } from 'zod';
import { readEnv } from '../../../lib/env.js';
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

function normalizeStoreKey(value) {
  return normalizeLegacyText(value).replace(/[^a-z0-9]/g, '');
}

function isMontevideoLaunchStore(value) {
  return new Set(['disco', 'tiendainglesa', 'devoto', 'tata']).has(normalizeStoreKey(value));
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

function growthRow(row) {
  return {
    id: row.id,
    product: row.normalized_product || normalizeLegacyText(row.product_name || row.product || row.products?.name),
    productName: row.product_name || row.display_name || row.products?.name || row.product,
    store: row.store_name || row.stores?.name || row.store,
    region: row.region_name || row.regions?.name || row.neighborhood || 'Montevideo',
    price: Number(row.price),
    currency: row.currency || 'UYU',
    observedAt: row.observed_at || row.created_at,
  };
}

async function readMontevideoLaunchPrices() {
  const query = { country: 'UY', limit: 100, offset: 0 };
  let rows;
  try {
    ({ data: rows } = await supabaseRestWithMeta(buildPricesPath(query)));
  } catch (error) {
    if (!isMissingRelationError(error)) throw error;
    ({ data: rows } = await legacyPricesList(query));
  }
  return rows.map(growthRow).filter((row) => row.id && row.product && row.store && Number.isFinite(row.price) && isMontevideoLaunchStore(row.store));
}

function buildGrowthDeals(rows) {
  const grouped = rows.reduce((acc, row) => {
    if (!acc[row.product]) acc[row.product] = [];
    acc[row.product].push(row);
    return acc;
  }, {});

  return Object.values(grouped)
    .map((productRows) => {
      const sorted = [...productRows].sort((a, b) => Number(a.price) - Number(b.price));
      const cheapest = sorted[0];
      const expensive = sorted[sorted.length - 1];
      return {
        product: cheapest?.productName || cheapest?.product,
        cheapest,
        expensive,
        savings: cheapest && expensive && cheapest.id !== expensive.id ? Math.max(0, Math.round(Number(expensive.price) - Number(cheapest.price))) : 0,
        observations: sorted.length,
      };
    })
    .filter((deal) => deal.observations >= 2 && deal.savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .slice(0, 5);
}

function shareTextForGrowth(deal) {
  const baseUrl = (readEnv().APP_URL || 'https://codex-kohl-mu.vercel.app').replace(/\/+$/, '');
  const productUrl = `${baseUrl}/app/buscar?q=${encodeURIComponent(deal.cheapest.product)}`;
  return `Estoy ahorrando $${deal.savings} en ${deal.product} en ${deal.cheapest.store} usando AhorroYA 👉 ${productUrl}`;
}

function scriptForDeal(deal, index) {
  const hooks = [
    `Donde esta mas barato hoy en Montevideo: ${deal.product}`,
    `No compres ${deal.product} en ${deal.expensive.store} sin mirar ${deal.cheapest.store}`,
    `Ahorra $${deal.savings} en 10 segundos con ${deal.product}`,
    `Montevideo: ${deal.product} cambia $${deal.savings} segun el super`,
    `El precio mas bajo de hoy: ${deal.product} en ${deal.cheapest.store}`,
  ];
  const hook = hooks[index % hooks.length];
  return {
    hook,
    whatsapp_text: shareTextForGrowth(deal),
    tiktok_script: `0-3s: ${hook}. 3-12s: mostrar ${deal.cheapest.store} a $${deal.cheapest.price} y ${deal.expensive.store} a $${deal.expensive.price}. 12-20s: decir "Estoy ahorrando $${deal.savings} usando AhorroYA". 20-25s: cerrar con buscar ${deal.cheapest.product} en la app.`,
    product: deal.product,
    cheapest_store: deal.cheapest.store,
    expensive_store: deal.expensive.store,
    savings: deal.savings,
  };
}

async function countEventsToday(eventName) {
  const today = new Date().toISOString().slice(0, 10);
  const path = `monetization_events?select=id&event_name=eq.${encodeFilterValue(eventName)}&created_at=gte.${encodeFilterValue(`${today}T00:00:00.000Z`)}&limit=1`;
  return supabaseRestWithMeta(path).then(({ total }) => total || 0).catch(() => 0);
}

async function readGrowthEventsToday() {
  const today = new Date().toISOString().slice(0, 10);
  const path = `monetization_events?select=event_name,amount,currency,metadata,created_at&created_at=gte.${encodeFilterValue(`${today}T00:00:00.000Z`)}&order=created_at.desc&limit=1000`;
  return supabaseRest(path).catch(() => []);
}

function eventMetadata(row) {
  if (!row?.metadata) return {};
  if (typeof row.metadata === 'string') {
    try {
      return JSON.parse(row.metadata);
    } catch {
      return {};
    }
  }
  return row.metadata;
}

function topSearchedProducts(events) {
  const counts = new Map();
  for (const event of events) {
    if (event.event_name !== 'search_product') continue;
    const metadata = eventMetadata(event);
    const product = normalizeLegacyText(metadata.product || metadata.search_query || '');
    if (!product) continue;
    counts.set(product, (counts.get(product) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([product, searches]) => ({ product, searches }));
}

function averageTimeToFirstResult(events) {
  const values = events
    .filter((event) => event.event_name === 'search_product')
    .map((event) => Number(eventMetadata(event).time_to_first_result_ms))
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
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

export function montevideoGrowthContent(req, res) {
  return runEndpoint(req, res, ['GET'], 'growth-content', async (_req, _res, reqId) => {
    const rows = await readMontevideoLaunchPrices();
    const deals = buildGrowthDeals(rows);
    const [searchesToday, sharesToday, whatsappClicksToday] = await Promise.all([
      countEventsToday('search_product'),
      countEventsToday('share'),
      countEventsToday('click_whatsapp'),
    ]);
    json(res, 200, {
      city: 'Montevideo',
      supermarkets: ['Disco', 'Tienda Inglesa', 'Devoto', 'Ta-Ta'],
      generated_at: new Date().toISOString(),
      social_proof: {
        prices_active: rows.length,
        savings_detected: deals.length,
        searches_today: searchesToday,
        shares_today: sharesToday,
        whatsapp_clicks_today: whatsappClicksToday,
      },
      data: deals.map(scriptForDeal),
    }, reqId);
  });
}

export function montevideoGrowthMetrics(req, res) {
  return runEndpoint(req, res, ['GET'], 'growth-metrics', async (_req, _res, reqId) => {
    const [rows, events] = await Promise.all([
      readMontevideoLaunchPrices(),
      readGrowthEventsToday(),
    ]);
    const deals = buildGrowthDeals(rows);
    const counts = events.reduce((acc, event) => {
      const key = event.event_name || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const shareCount = (counts.share || 0) + (counts.click_whatsapp || 0);
    const totalSavings = deals.reduce((sum, deal) => sum + Number(deal.savings || 0), 0);

    json(res, 200, {
      city: 'Montevideo',
      window: 'today',
      generated_at: new Date().toISOString(),
      funnel: {
        landing_views: counts.landing_view || 0,
        open_app: counts.open_app || 0,
        searches: counts.search_product || 0,
        best_price_views: counts.view_best_price || 0,
        shares: shareCount,
        whatsapp_clicks: counts.click_whatsapp || 0,
        favorites: counts.add_favorite || 0,
        alerts: counts.create_alert || 0,
      },
      activation: {
        prices_active: rows.length,
        supermarkets_active: new Set(rows.map((row) => row.store)).size,
        savings_detected: deals.length,
        total_savings_available: totalSavings,
        avg_time_to_first_result_ms: averageTimeToFirstResult(events),
      },
      top_products: topSearchedProducts(events),
    }, reqId);
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
