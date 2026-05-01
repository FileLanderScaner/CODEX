import { z } from 'zod';

const boolish = z.union([z.boolean(), z.string()]).optional().transform((value) => {
  if (typeof value === 'boolean') return value;
  return String(value || '').toLowerCase() === 'true';
});

export const envSchema = z.object({
  APP_ENV: z.enum(['local', 'preview', 'production', 'test']).default('local'),
  APP_URL: z.string().url().optional().or(z.literal('')),
  API_BASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  PAYPAL_ENV: z.enum(['sandbox', 'live']).default('sandbox'),
  PAYPAL_CLIENT_ID: z.string().optional().default(''),
  PAYPAL_CLIENT_SECRET: z.string().optional().default(''),
  PAYPAL_WEBHOOK_ID: z.string().optional().default(''),
  PAYPAL_MONTHLY_PLAN_ID: z.string().optional().default(''),
  PAYPAL_YEARLY_PLAN_ID: z.string().optional().default(''),
  ALLOWED_ORIGINS: z.string().optional().default(''),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal('')),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(''),
  CRON_SHARED_SECRET: z.string().optional().default(''),
  AFFILIATE_SIGNING_SECRET: z.string().optional().default(''),
  FEATURE_FLAGS: z.string().optional().default('{}'),
  ENABLE_LOCAL_FALLBACK: boolish.default(true),
});

export function readEnv(source = process.env) {
  const parsed = envSchema.safeParse({
    APP_ENV: source.APP_ENV || source.NODE_ENV || 'local',
    APP_URL: source.APP_URL || source.EXPO_PUBLIC_APP_URL || source.NEXT_PUBLIC_APP_URL || '',
    API_BASE_URL: source.API_BASE_URL || source.EXPO_PUBLIC_API_BASE_URL || source.NEXT_PUBLIC_API_BASE_URL || '',
    SUPABASE_URL: source.SUPABASE_URL || source.EXPO_PUBLIC_SUPABASE_URL || source.NEXT_PUBLIC_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: source.SUPABASE_ANON_KEY || source.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || source.EXPO_PUBLIC_SUPABASE_ANON_KEY || source.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: source.SUPABASE_SERVICE_ROLE_KEY || '',
    PAYPAL_ENV: source.PAYPAL_ENV || 'sandbox',
    PAYPAL_CLIENT_ID: source.PAYPAL_CLIENT_ID || '',
    PAYPAL_CLIENT_SECRET: source.PAYPAL_CLIENT_SECRET || '',
    PAYPAL_WEBHOOK_ID: source.PAYPAL_WEBHOOK_ID || '',
    PAYPAL_MONTHLY_PLAN_ID: source.PAYPAL_MONTHLY_PLAN_ID || '',
    PAYPAL_YEARLY_PLAN_ID: source.PAYPAL_YEARLY_PLAN_ID || '',
    ALLOWED_ORIGINS: source.ALLOWED_ORIGINS || '',
    UPSTASH_REDIS_REST_URL: source.UPSTASH_REDIS_REST_URL || '',
    UPSTASH_REDIS_REST_TOKEN: source.UPSTASH_REDIS_REST_TOKEN || '',
    CRON_SHARED_SECRET: source.CRON_SHARED_SECRET || '',
    AFFILIATE_SIGNING_SECRET: source.AFFILIATE_SIGNING_SECRET || '',
    FEATURE_FLAGS: source.FEATURE_FLAGS || '{}',
    ENABLE_LOCAL_FALLBACK: source.ENABLE_LOCAL_FALLBACK ?? 'true',
  });

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment: ${message}`);
  }

  let featureFlags = {};
  try {
    featureFlags = JSON.parse(parsed.data.FEATURE_FLAGS || '{}');
  } catch {
    featureFlags = {};
  }

  return {
    ...parsed.data,
    FEATURE_FLAGS: featureFlags,
    allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean),
  };
}

export function assertServerSecrets(env = readEnv()) {
  const missing = [];
  if (!env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    throw new Error(`Missing server secrets: ${missing.join(', ')}`);
  }
}
