// /api/v1/premium/status.js
// Obtener estado de suscripción premium del usuario

import { json, runEndpoint, requireAuth } from '../_utils.js';
import { supabaseServerClient } from '../../supabase/_utils.js';

/**
 * GET /api/v1/premium/status
 * Obtiene estado actual de suscripción premium
 * 
 * Response (Free):
 * {
 *   is_premium: false,
 *   plan: null,
 *   expires_at: null,
 *   days_remaining: null,
 *   suggested_price: 3.99,
 *   monthly_savings: 180
 * }
 * 
 * Response (Premium):
 * {
 *   is_premium: true,
 *   plan: "monthly",
 *   expires_at: "2026-05-27T00:00:00Z",
 *   days_remaining: 30,
 *   next_billing_date: "2026-05-27",
 *   can_cancel: true
 * }
 */
async function handleGetStatus(req, res, reqId, user) {
  try {
    const supabase = supabaseServerClient(req);

    // 1. Obtener suscripción actual
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // 2. Obtener ahorros mensuales
    const { data: monthlySavings, error: savingsError } = await supabase.rpc(
      'get_user_monthly_savings',
      { p_user_id: user.id, p_month_offset: 0 }
    );

    const monthlyTotal = monthlySavings?.length > 0 ? monthlySavings[0].total_savings : 0;

    if (subscription) {
      // Usuario es Premium
      const expiresAt = new Date(subscription.expires_at);
      const now = new Date();
      const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

      return json(res, 200, {
        is_premium: true,
        plan: subscription.plan,
        expires_at: subscription.expires_at,
        days_remaining: Math.max(0, daysRemaining),
        next_billing_date: subscription.next_payment_at,
        amount_paid: subscription.amount_paid,
        currency: subscription.currency,
        started_at: subscription.started_at,
        can_cancel: true,
      }, reqId);
    } else {
      // Usuario es Free
      return json(res, 200, {
        is_premium: false,
        plan: null,
        expires_at: null,
        days_remaining: null,
        next_billing_date: null,
        monthly_savings: Number(monthlyTotal),
        suggested_price_usd: 3.99,
        suggested_price_annual: 39.90,
        paywall_trigger_met: monthlyTotal > 50,
      }, reqId);
    }
  } catch (error) {
    // Si es "no rows returned", usuario no tiene suscripción (es free)
    if (error?.code === 'PGRST116') {
      try {
        const { data: monthlySavings } = await supabaseServerClient(req).rpc(
          'get_user_monthly_savings',
          { p_user_id: user.id, p_month_offset: 0 }
        );
        const monthlyTotal = monthlySavings?.length > 0 ? monthlySavings[0].total_savings : 0;

        return json(res, 200, {
          is_premium: false,
          plan: null,
          expires_at: null,
          days_remaining: null,
          monthly_savings: Number(monthlyTotal),
          suggested_price_usd: 3.99,
          suggested_price_annual: 39.90,
          paywall_trigger_met: monthlyTotal > 50,
        }, reqId);
      } catch (innerError) {
        console.error('[premium/status] Inner error:', innerError);
        return json(res, 500, { error: 'Failed to fetch premium status' }, reqId);
      }
    }

    console.error('[premium/status] Error:', error);
    return json(res, 500, { error: 'Failed to fetch premium status' }, reqId);
  }
}

export default function handler(req, res) {
  return runEndpoint(req, res, ['GET'], 'premium/status', async (_req, _res, reqId) => {
    const user = await requireAuth(_req);
    return handleGetStatus(_req, _res, reqId, user);
  });
}
