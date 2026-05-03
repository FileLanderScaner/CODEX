import { getApiUrl } from '../lib/config.js';
import { fetchOfficialPrices, formatProductName, mapObservation, normalizeProduct } from './price-service.js';
import { getAuthHeaders } from './account-service.js';
import { MONTEVIDEO_SEED_PRICES } from '../data/seed-prices.js';
import { addUserPrice, loadUserPrices } from './user-price-service.js';

export async function ensureSupabaseUser() {
  return null;
}

export async function loadCloudPrices(params = {}) {
  try {
    const { data } = await fetchOfficialPrices(params);
    if (data?.length) {
      return data;
    }
  } catch (_error) {
    // Expo web does not run Vercel functions locally; keep the product usable with persisted seed data.
  }

  const localPrices = await loadUserPrices().catch(() => []);
  return [...localPrices, ...MONTEVIDEO_SEED_PRICES];
}

export async function addCloudPrice(price) {
  const product = normalizeProduct(price.product);
  const authHeaders = await getAuthHeaders();
  const fallbackSave = async () => {
    const localPrices = await addUserPrice({
      ...price,
      product,
      neighborhood: price.neighborhood || 'Cerca tuyo',
    });
    return localPrices[0] || null;
  };

  const response = await fetch(getApiUrl('/api/v1/prices/community'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      product,
      displayName: price.displayName || `${formatProductName(product)} ${price.unit || ''}`.trim(),
      brand: price.brand?.trim() || 'Sin marca',
      category: price.category?.trim() || 'General',
      unit: price.unit?.trim() || 'unidad',
      store: price.store.trim(),
      neighborhood: price.neighborhood?.trim() || 'Cerca tuyo',
      price: Number(price.price),
    }),
  }).catch(() => null);

  if (!response?.ok) {
    return fallbackSave();
  }

  const data = await response.json();
  return data?.data ? mapObservation(data.data) : fallbackSave();
}

export async function addCloudShare(price, channel = 'share') {
  if (!price) {
    return;
  }

  const authHeaders = await getAuthHeaders();
  await fetch(getApiUrl('/api/shares'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      priceId: price.id,
      product: price.product,
      channel,
      url: price.shareUrl,
      savings: price.savings,
    }),
  });
}

export async function addCloudReport(price, reason = 'Precio incorrecto') {
  if (!price) {
    return;
  }

  const authHeaders = await getAuthHeaders();
  await fetch(getApiUrl('/api/reports'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({
      priceId: price.id,
      product: price.product,
      store: price.store,
      reason,
    }),
  });
}

function mapPriceFromSupabase(row) {
  return mapObservation(row);
}
