import { getApiUrl } from '../lib/config';
import { fetchOfficialPrices, formatProductName, mapObservation, normalizeProduct } from './price-service';
import { getAuthHeaders } from './account-service';

export async function ensureSupabaseUser() {
  return null;
}

export async function loadCloudPrices(params = {}) {
  const { data } = await fetchOfficialPrices(params);
  return data;
}

export async function addCloudPrice(price) {
  const product = normalizeProduct(price.product);
  const authHeaders = await getAuthHeaders();
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
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data?.data ? mapObservation(data.data) : null;
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
