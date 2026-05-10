import { handleOptions, PayPalWebhookError, recordPremiumOrder, setCors, updatePremiumProfile, updateSubscriptionRecord, verifyWebhookSignature } from './_utils.js';

const SUBSCRIPTION_EVENTS = new Set([
  'BILLING.SUBSCRIPTION.CREATED',
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.EXPIRED',
  'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
]);

const CHECKOUT_EVENTS = new Set([
  'CHECKOUT.ORDER.APPROVED',
  'PAYMENT.CAPTURE.COMPLETED',
]);

function headerPresent(req, name) {
  return Boolean(req.headers?.[name]);
}

function safeWebhookLog(req, event, metadata = {}) {
  const entry = {
    request_id: req.headers?.['x-request-id'] || null,
    event_type: event?.event_type || null,
    event_id: event?.id || null,
    paypal_transmission_id_present: headerPresent(req, 'paypal-transmission-id'),
    paypal_cert_url_present: headerPresent(req, 'paypal-cert-url'),
    paypal_auth_algo_present: headerPresent(req, 'paypal-auth-algo'),
    paypal_transmission_sig_present: headerPresent(req, 'paypal-transmission-sig'),
    paypal_webhook_id_present: Boolean(process.env.PAYPAL_WEBHOOK_ID),
    ...metadata,
  };
  console.log(JSON.stringify({ event: 'paypal_webhook', ...entry }));
}

function normalizedStatus(eventType, resource) {
  if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') return 'active';
  if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') return 'cancelled';
  if (eventType === 'BILLING.SUBSCRIPTION.SUSPENDED') return 'suspended';
  if (eventType === 'BILLING.SUBSCRIPTION.EXPIRED') return 'expired';
  if (eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') return 'payment_failed';
  return String(resource.status || eventType.replace('BILLING.SUBSCRIPTION.', '')).toLowerCase();
}

function premiumEntitlementForStatus(status, currentPeriodEnd) {
  if (status === 'active' || status === 'activated') {
    return { isPremium: true, premiumUntil: currentPeriodEnd || null };
  }

  if (status === 'cancelled' && currentPeriodEnd) {
    const expiresAt = new Date(currentPeriodEnd);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt > new Date()) {
      return { isPremium: true, premiumUntil: currentPeriodEnd };
    }
  }

  if (['cancelled', 'suspended', 'expired', 'payment_failed'].includes(status)) {
    return { isPremium: false, premiumUntil: null };
  }

  return null;
}

function isUuid(value) {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function runSupabaseStage(fn) {
  try {
    return await fn();
  } catch (error) {
    if (process.env.ENVIRONMENT === 'staging' && error?.code === 'PGRST205') {
      return { softFailed: true, reason: 'storage_unavailable', code: error.code };
    }
    throw new PayPalWebhookError(error?.message || 'PayPal webhook Supabase update failed', {
      statusCode: 502,
      code: 'paypal_supabase_update_failed',
      stage: 'supabase_update',
    });
  }
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) {
    return;
  }

  setCors(res);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const event = req.body;
    const eventType = event?.event_type;

    safeWebhookLog(req, event, { stage: 'parse_body', verification: 'pending' });

    try {
      await verifyWebhookSignature({ req, event });
      safeWebhookLog(req, event, { stage: 'verify_signature', verification: 'verified' });
    } catch (error) {
      const verification = error?.code === 'paypal_signature_headers_missing'
        ? 'missing_headers'
        : error?.code === 'paypal_signature_verification_failed'
          ? 'failed'
          : 'failed';
      safeWebhookLog(req, event, {
        stage: error?.stage || 'verify_signature',
        verification,
        error_code: error?.code || 'paypal_signature_error',
      });
      throw error;
    }

    const resource = event?.resource || {};

    const userId = resource.purchase_units?.[0]?.custom_id || resource.custom_id || null;
    const orderId = resource.supplementary_data?.related_ids?.order_id || resource.id || null;

    if (CHECKOUT_EVENTS.has(eventType)) {
      if (!userId || !orderId) {
        safeWebhookLog(req, event, { stage: 'unsupported_event', verification: 'verified', action: 'ignored_missing_checkout_identity' });
        res.status(200).json({ received: true, status: 'ignored', reason: 'missing_checkout_identity' });
        return;
      }
      // Record the order as completed if PayPal indicates so; otherwise just keep a trace.
      const status = eventType === 'PAYMENT.CAPTURE.COMPLETED' ? 'COMPLETED' : 'APPROVED';
      const amount = resource?.amount?.value || resource?.purchase_units?.[0]?.amount?.value || null;
      const currency = resource?.amount?.currency_code || resource?.purchase_units?.[0]?.amount?.currency_code || null;
      const email = resource?.payer?.email_address || null;

      const orderResult = await runSupabaseStage(() => recordPremiumOrder({ orderId, userId, email, amount, currency, status }));
      if (orderResult?.softFailed) {
        safeWebhookLog(req, event, { stage: 'supabase_update', verification: 'verified', action: 'storage_unavailable', error_code: orderResult.code });
        res.status(202).json({ received: true, status: 'accepted_pending_storage', reason: orderResult.reason });
        return;
      }

      if (status === 'COMPLETED') {
        const profileResult = await runSupabaseStage(() => updatePremiumProfile(userId, orderId));
        if (profileResult?.softFailed) {
          safeWebhookLog(req, event, { stage: 'supabase_update', verification: 'verified', action: 'storage_unavailable', error_code: profileResult.code });
          res.status(202).json({ received: true, status: 'accepted_pending_storage', reason: profileResult.reason });
          return;
        }
      }
      safeWebhookLog(req, event, { stage: 'supabase_update', verification: 'verified', action: 'checkout_recorded' });
      res.status(200).json({ received: true, status: 'processed' });
      return;
    }

    if (SUBSCRIPTION_EVENTS.has(eventType)) {
      const subscriptionId = resource.id;
      const subscriptionUserId = resource.custom_id || userId;
      const planId = resource.plan_id || null;
      const planCode = planId && planId === process.env.PAYPAL_YEARLY_PLAN_ID ? 'premium_yearly' : 'premium_monthly';
      const status = normalizedStatus(eventType, resource);
      const cycle = resource.billing_info?.cycle_executions?.[0];
      const nextBillingTime = resource.billing_info?.next_billing_time || null;

      if (!subscriptionId) {
        safeWebhookLog(req, event, { stage: 'unsupported_event', verification: 'verified', action: 'ignored_missing_subscription_id' });
        res.status(200).json({ received: true, status: 'ignored', reason: 'missing_subscription_id' });
        return;
      }

      if (!isUuid(subscriptionUserId)) {
        safeWebhookLog(req, event, { stage: 'unsupported_event', verification: 'verified', action: 'ignored_missing_subscription_user_identity' });
        res.status(200).json({ received: true, status: 'ignored', reason: 'missing_subscription_user_identity' });
        return;
      }

      const subscriptionResult = await runSupabaseStage(() => updateSubscriptionRecord({
        subscriptionId,
        userId: subscriptionUserId,
        planCode,
        planId,
        status,
        eventType,
        currentPeriodEnd: nextBillingTime,
        metadata: { cycle },
      }));
      if (subscriptionResult?.softFailed) {
        safeWebhookLog(req, event, { stage: 'supabase_update', verification: 'verified', action: 'storage_unavailable', error_code: subscriptionResult.code });
        res.status(202).json({ received: true, status: 'accepted_pending_storage', reason: subscriptionResult.reason });
        return;
      }

      const entitlement = premiumEntitlementForStatus(status, nextBillingTime);
      if (subscriptionUserId && entitlement) {
        const profileResult = await runSupabaseStage(() => updatePremiumProfile(subscriptionUserId, subscriptionId, {
          subscriptionId,
          planCode,
          isPremium: entitlement.isPremium,
          premiumUntil: entitlement.premiumUntil,
        }));
        if (profileResult?.softFailed) {
          safeWebhookLog(req, event, { stage: 'supabase_update', verification: 'verified', action: 'storage_unavailable', error_code: profileResult.code });
          res.status(202).json({ received: true, status: 'accepted_pending_storage', reason: profileResult.reason });
          return;
        }
      }
      safeWebhookLog(req, event, { stage: 'supabase_update', verification: 'verified', action: 'subscription_recorded' });
      res.status(200).json({ received: true, status: 'processed' });
      return;
    }

    safeWebhookLog(req, event, { stage: 'unsupported_event', verification: 'verified', action: 'ignored_unsupported_event' });
    res.status(200).json({ received: true, status: 'ignored', event_type: eventType || 'unknown' });
  } catch (error) {
    const statusCode = error?.statusCode || 500;
    const stage = error?.stage || (error instanceof PayPalWebhookError ? error.stage : 'unknown_error');
    safeWebhookLog(req, req.body, {
      stage,
      verification: error?.code === 'paypal_signature_verification_failed' ? 'failed' : 'failed',
      error_code: error?.code || 'paypal_webhook_processing_failed',
    });
    res.status(statusCode).json({
      error: error?.code || 'paypal_webhook_failed',
      stage,
    });
  }
}
