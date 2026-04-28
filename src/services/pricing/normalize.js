import crypto from 'node:crypto';
import { z } from 'zod';

export const rawPriceSchema = z.object({
  sourceCode: z.string().min(2),
  countryCode: z.string().length(2),
  productName: z.string().min(1),
  storeName: z.string().optional().default('Mercado oficial'),
  regionName: z.string().optional().default('Nacional'),
  currency: z.string().length(3),
  price: z.coerce.number().positive(),
  unit: z.string().optional().default('unidad'),
  observedAt: z.coerce.date(),
  effectiveAt: z.coerce.date().optional(),
  externalId: z.string().optional(),
  qualityScore: z.coerce.number().min(0).max(100).default(90),
  payload: z.unknown().optional(),
});

export function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, ' ');
}

export function checksum(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function canonicalPrice(raw) {
  const parsed = rawPriceSchema.parse(raw);
  const normalizedProduct = normalizeText(parsed.productName);
  const normalizedStore = normalizeText(parsed.storeName);
  const observedAt = parsed.observedAt.toISOString();
  const effectiveAt = (parsed.effectiveAt || parsed.observedAt).toISOString();
  const idempotencyKey = parsed.externalId || checksum({
    source: parsed.sourceCode,
    product: normalizedProduct,
    store: normalizedStore,
    price: parsed.price,
    observedAt,
  });

  return {
    source_code: parsed.sourceCode,
    country_code: parsed.countryCode,
    product_name: parsed.productName.trim(),
    normalized_product: normalizedProduct,
    store_name: parsed.storeName.trim(),
    normalized_store: normalizedStore,
    region_name: parsed.regionName.trim(),
    currency: parsed.currency.toUpperCase(),
    price: Number(parsed.price),
    unit: parsed.unit.trim(),
    observed_at: observedAt,
    effective_at: effectiveAt,
    ingested_at: new Date().toISOString(),
    idempotency_key: idempotencyKey,
    payload_checksum: checksum(parsed.payload || raw),
    quality_score: parsed.qualityScore,
    moderation_status: 'approved',
    raw_payload: parsed.payload || raw,
  };
}

export function normalizeRows(rows) {
  return rows.map(canonicalPrice);
}
