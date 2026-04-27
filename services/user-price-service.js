import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatProductName, normalizeProduct } from './price-service';

const USER_PRICES_KEY = '@ahorroya:user-prices';
const SEARCH_HISTORY_KEY = '@ahorroya:search-history';
const POINTS_KEY = '@ahorroya:points';
const REPORTS_KEY = '@ahorroya:reports';
const ALERTS_KEY = '@ahorroya:price-alerts';

export async function loadUserPrices() {
  const stored = await AsyncStorage.getItem(USER_PRICES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function addUserPrice(price) {
  const stored = await loadUserPrices();
  const product = normalizeProduct(price.product);
  const saved = {
    id: `user-price-${Date.now()}`,
    product,
    normalizedProduct: product,
    displayName: price.displayName || `${formatProductName(product)} ${price.unit || ''}`.trim(),
    brand: price.brand?.trim() || 'Sin marca',
    category: price.category?.trim() || 'General',
    unit: price.unit?.trim() || 'unidad',
    store: price.store.trim(),
    neighborhood: price.neighborhood.trim() || 'Cerca tuyo',
    price: Number(price.price),
    currency: 'UYU',
    updatedAt: 'Ahora',
    source: 'Usuario',
    status: 'approved',
    reports: 0,
    trustScore: 70,
  };
  const nextPrices = [saved, ...stored].slice(0, 50);
  await AsyncStorage.setItem(USER_PRICES_KEY, JSON.stringify(nextPrices));
  return nextPrices;
}

export async function loadSearchHistory() {
  const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function addSearchHistory(query) {
  const normalized = normalizeProduct(query);
  if (!normalized) {
    return loadSearchHistory();
  }

  const current = await loadSearchHistory();
  const nextHistory = [normalized, ...current.filter((item) => item !== normalized)].slice(0, 5);
  await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
  return nextHistory;
}

export async function loadPoints() {
  const stored = await AsyncStorage.getItem(POINTS_KEY);
  return stored ? Number(stored) : 0;
}

export async function addPoints(points) {
  const current = await loadPoints();
  const nextPoints = current + points;
  await AsyncStorage.setItem(POINTS_KEY, String(nextPoints));
  return nextPoints;
}

export async function loadReports() {
  const stored = await AsyncStorage.getItem(REPORTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function reportPrice(price, reason = 'Precio incorrecto') {
  const current = await loadReports();
  const report = {
    id: `report-${Date.now()}`,
    priceId: price.id,
    product: price.product,
    store: price.store,
    reason,
    createdAt: new Date().toISOString(),
  };
  const nextReports = [report, ...current].slice(0, 30);
  await AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(nextReports));
  return nextReports;
}

export async function loadLocalAlerts() {
  const stored = await AsyncStorage.getItem(ALERTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function saveLocalAlerts(alerts) {
  await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

export async function upsertLocalAlert({ normalized_product, neighborhood = null, target_price = null }) {
  const current = await loadLocalAlerts();
  const key = `${normalized_product}::${neighborhood || ''}`;
  const next = [
    {
      id: `local-alert-${Date.now()}`,
      normalized_product,
      neighborhood,
      target_price,
      active: true,
      key,
      created_at: new Date().toISOString(),
    },
    ...current.filter((item) => item.key !== key),
  ].slice(0, 25);
  await saveLocalAlerts(next);
  return next;
}

export async function setLocalAlertActive(alertKey, active) {
  const current = await loadLocalAlerts();
  const next = current.map((item) => (item.key === alertKey ? { ...item, active: Boolean(active) } : item));
  await saveLocalAlerts(next);
  return next;
}

export async function deleteLocalAlert(alertKey) {
  const current = await loadLocalAlerts();
  const next = current.filter((item) => item.key !== alertKey);
  await saveLocalAlerts(next);
  return next;
}
