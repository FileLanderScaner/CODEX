import { enforceOrigin, handleOptions, rateLimit, setCors } from './_security.js';
import { getUserFromAccessToken } from './supabase/_auth.js';
import { ALLOWED_ORIGINS, normalizeProduct, supabaseRest } from './supabase/_utils.js';
import { getBearerToken } from './_security.js';

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

  const limit = await rateLimit(req, 'prices', { limit: 100, windowMs: 60_000 });
  if (!limit.ok) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    const body = req.body || {};
    const product = normalizeProduct(body.product);
    const price = Number(body.price);

    if (!product || !price || !body.store) {
      res.status(400).json({ error: 'Missing product, price or store' });
      return;
    }

    const accessToken = getBearerToken(req);
    const user = await getUserFromAccessToken(accessToken);

    const rows = await supabaseRest('prices', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user?.id || null,
        product,
        normalized_product: product,
        display_name: body.displayName || `${product} ${body.unit || ''}`.trim(),
        brand: body.brand || 'Sin marca',
        category: body.category || 'General',
        unit: body.unit || 'unidad',
        store: body.store,
        neighborhood: body.neighborhood || 'Cerca tuyo',
        price,
        currency: 'UYU',
        status: 'pending',
        trust_score: 70,
      }),
    });

    res.status(200).json(rows?.[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Could not save price' });
  }
}
