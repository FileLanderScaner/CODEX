import { getApiUrl } from '../lib/config';
import { getAuthHeaders } from './account-service';

const allowedEvents = new Set([
  'search_submitted',
  'search_product',
  'cheapest_price_shown',
  'view_best_price',
  'commerce_clicked',
  'fallback_used',
  'premium_started',
  'premium_completed',
  'share',
  'share_click',
  'click_whatsapp',
  'add_favorite',
  'create_alert',
  'premium_click',
  'landing_view',
  'open_app',
  'app_loaded',
  'web_session_started',
  'client_error',
]);

async function saveLocalEvent(eventName, metadata = {}, amount = null, currency = 'UYU') {
  try {
    const mod = await import('@react-native-async-storage/async-storage');
    const AsyncStorage = mod.default;
    const key = '@ahorroya:tracking-events';
    const stored = await AsyncStorage.getItem(key);
    const events = stored ? JSON.parse(stored) : [];
    const next = [{
      id: `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      eventName,
      metadata,
      amount,
      currency,
      createdAt: new Date().toISOString(),
      delivery: 'local',
    }, ...events].slice(0, 250);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    return next[0];
  } catch {
    return null;
  }
}

export async function trackEvent(eventName, metadata = {}, amount = null, currency = 'UYU') {
  if (!allowedEvents.has(eventName)) return null;
  const authHeaders = await getAuthHeaders();
  const response = await fetch(getApiUrl('/api/monetization-event'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      eventName,
      amount,
      currency,
      metadata,
    }),
  }).catch(() => null);
  if (!response?.ok) return saveLocalEvent(eventName, metadata, amount, currency);
  return response.json().catch(() => null);
}
