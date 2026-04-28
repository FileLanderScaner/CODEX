import { enforceOrigin, handleOptions, rateLimit, setCors } from './_security.js';
import { ALLOWED_ORIGINS, normalizeProduct, supabaseRest } from './supabase/_utils.js';

export default async function handler(req, res) {
  if (handleOptions(req, res, ALLOWED_ORIGINS)) {
    return;
  }

  setCors(res, ALLOWED_ORIGINS);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const originCheck = enforceOrigin(req, ALLOWED_ORIGINS);
  if (!originCheck.ok) {
    res.status(403).json({ error: originCheck.error });
    return;
  }

  const limit = rateLimit(req, 'product-click', { limit: 120, windowMs: 60_000 });
  if (!limit.ok) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    const body = req.body || {};
    const rows = await supabaseRest('product_clicks', {
      method: 'POST',
      body: JSON.stringify({
        product_link_id: isUuid(body.productLinkId) ? body.productLinkId : null,
        normalized_product: normalizeProduct(body.product),
        source: body.source || 'result',
      }),
    });

    await supabaseRest('monetization_events', {
      method: 'POST',
      body: JSON.stringify({
        type: 'product_click',
        source: body.source || 'result',
        metadata: {
          product: normalizeProduct(body.product),
          productLinkId: body.productLinkId || null,
        },
      }),
    }).catch(() => null);

    res.status(200).json(rows?.[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Could not save product click' });
  }
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}
