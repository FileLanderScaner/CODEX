// /api/v1/savings.js
// Endpoint para registrar ahorros de búsqueda y obtener resumen

import { json, runEndpoint, requireAuth } from './_utils.js';
import { supabaseServerClient } from '../supabase/_utils.js';

/**
 * POST /api/v1/savings
 * Registra un ahorro encontrado en una búsqueda
 * 
 * Body:
 * {
 *   product_name: "Leche Descremada 1L",
 *   search_query: "leche",
 *   cheapest_store: "Devoto",
 *   cheapest_price: 40,
 *   expensive_store: "Tienda Inglesa",
 *   expensive_price: 52,
 *   currency: "UYU"
 * }
 * 
 * Response:
 * {
 *   id: "uuid",
 *   savings_amount: 12,
 *   user_monthly_total: 180
 * }
 */
async function handlePostSavings(req, res, reqId, user) {
  const { product_name, search_query, cheapest_store, cheapest_price, expensive_store, expensive_price, currency } = req.body;

  // Validación básica
  if (!product_name || !search_query || !cheapest_store || !expensive_store) {
    return json(res, 400, { error: 'Missing required fields' }, reqId);
  }

  const cheapestNum = Number(cheapest_price);
  const expensiveNum = Number(expensive_price);
  
  if (!Number.isFinite(cheapestNum) || !Number.isFinite(expensiveNum)) {
    return json(res, 400, { error: 'Invalid price format' }, reqId);
  }

  if (cheapestNum > expensiveNum) {
    return json(res, 400, { error: 'Cheapest price cannot exceed expensive price' }, reqId);
  }

  try {
    const supabase = supabaseServerClient(req);

    // 1. Insertar saving record
    const { data: saving, error: savingError } = await supabase
      .from('user_savings')
      .insert({
        user_id: user.id,
        product_name,
        search_query,
        cheapest_store,
        cheapest_price: cheapestNum,
        expensive_store,
        expensive_price: expensiveNum,
        currency: currency || 'UYU',
      })
      .select()
      .single();

    if (savingError) throw savingError;

    // 2. Obtener total mensual del usuario
    const { data: monthlySummary, error: summaryError } = await supabase.rpc(
      'get_user_monthly_savings',
      { p_user_id: user.id, p_month_offset: 0 }
    );

    if (summaryError) throw summaryError;

    const total_monthly = monthlySummary?.length > 0 ? monthlySummary[0].total_savings : 0;

    // 3. Track analytics event
    await supabase
      .from('monetization_events')
      .insert({
        user_id: user.id,
        event_type: 'search_with_savings',
        metadata: {
          savings_amount: expensiveNum - cheapestNum,
          product: product_name,
          search_query,
        },
      })
      .then(() => null) // Ignore errors in analytics
      .catch(() => null);

    return json(res, 200, {
      id: saving.id,
      savings_amount: expensiveNum - cheapestNum,
      user_monthly_total: total_monthly,
      should_show_paywall: total_monthly > 50, // Trigger paywall si total > $50
    }, reqId);
  } catch (error) {
    console.error('[savings] Error:', error);
    return json(res, 500, { error: 'Failed to record saving' }, reqId);
  }
}

/**
 * GET /api/v1/savings/summary
 * Obtiene resumen de ahorros del usuario
 * 
 * Query params:
 * - month_offset: 0=actual, 1=mes pasado, etc.
 * 
 * Response:
 * {
 *   this_month: { total: 180, count: 12, avg: 15 },
 *   last_month: { total: 240, count: 18, avg: 13.33 },
 *   all_time: { total: 720, count: 50, avg: 14.4 },
 *   paywall_trigger_met: true,
 *   next_milestone: 500
 * }
 */
async function handleGetSummary(req, res, reqId, user) {
  try {
    const supabase = supabaseServerClient(req);

    // Obtener resúmenes: este mes, mes pasado, y todos los tiempos
    const [thisMonth, lastMonth, allTime] = await Promise.all([
      supabase.rpc('get_user_monthly_savings', { p_user_id: user.id, p_month_offset: 0 }),
      supabase.rpc('get_user_monthly_savings', { p_user_id: user.id, p_month_offset: 1 }),
      supabase
        .from('user_savings')
        .select('COUNT(*) as count, SUM(savings_amount) as total')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) throw error;
          return data ? [{ count: data[0]?.count || 0, total: data[0]?.total || 0 }] : [];
        }),
    ]);

    const thisMonthData = thisMonth?.length > 0 ? thisMonth[0] : { total_savings: 0, count_searches: 0, avg_savings_per_search: 0 };
    const lastMonthData = lastMonth?.length > 0 ? lastMonth[0] : { total_savings: 0, count_searches: 0, avg_savings_per_search: 0 };
    const allTimeData = Array.isArray(allTime) && allTime.length > 0 ? allTime[0] : { count: 0, total: 0 };

    const thisMonthTotal = Number(thisMonthData.total_savings || 0);
    const allTimeTotal = Number(allTimeData.total || 0);

    return json(res, 200, {
      this_month: {
        total: thisMonthTotal,
        count: thisMonthData.count_searches,
        avg: Number(thisMonthData.avg_savings_per_search || 0).toFixed(2),
        trend: thisMonthTotal > (lastMonthData.total_savings || 0) ? 'up' : 'down',
      },
      last_month: {
        total: Number(lastMonthData.total_savings || 0),
        count: lastMonthData.count_searches,
        avg: Number(lastMonthData.avg_savings_per_search || 0).toFixed(2),
      },
      all_time: {
        total: allTimeTotal,
        count: allTimeData.count,
        avg: allTimeData.count > 0 ? (allTimeTotal / allTimeData.count).toFixed(2) : 0,
      },
      paywall_trigger_met: thisMonthTotal > 50,
      next_milestone: 100,
      milestone_progress: Math.min(100, Math.round((thisMonthTotal / 100) * 100)),
    }, reqId);
  } catch (error) {
    console.error('[savings summary] Error:', error);
    return json(res, 500, { error: 'Failed to fetch summary' }, reqId);
  }
}

export default function handler(req, res) {
  // POST /api/v1/savings - Registrar ahorro
  if (req.method === 'POST' && !req.url.includes('/summary')) {
    return runEndpoint(req, res, ['POST'], 'savings', async (_req, _res, reqId) => {
      const user = await requireAuth(_req);
      return handlePostSavings(_req, _res, reqId, user);
    });
  }

  // GET /api/v1/savings/summary - Obtener resumen
  if (req.method === 'GET' && req.url.includes('/summary')) {
    return runEndpoint(req, res, ['GET'], 'savings/summary', async (_req, _res, reqId) => {
      const user = await requireAuth(_req);
      return handleGetSummary(_req, _res, reqId, user);
    });
  }

  json(res, 405, { error: 'Method not allowed' });
}
