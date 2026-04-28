import { supabaseRest } from './supabase/_utils.js';

function isMissingColumnError(error) {
  const message = String(error?.message || '');
  return message.includes('Could not find the') || message.includes('schema cache') || message.includes('column');
}

export async function insertMonetizationEvent({ userId = null, eventName, amount = null, currency = 'UYU', metadata = {} }) {
  const normalizedAmount = amount ?? null;
  const normalizedCurrency = currency || 'UYU';

  try {
    return await supabaseRest('monetization_events', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        event_name: eventName,
        amount: normalizedAmount,
        currency: normalizedCurrency,
        metadata,
      }),
    });
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }
  }

  try {
    return await supabaseRest('monetization_events', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        event_name: eventName,
        metadata: {
          ...metadata,
          amount: normalizedAmount,
          currency: normalizedCurrency,
        },
      }),
    });
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }
  }

  return supabaseRest('monetization_events', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      event_type: eventName,
      metadata: {
        ...metadata,
        amount: normalizedAmount,
        currency: normalizedCurrency,
      },
    }),
  });
}
