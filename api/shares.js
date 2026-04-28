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

  const limit = rateLimit(req, 'shares', { limit: 60, windowMs: 60_000 });
  if (!limit.ok) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    const body = req.body || {};
    const accessToken = getBearerToken(req);
    const user = await getUserFromAccessToken(accessToken);
    const rows = await supabaseRest('shares', {
      method: 'POST',
      body: JSON.stringify({
        price_id: isUuid(body.priceId) ? body.priceId : null,
        user_id: user?.id || null,
        normalized_product: normalizeProduct(body.product),
        channel: body.channel || 'share',
      }),
    });

    res.status(200).json(rows?.[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Could not save share' });
  }
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}
