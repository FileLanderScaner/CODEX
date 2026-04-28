// /api/v1/premium/webhook-paypal.js
// Webhook para PayPal Subscriptions
// Actualiza estado de suscripción en base de datos

import { json, runEndpoint } from '../_utils.js';
import { supabaseServerClient } from '../../supabase/_utils.js';

/**
 * Tipos de eventos PayPal:
 * - BILLING.SUBSCRIPTION.CREATED → Nueva suscripción activada
 * - BILLING.SUBSCRIPTION.UPDATED → Cambio en suscripción
 * - BILLING.SUBSCRIPTION.CANCELLED → Usuario canceló
 * - BILLING.SUBSCRIPTION.EXPIRED → Expiró sin renovación
 * - PAYMENT.SALE.COMPLETED → Pago procesado
 * - PAYMENT.SALE.DENIED → Pago rechazado
 */

async function handlePayPalWebhook(req, res, reqId) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' }, reqId);
  }

  try {
    const event = req.body;
    const eventType = event?.event_type;
    const resource = event?.resource;

    if (!eventType || !resource) {
      return json(res, 400, { error: 'Invalid PayPal webhook payload' }, reqId);
    }

    const supabase = supabaseServerClient(req);
    const paypalSubscriptionId = resource.id;
    const customId = resource.custom_id; // Enviamos user_id aquí

    // Log eventos para auditoría
    await supabase
      .from('monetization_events')
      .insert({
        event_type: `paypal_webhook_${eventType.toLowerCase()}`,
        metadata: {
          paypal_event_id: event.id,
          paypal_subscription_id: paypalSubscriptionId,
          resource: {
            status: resource.status,
            billing_cycles: resource.billing_cycles,
          },
        },
      })
      .catch(() => null); // Ignore logging errors

    // Procesar según tipo de evento
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.UPDATED':
        return handleSubscriptionActive(supabase, req, res, reqId, resource, customId);

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        return handleSubscriptionCancelled(supabase, req, res, reqId, paypalSubscriptionId);

      case 'PAYMENT.SALE.COMPLETED':
        return handlePaymentCompleted(supabase, req, res, reqId, resource, customId);

      case 'PAYMENT.SALE.DENIED':
        return handlePaymentFailed(supabase, req, res, reqId, resource, customId);

      default:
        // Ignorar eventos no manejados
        return json(res, 200, { status: 'event_ignored' }, reqId);
    }
  } catch (error) {
    console.error('[webhook-paypal] Error:', error);
    // Siempre responder 200 a PayPal para evitar reintentos infinitos
    return json(res, 200, { error: 'Webhook processed with error', logged: true }, reqId);
  }
}

/**
 * Manejar suscripción activa
 */
async function handleSubscriptionActive(supabase, req, res, reqId, resource, customId) {
  try {
    const userId = customId; // custom_id = user_id enviado en createOrder
    if (!userId) {
      return json(res, 400, { error: 'Missing user_id in custom_id' }, reqId);
    }

    const subscriptionId = resource.id;
    const status = resource.status; // 'APPROVAL_PENDING', 'APPROVED', 'ACTIVE', 'SUSPENDED'
    const billingCycles = resource.billing_cycles || [];
    
    // Obtener el último ciclo de facturación
    const activeCycle = billingCycles.find((c) => c.pricing_scheme) || {};
    const amount = activeCycle?.pricing_scheme?.fixed_price?.value || 0;
    const frequency = activeCycle?.frequency || {};
    const intervalUnit = frequency.interval_unit; // DAY, WEEK, MONTH, YEAR
    const intervalCount = frequency.interval_count || 1;

    // Calcular fecha de expiración
    const nextBillingAt = new Date(resource.billing_cycles?.[0]?.tenure_type === 'TRIAL'
      ? resource.billing_cycles?.[1]?.start_time
      : resource.billing_cycles?.[0]?.start_time || new Date());

    const expiresAt = new Date(nextBillingAt);
    if (intervalUnit === 'MONTH') {
      expiresAt.setMonth(expiresAt.getMonth() + intervalCount);
    } else if (intervalUnit === 'YEAR') {
      expiresAt.setFullYear(expiresAt.getFullYear() + intervalCount);
    }

    // Determinar plan
    const plan = intervalUnit === 'YEAR' ? 'yearly' : 'monthly';

    // Insertar o actualizar suscripción
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        paypal_subscription_id: subscriptionId,
        plan,
        status: status === 'ACTIVE' ? 'active' : 'pending',
        amount_paid: Number(amount),
        currency: 'USD',
        expires_at: expiresAt.toISOString(),
        next_payment_at: expiresAt.toISOString(),
        started_at: new Date(resource.start_time || Date.now()).toISOString(),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (subError) throw subError;

    // Actualizar profile (legacy)
    await supabase
      .from('profiles')
      .update({
        plan: status === 'ACTIVE' ? 'premium' : 'free',
        paypal_order_id: subscriptionId,
        premium_until: status === 'ACTIVE' ? expiresAt.toISOString() : null,
      })
      .eq('id', userId)
      .catch(() => null); // Ignore if profile doesn't exist

    console.log(`[webhook] Subscription ${status} for user ${userId}`);
    return json(res, 200, { status: 'subscription_updated', subscription_id: subscriptionId }, reqId);
  } catch (error) {
    console.error('[webhook subscription] Error:', error);
    return json(res, 200, { error: 'Webhook processed with error', logged: true }, reqId);
  }
}

/**
 * Manejar suscripción cancelada
 */
async function handleSubscriptionCancelled(supabase, req, res, reqId, paypalSubscriptionId) {
  try {
    // Actualizar suscripción
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('paypal_subscription_id', paypalSubscriptionId)
      .catch(() => null);

    console.log(`[webhook] Subscription cancelled: ${paypalSubscriptionId}`);
    return json(res, 200, { status: 'subscription_cancelled' }, reqId);
  } catch (error) {
    console.error('[webhook cancelled] Error:', error);
    return json(res, 200, { error: 'Webhook processed', logged: true }, reqId);
  }
}

/**
 * Manejar pago completado
 */
async function handlePaymentCompleted(supabase, req, res, reqId, resource, customId) {
  try {
    const userId = customId;
    if (!userId) return json(res, 200, { status: 'payment_ignored' }, reqId);

    // Actualizar fecha de último pago
    await supabase
      .from('subscriptions')
      .update({
        last_payment_at: new Date(resource.create_time || Date.now()).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'active')
      .catch(() => null);

    console.log(`[webhook] Payment completed for user ${userId}`);
    return json(res, 200, { status: 'payment_recorded' }, reqId);
  } catch (error) {
    console.error('[webhook payment] Error:', error);
    return json(res, 200, { error: 'Webhook processed', logged: true }, reqId);
  }
}

/**
 * Manejar pago rechazado
 */
async function handlePaymentFailed(supabase, req, res, reqId, resource, customId) {
  try {
    const userId = customId;
    if (!userId) return json(res, 200, { status: 'failure_ignored' }, reqId);

    // Log de pago fallido
    await supabase
      .from('monetization_events')
      .insert({
        user_id: userId,
        event_type: 'payment_failed',
        metadata: {
          paypal_sale_id: resource.id,
          reason: resource.reason_code,
        },
      })
      .catch(() => null);

    console.log(`[webhook] Payment failed for user ${userId}`);
    return json(res, 200, { status: 'failure_recorded' }, reqId);
  } catch (error) {
    console.error('[webhook failure] Error:', error);
    return json(res, 200, { error: 'Webhook processed', logged: true }, reqId);
  }
}

export default function handler(req, res) {
  return runEndpoint(req, res, ['POST'], 'premium/webhook-paypal', async (_req, _res, reqId) => {
    return handlePayPalWebhook(_req, _res, reqId);
  });
}
