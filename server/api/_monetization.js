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

async function insertSharesAnalyticsFallback({ userId, eventName, metadata }) {
  const product = normalizeProduct(metadata.product || metadata.search_query || metadata.query || eventName);
  const baseBody = {
    user_id: userId,
    product,
    channel: eventName,
  };

  try {
    return await supabaseRest('shares', {
      method: 'POST',
      body: JSON.stringify(baseBody),
    });
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }
  }

  return supabaseRest('shares', {
    method: 'POST',
    body: JSON.stringify({
      product,
      channel: eventName,
    }),
  });
}

export async function insertMonetizationEvent({ userId = null, eventName, amount = null, currency = 'UYU', metadata = {} }) {
  const normalizedAmount = amount ?? null;
  const normalizedCurrency = currency || 'UYU';
  const compactMetadata = {
    ...metadata,
    amount: normalizedAmount,
    currency: normalizedCurrency,
  };
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
