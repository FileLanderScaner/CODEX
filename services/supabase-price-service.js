import { supabase } from '../lib/supabase';
import { getApiUrl } from '../lib/config';
import { formatProductName, normalizeProduct } from './price-service';
import { getAuthHeaders } from './account-service';

export async function ensureSupabaseUser() {
  if (!supabase) {
    return null;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user) {
    return sessionData.session.user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    return null;
  }

  return data.user ?? null;
}

export async function loadCloudPrices() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('prices')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(250);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPriceFromSupabase);
}

export async function addCloudPrice(price) {
  const product = normalizeProduct(price.product);
  const authHeaders = await getAuthHeaders();
  const response = await fetch(getApiUrl('/api/prices'), {
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
  return data ? mapPriceFromSupabase(data) : null;
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
  return {
    id: row.id,
    product: row.product || row.normalized_product,
    normalizedProduct: row.normalized_product,
    displayName: row.display_name,
    brand: row.brand,
    category: row.category,
    unit: row.unit,
    store: row.store,
    neighborhood: row.neighborhood,
    price: Number(row.price),
    currency: row.currency || 'UYU',
    updatedAt: 'Cloud',
    source: 'Supabase',
    status: row.status,
    reports: row.reports || 0,
    trustScore: row.trust_score || 70,
  };
}
