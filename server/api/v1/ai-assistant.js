import { z } from 'zod';
import { MONTEVIDEO_SEED_PRICES } from '../../../data/seed-prices.js';
import { fetchUnifiedCatalogPrices } from '../../../services/catalog-service.js';
import { answerSavingsAssistant } from '../../../services/ai-savings-service.js';
import { json, runEndpoint, validate } from './_utils.js';

const schema = z.object({
  prompt: z.string().trim().min(3).max(800),
  budget: z.coerce.number().positive().optional(),
  zone: z.string().optional().default('Montevideo'),
  preferences: z.record(z.string(), z.unknown()).optional().default({}),
});

function queryHints(prompt) {
  return prompt
    .toLowerCase()
    .split(/,| y | para | con |\n/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3)
    .slice(0, 8);
}

export default function aiAssistant(req, res) {
  return runEndpoint(req, res, ['POST'], 'ai-assistant', async (_req, _res, reqId) => {
    const body = validate(schema, req.body);
    const catalogResults = await Promise.allSettled(queryHints(body.prompt).map((hint) => fetchUnifiedCatalogPrices(hint)));
    const offers = [
      ...MONTEVIDEO_SEED_PRICES,
      ...catalogResults.flatMap((result) => (result.status === 'fulfilled' ? result.value.data || [] : [])),
    ];
    const answer = await answerSavingsAssistant({
      prompt: body.prompt,
      offers,
      preferences: { ...body.preferences, budget: body.budget, zone: body.zone },
      env: process.env,
    });
    json(res, 200, {
      generated_at: new Date().toISOString(),
      data: answer,
    }, reqId);
  });
}
