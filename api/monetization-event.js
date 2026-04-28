import { enforceOrigin, handleOptions, rateLimit, setCors } from './_security.js';
import { ALLOWED_ORIGINS, supabaseRest } from './supabase/_utils.js';

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

  const limit = rateLimit(req, 'monetization', { limit: 120, windowMs: 60_000 });
  if (!limit.ok) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    const body = req.body || {};
    const rows = await supabaseRest('monetization_events', {
      method: 'POST',
      body: JSON.stringify({
        type: body.type || 'unknown',
        source: body.source || null,
        value: body.value ?? null,
        metadata: body.metadata || {},
      }),
    });

    res.status(200).json(rows?.[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Could not save monetization event' });
  }
}
