const PAYPAL_API_BASE = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || '';

function getAllowedOrigin(req) {
  const originHeader = req?.headers?.origin;
  const allowedOrigins = (ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (!allowedOrigins.length) {
    return '*';
  }

  if (originHeader && allowedOrigins.includes(originHeader)) {
    return originHeader;
  }

  return allowedOrigins[0];
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', getAllowedOrigin(res.req));
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, PayPal-Transmission-Id, PayPal-Transmission-Time, PayPal-Cert-Url, PayPal-Auth-Algo, PayPal-Transmission-Sig');
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.status(204).end();
    return true;
  }

  return false;
}

export function enforceOrigin(req) {
  const allowedOrigins = (ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (!allowedOrigins.length) {
    return { ok: true };
  }

  const origin = req.headers?.origin;
  if (!origin) {
    return { ok: false, error: 'Missing Origin' };
  }

  if (!allowedOrigins.includes(origin)) {
    return { ok: false, error: 'Origin not allowed' };
  }

  return { ok: true };
}

export async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Could not authenticate with PayPal');
  }

  return data.access_token;
}

export async function paypalFetch(path, options = {}) {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json();

  if (!response.ok) {
    const message = data?.details?.[0]?.description || data?.message || 'PayPal request failed';
    throw new Error(message);
  }

  return data;
}

export async function verifyWebhookSignature({ req, event }) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error('Missing PAYPAL_WEBHOOK_ID');
  }

  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const certUrl = req.headers['paypal-cert-url'];
  const authAlgo = req.headers['paypal-auth-algo'];
  const transmissionSig = req.headers['paypal-transmission-sig'];

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    throw new Error('Missing PayPal signature headers');
  }

  const result = await paypalFetch('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: event,
    }),
  });

  if (result?.verification_status !== 'SUCCESS') {
    throw new Error('PayPal webhook signature invalid');
  }

  return true;
}

export function paypalPlanId(plan) {
  const normalized = plan === 'yearly' || plan === 'premium_yearly' ? 'premium_yearly' : 'premium_monthly';
  const planId = normalized === 'premium_yearly' ? process.env.PAYPAL_YEARLY_PLAN_ID : process.env.PAYPAL_MONTHLY_PLAN_ID;
  if (!planId) {
    throw new Error(`Missing PayPal plan id for ${normalized}`);
  }
  return { planCode: normalized, planId };
}

export async function createPayPalSubscription({ user, plan }) {
  const { planCode, planId } = paypalPlanId(plan);
  const subscription = await paypalFetch('/v1/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: planId,
      custom_id: user.id,
      subscriber: {
        email_address: user.email,
      },
      application_context: {
        brand_name: 'AhorroYA',
        locale: 'es-UY',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${process.env.APP_URL || process.env.EXPO_PUBLIC_APP_URL || 'https://ahorroya.app'}/premium/success`,
        cancel_url: `${process.env.APP_URL || process.env.EXPO_PUBLIC_APP_URL || 'https://ahorroya.app'}/premium/cancel`,
      },
    }),
  });

  return {
    id: subscription.id,
    status: subscription.status,
    planCode,
    planId,
    approvalUrl: subscription.links?.find((link) => link.rel === 'approve')?.href || null,
  };
}

export async function updatePremiumProfile(userId, paypalOrderId, options = {}) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !userId) {
    return;
  }

  const premiumUntil = new Date();
  if (options.planCode === 'premium_yearly') {
    premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);
  } else {
    premiumUntil.setMonth(premiumUntil.getMonth() + 1);
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      id: userId,
      plan: 'premium',
      paypal_subscription_id: options.subscriptionId || paypalOrderId || null,
      premium_until: premiumUntil.toISOString(),
      is_premium: true,
    }),
  });

  if (!response.ok) {
    throw new Error('Payment captured, but Supabase profile update failed');
  }
}

export async function updateSubscriptionRecord({ subscriptionId, userId, planCode, planId, status, eventType, currentPeriodEnd, metadata = {} }) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || !subscriptionId) return;

  const response = await fetch(`${supabaseUrl}/rest/v1/subscriptions`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      user_id: userId || null,
      provider: 'paypal',
      provider_subscription_id: subscriptionId,
      provider_plan_id: planId || null,
      plan_code: planCode || 'premium_monthly',
      status,
      current_period_end: currentPeriodEnd || null,
      last_event_type: eventType || null,
      metadata,
      updated_at: new Date().toISOString(),
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Subscription update failed');
  }
  return data?.[0] || null;
}

export async function recordPremiumOrder({ orderId, userId, email, amount, currency, status }) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !orderId) {
    return;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/premium_orders`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      provider: 'paypal',
      provider_order_id: orderId,
      user_id: userId || null,
      email: email || null,
      amount: amount ? Number(amount) : null,
      currency: currency || 'USD',
      status,
    }),
  });

  if (!response.ok) {
    throw new Error('Payment captured, but premium order registration failed');
  }
}
