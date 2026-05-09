import fs from 'node:fs';
import path from 'node:path';

const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';
const ENV_FILE = path.join(process.cwd(), '.env.server.local');
const RLS_ENV_FILE = path.join(process.cwd(), '.env.rls');
const DEFAULT_PREVIEW_URL = 'https://codex-akuma424424-akuma424-projects.vercel.app';

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

function requireValue(env, key) {
  const value = env[key] || process.env[key] || '';
  if (!String(value).trim()) throw new Error(`Missing ${key}`);
  return value;
}

function argValue(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : '';
}

function normalizeBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('Preview URL must be HTTPS');
  return url.origin;
}

function safePayPalError(data) {
  return data?.details?.[0]?.description
    || data?.message
    || data?.error_description
    || data?.error
    || 'PayPal request failed';
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
    throw new Error(`PayPal sandbox OAuth failed: ${safePayPalError(data)}`);
  }
  return data.access_token;
}

async function createSubscription(token, body) {
  const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Create PayPal sandbox subscription failed: ${safePayPalError(data)}`);
  }
  return data;
}

async function getSupabaseUserId(env) {
  const supabaseUrl = requireValue(env, 'SUPABASE_URL').replace(/\/+$/, '');
  const anonKey = requireValue(env, 'SUPABASE_ANON_KEY');
  const email = requireValue(env, 'RLS_NORMAL_EMAIL');
  const password = requireValue(env, 'RLS_NORMAL_PASSWORD');
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.user?.id) {
    throw new Error('Could not resolve staging RLS normal user id');
  }
  return { userId: data.user.id, email };
}

const env = { ...parseEnvFile(ENV_FILE), ...parseEnvFile(RLS_ENV_FILE), ...process.env };
if (env.PAYPAL_ENV !== 'sandbox') {
  throw new Error('PAYPAL_ENV must be sandbox for this script');
}

const clientId = requireValue(env, 'PAYPAL_CLIENT_ID');
const clientSecret = requireValue(env, 'PAYPAL_CLIENT_SECRET');
const planId = requireValue(env, 'PAYPAL_MONTHLY_PLAN_ID');
const previewUrl = normalizeBaseUrl(
  argValue('preview-url')
    || env.PAYPAL_SUBSCRIPTION_RETURN_BASE_URL
    || env.EXPO_PUBLIC_APP_URL
    || env.APP_URL
    || DEFAULT_PREVIEW_URL,
);
const useRlsNormalUser = process.argv.includes('--use-rls-normal-user');
const explicitUserId = argValue('user-id');
const resolvedUser = useRlsNormalUser ? await getSupabaseUserId(env) : null;
const customId = explicitUserId || resolvedUser?.userId || `sandbox-validation-${Date.now()}`;
const subscriberEmail = resolvedUser?.email || '';

const token = await getAccessToken(clientId, clientSecret);
const subscription = await createSubscription(token, {
  plan_id: planId,
  custom_id: customId,
  ...(subscriberEmail ? { subscriber: { email_address: subscriberEmail } } : {}),
  application_context: {
    brand_name: 'AhorroYA',
    locale: 'es-UY',
    shipping_preference: 'NO_SHIPPING',
    user_action: 'SUBSCRIBE_NOW',
    return_url: `${previewUrl}/premium/success`,
    cancel_url: `${previewUrl}/premium/cancel`,
  },
});

const approvalUrl = subscription.links?.find((link) => link.rel === 'approve')?.href || '';
if (!subscription.id || !approvalUrl) {
  throw new Error('PayPal sandbox subscription did not return id and approval_url');
}

console.log(`PAYPAL_SUBSCRIPTION_ID=${subscription.id}`);
console.log(`PAYPAL_PLAN_ID=${planId}`);
console.log(`PAYPAL_CUSTOM_ID_SOURCE=${useRlsNormalUser ? 'rls_normal_user' : explicitUserId ? 'explicit_user_id' : 'sandbox_validation'}`);
console.log(`APPROVAL_URL=${approvalUrl}`);
console.log('PAYPAL_REAL_SUBSCRIPTION_CREATED');
