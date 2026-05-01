import { z } from 'zod';
import { runEndpoint, validate } from './_utils.js';
import { supabaseRest } from '../supabase/_utils.js';

const eventSchema = z.object({
  event_name: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export default function events(req, res) {
  return runEndpoint(req, res, ['POST'], 'events', async (_req, _res, reqId) => {
    const body = validate(eventSchema, req.body);

    // Guardar en monetization_events (reutilizar tabla existente)
    const rows = await supabaseRest('monetization_events', {
      method: 'POST',
      body: JSON.stringify({
        event_name: body.event_name,
        event_type: body.event_name, // legacy compatibility
        metadata: body.metadata || {},
        amount: body.metadata?.amount || null,
        currency: body.metadata?.currency || 'UYU',
      }),
    });

    json(res, 201, { data: rows?.[0] || null }, reqId);
  });
}