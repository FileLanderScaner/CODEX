// services/analytics-service.js
// Servicio de analytics para tracking de eventos

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { isProductionMode } from '../lib/runtime-mode';
import { getApiUrl } from '../lib/config';

const ANALYTICS_EVENTS_KEY = '@ahorroya:analytics-events';

// Eventos estándar de growth
export const ANALYTICS_EVENTS = {
  APP_OPEN: 'app_open',
  SEARCH_SUBMITTED: 'search_submitted',
  PRODUCT_VIEWED: 'product_viewed',
  CHEAPEST_PRICE_CLICKED: 'cheapest_price_clicked',
  FAVORITE_ADDED: 'favorite_added',
  ALERT_CREATED: 'alert_created',
  COMMUNITY_PRICE_SUBMITTED: 'community_price_submitted',
  SHARE_CLICKED: 'share_clicked',
  CATALOG_LINK_CLICKED: 'catalog_link_clicked',
  PREMIUM_VIEWED: 'premium_viewed',
  PREMIUM_STARTED: 'premium_started',
  PREMIUM_COMPLETED: 'premium_completed',
  LOGIN_STARTED: 'login_started',
  LOGIN_COMPLETED: 'login_completed',
};

/**
 * Trackea un evento de analytics
 * @param {string} eventName - Nombre del evento
 * @param {object} metadata - Datos adicionales del evento
 */
export async function trackEvent(eventName, metadata = {}) {
  const event = {
    event_name: eventName,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    },
  };

  // Siempre guardar localmente como fallback
  await saveEventLocally(event);

  // Si estamos en producción y hay Supabase, enviar al backend
  if (isProductionMode() && supabase) {
    try {
      await sendEventToBackend(event);
    } catch (error) {
      console.warn('Failed to send analytics event to backend:', error);
    }
  }

  // Para web, usar Vercel Analytics si disponible
  if (Platform.OS === 'web' && window.va) {
    try {
      window.va('event', {
        name: eventName,
        properties: metadata,
      });
    } catch (error) {
      console.warn('Failed to send event to Vercel Analytics:', error);
    }
  }
}

/**
 * Guarda evento localmente en AsyncStorage
 */
async function saveEventLocally(event) {
  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_EVENTS_KEY);
    const events = stored ? JSON.parse(stored) : [];
    events.push(event);

    // Mantener solo los últimos 1000 eventos para no llenar storage
    if (events.length > 1000) {
      events.splice(0, events.length - 1000);
    }

    await AsyncStorage.setItem(ANALYTICS_EVENTS_KEY, JSON.stringify(events));
  } catch (error) {
    console.warn('Failed to save analytics event locally:', error);
  }
}

/**
 * Envía evento al backend de Supabase
 */
async function sendEventToBackend(event) {
  const response = await fetch(getApiUrl('/api/v1/events'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Analytics API error: ${response.status}`);
  }
}

/**
 * Obtiene eventos locales almacenados (para debugging)
 */
export async function getLocalEvents() {
  try {
    const stored = await AsyncStorage.getItem(ANALYTICS_EVENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to get local analytics events:', error);
    return [];
  }
}

/**
 * Limpia eventos locales (para testing)
 */
export async function clearLocalEvents() {
  try {
    await AsyncStorage.removeItem(ANALYTICS_EVENTS_KEY);
  } catch (error) {
    console.warn('Failed to clear local analytics events:', error);
  }
}