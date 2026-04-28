import { enforceOrigin, handleOptions, rateLimit, setCors } from './_security.js';
import { ALLOWED_ORIGINS, normalizeProduct, supabaseRest } from './supabase/_utils.js';
import { z } from 'zod';

const clickSchema = z.object({
  productLinkId: z.string().uuid().optional().nullable(),
  product: z.string().min(1),
  source: z.string().min(1).max(80).default('result'),
});

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

  const limit = await rateLimit(req, 'product-click', { limit: 100, windowMs: 60_000 });
  if (!limit.ok) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    const body = clickSchema.parse(req.body || {});
    const product = normalizeProduct(body.product);
    const rows = await supabaseRest('product_clicks', {
      method: 'POST',
      body: JSON.stringify({
        product_link_id: isUuid(body.productLinkId) ? body.productLinkId : null,
        product,
      }),
    });

    await supabaseRest('monetization_events', {
      method: 'POST',
      body: JSON.stringify({
        event_name: 'share',
        amount: null,
        currency: 'UYU',
        metadata: {
          product,
          productLinkId: body.productLinkId || null,
          source: body.source,
        },
      }),
    }).catch(() => null);

    res.status(200).json(rows?.[0] || null);
  } catch (error) {
    res.status(error instanceof z.ZodError ? 400 : 500).json({ error: error.message || 'Could not save product click' });
  }
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}
