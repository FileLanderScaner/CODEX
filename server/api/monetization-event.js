import { enforceOrigin, handleOptions, rateLimit, setCors } from './_security.js';
import { ALLOWED_ORIGINS, supabaseRest } from './supabase/_utils.js';
import { z } from 'zod';
import { getBearerToken } from './_security.js';
import { getUserFromAccessToken } from './supabase/_auth.js';

const eventSchema = z.object({
  eventName: z.enum(['search_product', 'view_best_price', 'share', 'click_whatsapp', 'add_favorite', 'create_alert', 'premium_click']),
  amount: z.coerce.number().optional().nullable(),
  currency: z.string().length(3).optional().default('UYU'),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
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

  const limit = await rateLimit(req, 'monetization', { limit: 100, windowMs: 60_000 });
  if (!limit.ok) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    const body = eventSchema.parse(req.body || {});
    const user = await getUserFromAccessToken(getBearerToken(req));
    const rows = await supabaseRest('monetization_events', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user?.id || null,
        event_name: body.eventName,
        amount: body.amount ?? null,
        currency: body.currency,
        metadata: body.metadata,
      }),
    });

    res.status(200).json(rows?.[0] || null);
  } catch (error) {
    res.status(error instanceof z.ZodError ? 400 : 500).json({ error: error.message || 'Could not save monetization event' });
  }
}
