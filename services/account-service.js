import { supabase } from '../lib/supabase.js';
import { getApiUrl, getAppUrl } from '../lib/config.js';
import { normalizeProduct } from './price-service.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteLocalAlert,
  loadLocalAlerts,
  setLocalAlertActive,
  upsertLocalAlert,
} from './user-price-service.js';
import { loadFavorites } from './favorites-service.js';

const LOCAL_USER_KEY = '@ahorroya:fallback-user';
const LOCAL_PREMIUM_KEY = '@ahorroya:fallback-premium';
const LOCAL_AUTH_EVENT = 'ahorroya-local-auth-change';

function fallbackUser(provider = 'demo') {
  return {
    id: `local-${provider}-user`,
    email: `${provider}@ahorroya.local`,
    app_metadata: { provider },
    user_metadata: { plan: 'free' },
  };
}

function emitLocalAuthChange(user) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCAL_AUTH_EVENT, { detail: { user } }));
  }
}

export async function getSessionUser() {
  if (!supabase) {
    const stored = await AsyncStorage.getItem(LOCAL_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function getAccessToken() {
  if (!supabase) {
    const user = await getSessionUser();
    return user ? `local-token-${user.id}` : '';
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
    if (typeof window === 'undefined') {
      return () => {};
    }
    const onLocalAuth = (event) => callback(event.detail?.user ?? null);
    window.addEventListener(LOCAL_AUTH_EVENT, onLocalAuth);
    return () => window.removeEventListener(LOCAL_AUTH_EVENT, onLocalAuth);
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signInWithProvider(provider) {
  if (!supabase) {
    const user = fallbackUser(provider);
    await AsyncStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    emitLocalAuthChange(user);
    return user;
  }

  const redirectTo = getAppUrl() || undefined;
  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });
}

export async function signInWithFallback(email = 'demo@ahorroya.local') {
  if (supabase) {
    return;
  }

  const user = { ...fallbackUser('email'), email };
  await AsyncStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  emitLocalAuthChange(user);
  return user;
}

export async function signOutAccount() {
  if (supabase) {
    await supabase.auth.signOut();
    return;
  }
  await AsyncStorage.removeItem(LOCAL_USER_KEY);
  emitLocalAuthChange(null);
}

export async function migrateLocalStateToCloud(user) {
  if (!supabase || !user) {
    return { favorites: 0, alerts: 0 };
  }

  const [favorites, alerts] = await Promise.all([
    loadFavorites().catch(() => []),
    loadLocalAlerts().catch(() => []),
  ]);

  const favoriteRows = favorites
    .map((product) => normalizeProduct(product))
    .filter(Boolean)
    .map((product) => ({
      user_id: user.id,
      product,
      normalized_product: product,
    }));

  const alertRows = alerts
    .filter((alert) => alert?.normalized_product)
    .map((alert) => ({
      user_id: user.id,
      product: normalizeProduct(alert.normalized_product),
      normalized_product: normalizeProduct(alert.normalized_product),
      neighborhood: alert.neighborhood || 'Montevideo',
      target_price: alert.target_price || null,
      currency: 'UYU',
      active: alert.active !== false,
    }));

  if (favoriteRows.length) {
    await supabase.from('user_favorites').upsert(favoriteRows, { onConflict: 'user_id,normalized_product' }).catch(() => null);
  }

  if (alertRows.length) {
    await supabase.from('price_alerts').upsert(alertRows, { onConflict: 'user_id,normalized_product,neighborhood' }).catch(() => null);
  }

  return { favorites: favoriteRows.length, alerts: alertRows.length };
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
    if (!user || !product) return null;
    const normalized = normalizeProduct(product);
    const next = await upsertLocalAlert({
      normalized_product: normalized,
      neighborhood: neighborhood || 'Montevideo',
      target_price: targetPrice || null,
    });
    return next[0] || null;
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
    return user ? loadLocalAlerts() : [];
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
    if (!user || !alertId) return null;
    const current = await loadLocalAlerts();
    const alert = current.find((item) => item.id === alertId || item.key === alertId);
    if (!alert) return null;
    const next = await setLocalAlertActive(alert.key, active);
    return next.find((item) => item.key === alert.key) || null;
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
    if (!user || !alertId) return false;
    const current = await loadLocalAlerts();
    const alert = current.find((item) => item.id === alertId || item.key === alertId);
    if (!alert) return false;
    await deleteLocalAlert(alert.key);
    return true;
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

  if (!supabase) {
    return AsyncStorage.getItem(LOCAL_PREMIUM_KEY).then((value) => value === 'active');
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

export async function activateMockPremium(user) {
  if (supabase) {
    if (!user) {
      return { isPremium: false, user: null, message: 'Inicia sesion para activar Premium demo.' };
    }
    const premiumUntil = new Date();
    premiumUntil.setMonth(premiumUntil.getMonth() + 1);
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      plan: 'premium',
      is_premium: true,
      premium_until: premiumUntil.toISOString(),
    }).catch(() => null);
    return { isPremium: true, user };
  }

  const activeUser = user || await signInWithFallback();
  await AsyncStorage.setItem(LOCAL_PREMIUM_KEY, 'active');
  emitLocalAuthChange(activeUser);
  return { isPremium: true, user: activeUser };
}
