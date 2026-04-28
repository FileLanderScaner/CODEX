import { handleOptions, recordPremiumOrder, setCors, updatePremiumProfile, updateSubscriptionRecord, verifyWebhookSignature } from './_utils.js';

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

    await verifyWebhookSignature({ req, event });

    const resource = event?.resource || {};
    const eventType = event?.event_type;

    const userId = resource.purchase_units?.[0]?.custom_id || resource.custom_id || null;
    const orderId = resource.supplementary_data?.related_ids?.order_id || resource.id || null;

    if (userId && orderId && (eventType === 'CHECKOUT.ORDER.APPROVED' || eventType === 'PAYMENT.CAPTURE.COMPLETED')) {
      // Record the order as completed if PayPal indicates so; otherwise just keep a trace.
      const status = eventType === 'PAYMENT.CAPTURE.COMPLETED' ? 'COMPLETED' : 'APPROVED';
      const amount = resource?.amount?.value || resource?.purchase_units?.[0]?.amount?.value || null;
      const currency = resource?.amount?.currency_code || resource?.purchase_units?.[0]?.amount?.currency_code || null;
      const email = resource?.payer?.email_address || null;

      await recordPremiumOrder({ orderId, userId, email, amount, currency, status });

      if (status === 'COMPLETED') {
        await updatePremiumProfile(userId, orderId);
      }
    }

    if (eventType?.startsWith('BILLING.SUBSCRIPTION.')) {
      const subscriptionId = resource.id;
      const subscriptionUserId = resource.custom_id || userId;
      const planId = resource.plan_id || null;
      const planCode = planId && planId === process.env.PAYPAL_YEARLY_PLAN_ID ? 'premium_yearly' : 'premium_monthly';
      const status = String(resource.status || eventType.replace('BILLING.SUBSCRIPTION.', '')).toLowerCase();
      const cycle = resource.billing_info?.cycle_executions?.[0];
      const nextBillingTime = resource.billing_info?.next_billing_time || null;

      await updateSubscriptionRecord({
        subscriptionId,
        userId: subscriptionUserId,
        planCode,
        planId,
        status,
        eventType,
        currentPeriodEnd: nextBillingTime,
        metadata: { cycle },
      });

      if (subscriptionUserId && ['active', 'activated'].includes(status)) {
        await updatePremiumProfile(subscriptionUserId, subscriptionId, { subscriptionId, planCode });
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Webhook failed' });
  }
}
