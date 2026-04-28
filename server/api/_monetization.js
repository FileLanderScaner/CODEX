import { supabaseRest } from './supabase/_utils.js';

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

export async function insertMonetizationEvent({ userId = null, eventName, amount = null, currency = 'UYU', metadata = {} }) {
  const normalizedAmount = amount ?? null;
  const normalizedCurrency = currency || 'UYU';
  const compactMetadata = {
    ...metadata,
    amount: normalizedAmount,
    currency: normalizedCurrency,
  };

  try {
    return await tryInsertEvent({
      user_id: userId,
      event_name: eventName,
      amount: normalizedAmount,
      currency: normalizedCurrency,
      metadata,
    });
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }
  }

  try {
    return await tryInsertEvent({
      user_id: userId,
      event_name: eventName,
      metadata: compactMetadata,
    });
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }
  }

  try {
    return await tryInsertEvent({
      event_name: eventName,
      metadata: compactMetadata,
    });
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }
  }

  try {
    return await tryInsertEvent({
      user_id: userId,
      event_type: eventName,
      metadata: compactMetadata,
    });
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }
  }

  return tryInsertEvent({
    event_type: eventName,
    metadata: compactMetadata,
  });
}
