import { supabase } from '../lib/supabase';
import { getApiUrl, getAppUrl } from '../lib/config';
import { normalizeProduct } from './price-service';

export async function getSessionUser() {
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function getAccessToken() {
  if (!supabase) {
    return '';
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

export async function getAuthHeaders() {
  const accessToken = await getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export function subscribeToAuth(callback) {
  if (!supabase) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signInWithProvider(provider) {
  if (!supabase) {
    return;
  }

  const redirectTo = getAppUrl() || undefined;
  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });
}

export async function signOutAccount() {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

export async function upsertProfile(user) {
  if (!supabase || !user) {
    return null;
  }

  const profile = {
    id: user.id,
    email: user.email,
  };

  await supabase.from('profiles').upsert(profile);
  return profile;
}

export async function loadCloudFavorites(user) {
  if (!supabase || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .select('normalized_product')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return (data ?? []).map((item) => item.normalized_product);
}

export async function saveCloudFavorite(user, product, enabled) {
  if (!supabase || !user || !product) {
    return;
  }

  const normalized = normalizeProduct(product);
  if (enabled) {
    await supabase.from('user_favorites').upsert({
      user_id: user.id,
      product: normalized,
      normalized_product: normalized,
    }, { onConflict: 'user_id,normalized_product' });
  } else {
    await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', user.id)
      .eq('normalized_product', normalized);
  }
}

export async function createCloudAlert(user, product, neighborhood, targetPrice) {
  if (!supabase || !user || !product) {
    return null;
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .upsert({
      user_id: user.id,
      product: normalizeProduct(product),
      normalized_product: normalizeProduct(product),
      neighborhood: neighborhood || 'Montevideo',
      target_price: targetPrice || null,
      currency: 'UYU',
      active: true,
    }, { onConflict: 'user_id,normalized_product,neighborhood' })
    .select()
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function loadCloudAlerts(user) {
  if (!supabase || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function setCloudAlertActive(user, alertId, active) {
  if (!supabase || !user || !alertId) {
    return null;
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .update({ active: Boolean(active) })
    .eq('id', alertId)
    .eq('user_id', user.id)
    .select()
    .maybeSingle();

  if (error) {
    return null;
  }

  return data || null;
}

export async function deleteCloudAlert(user, alertId) {
  if (!supabase || !user || !alertId) {
    return false;
  }

  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', user.id);

  return !error;
}

export async function checkPremiumStatus(user) {
  if (!user) {
    return false;
  }

  const headers = await getAuthHeaders();
  const response = await fetch(getApiUrl('/api/me'), {
    method: 'GET',
    headers,
  }).catch(() => null);
  if (!response?.ok) {
    return false;
  }

  const data = await response.json();
  return Boolean(data?.premium?.isPremium);
}
