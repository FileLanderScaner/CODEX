// lib/runtime-mode.js
// Detecta automáticamente el modo de ejecución de la app

import { supabase } from './supabase';
import { readEnv } from './env';

export const RUNTIME_MODES = {
  LOCAL: 'local',
  DEMO: 'demo',
  PRODUCTION: 'production',
};

/**
 * Detecta el modo de runtime basado en variables de entorno y configuración
 * @returns {string} Uno de RUNTIME_MODES
 */
export function detectRuntimeMode() {
  const env = readEnv();

  // Si no hay configuración de Supabase, es local
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return RUNTIME_MODES.LOCAL;
  }

  // Si hay configuración pero no PayPal, es demo
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    return RUNTIME_MODES.DEMO;
  }

  // Si todo está configurado, es producción
  return RUNTIME_MODES.PRODUCTION;
}

/**
 * Verifica si estamos en modo local (sin backend)
 */
export function isLocalMode() {
  return detectRuntimeMode() === RUNTIME_MODES.LOCAL;
}

/**
 * Verifica si estamos en modo demo (backend pero no pagos reales)
 */
export function isDemoMode() {
  return detectRuntimeMode() === RUNTIME_MODES.DEMO;
}

/**
 * Verifica si estamos en modo producción (todo real)
 */
export function isProductionMode() {
  return detectRuntimeMode() === RUNTIME_MODES.PRODUCTION;
}

/**
 * Obtiene mensaje de estado para mostrar al usuario
 */
export function getRuntimeStatusMessage() {
  const mode = detectRuntimeMode();

  switch (mode) {
    case RUNTIME_MODES.LOCAL:
      return 'Modo local: funcionando sin conexión a servicios externos';
    case RUNTIME_MODES.DEMO:
      return 'Modo demo: usando servicios de prueba, pagos no reales';
    case RUNTIME_MODES.PRODUCTION:
      return 'Modo producción: todos los servicios activos';
    default:
      return 'Modo desconocido';
  }
}

/**
 * Verifica si Supabase está disponible
 */
export function hasSupabaseConfig() {
  const env = getEnv();
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && supabase);
}

/**
 * Verifica si PayPal está configurado
 */
export function hasPayPalConfig() {
  const env = getEnv();
  return Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
}