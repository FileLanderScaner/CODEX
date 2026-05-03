// services/premium-service.js
// Servicios para gestionar Premium y ahorros

import { getApiUrl } from '../lib/config.js';

/**
 * Obtener estado de suscripcion premium del usuario
 */
export async function getPremiumStatus(accessToken) {
  if (!accessToken) return null;

  try {
    const response = await fetch(getApiUrl('/api/v1/billing/me'), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch premium status:', response.status);
      return null;
    }

    const data = await response.json();
    // Adaptar respuesta de billing/me a formato esperado
    return {
      isPremium: data.data?.some(sub => sub.status === 'ACTIVE') || false,
      subscriptions: data.data || [],
    };
  } catch (error) {
    console.error('Error fetching premium status:', error);
    return null;
  }
}

/**
 * Registrar un ahorro de busqueda
 *
 * Retorna:
 * {
 *   id: "uuid",
 *   savings_amount: 12,
 *   user_monthly_total: 180,
 *   should_show_paywall: true
 * }
 */
export async function recordSaving(accessToken, savingData) {
  if (!accessToken) return null;

  try {
    const response = await fetch(getApiUrl('/api/v1/events'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        event_name: 'saving_recorded',
        metadata: savingData,
      }),
    });

    if (!response.ok) {
      console.error('Failed to record saving:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error recording saving:', error);
    return null;
  }
}

/**
 * Obtener resumen de ahorros
 *
 * Retorna:
 * {
 *   this_month: { total: 180, count: 12, avg: 15, trend: 'up' },
 *   last_month: { total: 240, count: 18, avg: 13.33 },
 *   all_time: { total: 720, count: 50, avg: 14.4 },
 *   paywall_trigger_met: true,
 *   next_milestone: 100,
 *   milestone_progress: 85
 * }
 */
export async function getSavingsSummary(accessToken) {
  if (!accessToken) return null;

  try {
    const response = await fetch(getApiUrl('/api/v1/savings/summary'), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      return { ...data, source: 'api' };
    }
    return {
      this_month: { total: 0, count: 0, avg: 0, trend: 'stable' },
      last_month: { total: 0, count: 0, avg: 0 },
      all_time: { total: 0, count: 0, avg: 0 },
      paywall_trigger_met: false,
      next_milestone: 100,
      milestone_progress: 0,
      source: 'fallback_unavailable',
      warning: 'Savings summary unavailable; showing zeroed fallback, not real savings.',
    };
  } catch (error) {
    console.error('Error fetching savings summary:', error);
    return null;
  }
}

/**
 * Verificar si debe mostrarse el paywall contextual
 * Reglas:
 * - Usuario no premium
 * - Ahorro acumulado > $50
 * - Ultimo paywall mostrado hace > 7 dias
 */
export function shouldShowPaywall(premiumStatus, savingsSummary, lastPaywallShownAt) {
  if (!premiumStatus || !savingsSummary) return false;

  const isPremium = Boolean(premiumStatus.isPremium ?? premiumStatus.is_premium);
  const hasEnoughSavings = savingsSummary.paywall_trigger_met;

  const lastShown = lastPaywallShownAt ? new Date(lastPaywallShownAt) : null;
  const now = new Date();
  const daysSinceShown = lastShown ? Math.floor((now - lastShown) / (1000 * 60 * 60 * 24)) : 10;
  const enoughTimePassed = daysSinceShown > 7;

  return !isPremium && hasEnoughSavings && enoughTimePassed;
}

/**
 * Formatear cantidad de dinero ahorrado
 */
export function formatSavings(amount, currency = 'UYU') {
  return `${currency} ${Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Obtener texto motivacional basado en ahorros
 */
export function getMotivationalMessage(monthlyTotal) {
  if (monthlyTotal < 50) {
    return 'Busca 2-3 veces mas y empeza a ver ofertas reales';
  } else if (monthlyTotal < 150) {
    return 'Ya ahorraste el equivalente a una comida. Segui asi.';
  } else if (monthlyTotal < 300) {
    return 'Ahorraste lo suficiente para una cerveza o cafe por dia';
  }
  return 'Con este ahorro podrias cubrir compras extra.';
}

/**
 * Obtener estimacion de ahorro anual
 */
export function getAnnualProjection(monthlyTotal) {
  return monthlyTotal * 12;
}
