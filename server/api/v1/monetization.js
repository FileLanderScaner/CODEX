import { z } from 'zod';
import { json, optionalUser, runEndpoint, supabaseRest, validate } from './_utils.js';

const leadSchema = z.object({
  company: z.string().trim().min(2),
  contactName: z.string().trim().min(2),
  email: z.string().email(),
  phone: z.string().optional().default(''),
  segment: z.enum(['brand', 'supermarket', 'agency', 'data_b2b', 'other']).default('other'),
  message: z.string().trim().min(5).max(2000),
});

const affiliateSchema = z.object({
  product: z.string().optional().default(''),
  store: z.string().min(1),
  targetUrl: z.string().url(),
  campaign: z.string().optional().default('organic'),
});

const adEventSchema = z.object({
  campaignId: z.string().uuid().optional(),
  slot: z.string().min(1),
  event: z.enum(['impression', 'click']),
  product: z.string().optional().default(''),
  category: z.string().optional().default(''),
});

export function commercialLead(req, res) {
  return runEndpoint(req, res, ['POST'], 'commercial-leads', async (_req, _res, reqId) => {
    const body = validate(leadSchema, req.body);
    const rows = await supabaseRest('commercial_leads', {
      method: 'POST',
      body: JSON.stringify({
        company: body.company,
        contact_name: body.contactName,
        email: body.email,
        phone: body.phone,
        segment: body.segment,
        message: body.message,
        status: 'new',
      }),
    });
    json(res, 201, { data: rows?.[0] || null }, reqId);
  });
}

export function affiliateRedirect(req, res) {
  return runEndpoint(req, res, ['GET'], 'affiliate-redirect', async (_req, _res, reqId) => {
    const query = validate(affiliateSchema, req.query);
    const user = await optionalUser(req).catch(() => null);
    const rows = await supabaseRest('affiliate_clicks', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user?.id || null,
        product: query.product,
        store: query.store,
        target_url: query.targetUrl,
        campaign: query.campaign,
        referrer: req.headers.referer || '',
      }),
    }).catch(() => []);
    const clickId = rows?.[0]?.id || reqId;
    const url = new URL(query.targetUrl);
    url.searchParams.set('utm_source', 'ahorroya');
    url.searchParams.set('utm_medium', 'affiliate');
    url.searchParams.set('utm_campaign', query.campaign);
    url.searchParams.set('ay_click_id', clickId);
    res.status(302).setHeader('Location', url.toString()).end();
  });
}

export function adEvent(req, res) {
  return runEndpoint(req, res, ['POST'], 'ad-events', async (_req, _res, reqId) => {
    const body = validate(adEventSchema, req.body);
    const user = await optionalUser(req).catch(() => null);
    const table = body.event === 'click' ? 'ad_clicks' : 'ad_impressions';
    const rows = await supabaseRest(table, {
      method: 'POST',
      body: JSON.stringify({
        user_id: user?.id || null,
        campaign_id: body.campaignId || null,
        slot: body.slot,
        product: body.product,
        category: body.category,
      }),
    });
    json(res, 201, { data: rows?.[0] || null }, reqId);
  });
}

export function b2bDashboard(req, res) {
  return runEndpoint(req, res, ['GET'], 'b2b-dashboard', async (_req, _res, reqId) => {
    const [events, clicks, leads] = await Promise.all([
      supabaseRest('monetization_events?select=event_name,metadata,amount,currency,created_at&order=created_at.desc&limit=500').catch(() => []),
      supabaseRest('affiliate_clicks?select=product,store,campaign,created_at&order=created_at.desc&limit=500').catch(() => []),
      supabaseRest('commercial_leads?select=segment,status,created_at&order=created_at.desc&limit=200').catch(() => []),
    ]);
    const productDemand = new Map();
    events.forEach((event) => {
      const product = event.metadata?.product || event.metadata?.search_query;
      if (product) productDemand.set(product, (productDemand.get(product) || 0) + 1);
    });
    json(res, 200, {
      generated_at: new Date().toISOString(),
      top_products: [...productDemand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([product, searches]) => ({ product, searches })),
      affiliate_clicks: clicks.length,
      leads_by_segment: leads.reduce((acc, lead) => ({ ...acc, [lead.segment]: (acc[lead.segment] || 0) + 1 }), {}),
      csv_export_url: '/api/v1/b2b/export.csv',
    }, reqId);
  });
}

export function b2bExportCsv(req, res) {
  return runEndpoint(req, res, ['GET'], 'b2b-export-csv', async (_req, _res, reqId) => {
    const events = await supabaseRest('monetization_events?select=event_name,metadata,amount,currency,created_at&order=created_at.desc&limit=5000').catch(() => []);
    const rows = [['event_name', 'product', 'store', 'amount', 'currency', 'created_at']];
    events.forEach((event) => {
      rows.push([
        event.event_name || '',
        event.metadata?.product || event.metadata?.search_query || '',
        event.metadata?.store || '',
        event.amount || '',
        event.currency || '',
        event.created_at || '',
      ]);
    });
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ahorroya-b2b-demand.csv"');
    res.setHeader('X-Request-Id', reqId);
    res.status(200).send(csv);
  });
}
