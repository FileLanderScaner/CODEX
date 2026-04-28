import { enforceOrigin, getBearerToken, handleOptions, rateLimit, setCors } from './_security.js';
import { getUserFromAccessToken } from './supabase/_auth.js';
import { ALLOWED_ORIGINS, supabaseRest } from './supabase/_utils.js';

export default async function handler(req, res) {
  if (handleOptions(req, res, ALLOWED_ORIGINS)) {
    return;
  }

  setCors(res, ALLOWED_ORIGINS);

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const originCheck = enforceOrigin(req, ALLOWED_ORIGINS);
    if (!originCheck.ok) {
      res.status(403).json({ error: originCheck.error });
      return;
    }

    const limit = await rateLimit(req, 'premium-status', { limit: 100, windowMs: 60_000 });
    if (!limit.ok) {
      res.status(429).json({ error: 'Rate limit exceeded' });
      return;
    }

    const accessToken = getBearerToken(req);
    const user = await getUserFromAccessToken(accessToken);
    const email = String(user?.email || req.query.email || '').trim().toLowerCase();
    if (!email && !user?.id) {
      res.status(200).json({ isPremium: false });
      return;
    }

    const rows = await supabaseRest(
      `premium_orders?select=id,status,email&email=eq.${encodeURIComponent(email)}&status=eq.COMPLETED&limit=1`,
      { method: 'GET' },
    );

    res.status(200).json({ isPremium: Boolean(rows?.length) });
  } catch (error) {
    res.status(200).json({ isPremium: false });
  }
}
