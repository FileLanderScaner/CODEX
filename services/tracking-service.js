import { getApiUrl } from '../lib/config';
import { getAuthHeaders } from './account-service';

const allowedEvents = new Set([
  'search_product',
  'view_best_price',
  'share',
  'share_click',
  'click_whatsapp',
  'add_favorite',
  'create_alert',
  'premium_click',
  'landing_view',
  'open_app',
]);

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
  if (!response?.ok) return null;
  return response.json().catch(() => null);
}
