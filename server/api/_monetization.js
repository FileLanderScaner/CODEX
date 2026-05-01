import { normalizeProduct, supabaseRest } from './supabase/_utils.js';

function isMissingColumnError(error) {
  const message = String(error?.message || '');
  return message.includes('Could not find the') || message.includes('schema cache') || message.includes('column');
}

async function tryInsertEvent(body) {
  return supabaseRest('monetization_events', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function eventTable(eventName) {
  if (['search_submitted', 'search_product'].includes(eventName)) return 'search_events';
  if (['cheapest_price_shown', 'view_best_price', 'commerce_clicked', 'fallback_used'].includes(eventName)) return 'price_events';
  return null;
}

async function tryInsertTypedEvent({ userId, eventName, amount, currency, metadata }) {
  const table = eventTable(eventName);
  if (!table) return null;
  const product = normalizeProduct(metadata.product || metadata.query || metadata.search_query || '');
  return supabaseRest(table, {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      event_name: eventName,
      normalized_product: product || null,
      amount,
      currency,
      metadata,
    }),
  });
}

async function insertSharesAnalyticsFallback({ userId, eventName, metadata }) {
  const product = normalizeProduct(metadata.product || metadata.search_query || metadata.query || eventName);
  const variants = [
    { user_id: userId, product, channel: eventName },
    { product, channel: eventName },
    { user_id: userId, normalized_product: product, channel: eventName },
    { normalized_product: product, channel: eventName },
    { user_id: userId, channel: eventName },
    { channel: eventName },
  ];

  let lastError = null;
  for (const body of variants) {
    try {
      return await supabaseRest('shares', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error) {
      lastError = error;
      if (!isMissingColumnError(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Could not save analytics fallback');
}

export async function insertMonetizationEvent({ userId = null, eventName, amount = null, currency = 'UYU', metadata = {} }) {
  const normalizedAmount = amount ?? null;
  const normalizedCurrency = currency || 'UYU';
  const compactMetadata = {
    ...metadata,
    amount: normalizedAmount,
    currency: normalizedCurrency,
  };
  await tryInsertTypedEvent({
    userId,
    eventName,
    amount: normalizedAmount,
    currency: normalizedCurrency,
    metadata: compactMetadata,
  }).catch(() => null);
  const variants = [
    { user_id: userId, event_name: eventName, amount: normalizedAmount, currency: normalizedCurrency, metadata },
    { user_id: userId, event_name: eventName, metadata: compactMetadata },
    { event_name: eventName, metadata: compactMetadata },
    { user_id: userId, event_name: eventName },
    { event_name: eventName },
    { user_id: userId, event_type: eventName, metadata: compactMetadata },
    { event_type: eventName, metadata: compactMetadata },
    { user_id: userId, event_type: eventName },
    { event_type: eventName },
  ];

  let lastError = null;
  for (const body of variants) {
    try {
      return await tryInsertEvent(body);
    } catch (error) {
      lastError = error;
      if (!isMissingColumnError(error)) {
        throw error;
      }
    }
  }

  try {
    return await insertSharesAnalyticsFallback({ userId, eventName, metadata: compactMetadata });
  } catch (fallbackError) {
    throw fallbackError || lastError || new Error('Could not save monetization event');
  }
}
