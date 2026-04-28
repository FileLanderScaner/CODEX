export async function persistCanonicalPrices(prices) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return { inserted: 0, latestUpdated: 0, degraded: true };
  }

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  };

  const observations = await fetch(`${supabaseUrl}/rest/v1/price_observations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(prices),
  });

  if (!observations.ok) {
    const detail = await observations.text();
    throw new Error(`Could not persist observations: ${detail}`);
  }

  const currentRows = prices.map((price) => ({
    source_code: price.source_code,
    country_code: price.country_code,
    normalized_product: price.normalized_product,
    normalized_store: price.normalized_store,
    currency: price.currency,
    price: price.price,
    unit: price.unit,
    observed_at: price.observed_at,
    quality_score: price.quality_score,
    moderation_status: price.moderation_status,
    idempotency_key: price.idempotency_key,
  }));

  const current = await fetch(`${supabaseUrl}/rest/v1/price_current`, {
    method: 'POST',
    headers,
    body: JSON.stringify(currentRows),
  });

  if (!current.ok) {
    const detail = await current.text();
    throw new Error(`Could not update current prices: ${detail}`);
  }

  return { inserted: prices.length, latestUpdated: currentRows.length };
}
