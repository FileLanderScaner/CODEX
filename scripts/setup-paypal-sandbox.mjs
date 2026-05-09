import fs from 'node:fs';
import path from 'node:path';

const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';
const ENV_FILE = path.join(process.cwd(), '.env.server.local');
const WEBHOOK_EVENTS = [
  'BILLING.SUBSCRIPTION.CREATED',
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.SUSPENDED',
  'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
  'PAYMENT.SALE.COMPLETED',
];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function writeEnvFile(filePath, env) {
  const order = [
    'ENVIRONMENT',
    'SUPABASE_STAGING_PROJECT_REF',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ALLOWED_ORIGINS',
    'APP_URL',
    'PAYPAL_ENV',
    'PAYPAL_CLIENT_ID',
    'PAYPAL_CLIENT_SECRET',
    'PAYPAL_WEBHOOK_ID',
    'PAYPAL_MONTHLY_PLAN_ID',
    'PAYPAL_YEARLY_PLAN_ID',
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_CLIENT_SECRET',
    'AI_PROVIDER',
    'AI_GATEWAY_ENABLED',
    'AI_GATEWAY_MODEL',
    'AI_GATEWAY_MAX_OUTPUT_TOKENS',
    'AI_GATEWAY_SMOKE_PROMPT_ENABLED',
    'ENABLE_AI_AGENTS',
    'AI_AUTONOMY_LEVEL',
    'ENABLE_ADMIN_AI_PANEL',
    'ENABLE_AI_LEVEL4_OVERRIDE',
  ];
  const lines = [];
  for (const key of order) {
    if (Object.prototype.hasOwnProperty.call(env, key)) lines.push(`${key}=${env[key]}`);
  }
  for (const [key, value] of Object.entries(env)) {
    if (!order.includes(key)) lines.push(`${key}=${value}`);
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
}

function requireValue(env, key) {
  const value = env[key] || process.env[key] || '';
  if (!String(value).trim()) throw new Error(`Missing ${key}`);
  return value;
}

async function paypalRequest(pathname, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${PAYPAL_API_BASE}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.details?.[0]?.description || data?.message || data?.error_description || data?.error || 'PayPal request failed';
    throw new Error(`${method} ${pathname} failed: ${message}`);
  }
  return data;
}

async function getAccessToken(clientId, clientSecret) {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error('PayPal sandbox OAuth failed');
  }
  return data.access_token;
}

async function createProduct(token) {
  return paypalRequest('/v1/catalogs/products', {
    method: 'POST',
    token,
    body: {
      name: 'AhorroYA Premium',
      description: 'Suscripcion premium para alertas de ahorro, mejores precios, recomendaciones inteligentes y funciones avanzadas.',
      type: 'SERVICE',
      category: 'SOFTWARE',
    },
  });
}

async function createPlan(token, { productId, name, intervalUnit, price }) {
  const plan = await paypalRequest('/v1/billing/plans', {
    method: 'POST',
    token,
    body: {
      product_id: productId,
      name,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: intervalUnit,
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: price,
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    },
  });

  if (plan.status && plan.status !== 'ACTIVE') {
    await paypalRequest(`/v1/billing/plans/${encodeURIComponent(plan.id)}/activate`, {
      method: 'POST',
      token,
    }).catch(() => null);
  }

  return plan;
}

async function createWebhook(token, webhookUrl) {
  return paypalRequest('/v1/notifications/webhooks', {
    method: 'POST',
    token,
    body: {
      url: webhookUrl,
      event_types: WEBHOOK_EVENTS.map((name) => ({ name })),
    },
  });
}

const env = { ...parseEnvFile(ENV_FILE), ...process.env };
const clientId = requireValue(env, 'PAYPAL_CLIENT_ID');
const clientSecret = requireValue(env, 'PAYPAL_CLIENT_SECRET');
const envFileValues = parseEnvFile(ENV_FILE);
const previewUrl = requireValue(env, 'PREVIEW_URL').replace(/\/+$/, '');
const webhookUrl = `${previewUrl}/api/v1/billing/webhooks/paypal`;

if (env.PAYPAL_ENV && env.PAYPAL_ENV !== 'sandbox') {
  throw new Error('PAYPAL_ENV must be sandbox for this script');
}

const token = await getAccessToken(clientId, clientSecret);
const product = await createProduct(token);

if (!envFileValues.PAYPAL_MONTHLY_PLAN_ID) {
  const monthly = await createPlan(token, {
    productId: product.id,
    name: 'AhorroYA Premium Monthly',
    intervalUnit: 'MONTH',
    price: '2.99',
  });
  if (!String(monthly.id || '').startsWith('P-')) throw new Error('Monthly PayPal plan id did not start with P-');
  envFileValues.PAYPAL_MONTHLY_PLAN_ID = monthly.id;
  console.log(`PRODUCT_ID=${product.id}`);
  console.log(`PAYPAL_MONTHLY_PLAN_ID=${monthly.id}`);
}

if (!envFileValues.PAYPAL_YEARLY_PLAN_ID) {
  const yearly = await createPlan(token, {
    productId: product.id,
    name: 'AhorroYA Premium Yearly',
    intervalUnit: 'YEAR',
    price: '29.99',
  });
  if (!String(yearly.id || '').startsWith('P-')) throw new Error('Yearly PayPal plan id did not start with P-');
  envFileValues.PAYPAL_YEARLY_PLAN_ID = yearly.id;
  if (!envFileValues.PAYPAL_MONTHLY_PLAN_ID) console.log(`PRODUCT_ID=${product.id}`);
  console.log(`PAYPAL_YEARLY_PLAN_ID=${yearly.id}`);
}

if (!envFileValues.PAYPAL_WEBHOOK_ID) {
  const webhook = await createWebhook(token, webhookUrl);
  if (!webhook.id) throw new Error('PayPal webhook id was empty');
  envFileValues.PAYPAL_WEBHOOK_ID = webhook.id;
  console.log(`PAYPAL_WEBHOOK_ID=${webhook.id}`);
}

envFileValues.PAYPAL_ENV = 'sandbox';
writeEnvFile(ENV_FILE, envFileValues);
console.log(`PAYPAL_WEBHOOK_URL=${webhookUrl}`);
console.log('PAYPAL_SANDBOX_SETUP_COMPLETE');
