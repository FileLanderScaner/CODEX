import { describe, expect, it } from 'vitest';
import { validateProductionEnv } from '../../scripts/validate-production-env.mjs';

const base = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon',
  EXPO_PUBLIC_API_BASE_URL: 'https://staging.ahorroya.app',
  EXPO_PUBLIC_APP_URL: 'https://staging.ahorroya.app',
  EXPO_PUBLIC_PAYPAL_CLIENT_ID: 'paypal-public',
  EXPO_PUBLIC_GOOGLE_CLIENT_ID: 'google-public',
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role',
  PAYPAL_ENV: 'sandbox',
  PAYPAL_CLIENT_ID: 'paypal-server',
  PAYPAL_CLIENT_SECRET: 'paypal-secret',
  PAYPAL_WEBHOOK_ID: 'webhook',
  PAYPAL_MONTHLY_PLAN_ID: 'P-monthly',
  PAYPAL_YEARLY_PLAN_ID: 'P-yearly',
  ALLOWED_ORIGINS: 'https://staging.ahorroya.app',
  AI_PROVIDER: 'mock',
  AI_AUTONOMY_LEVEL: 'LEVEL_0_READ_ONLY',
  ENABLE_AI_LEVEL4_OVERRIDE: 'false',
};

describe('validateProductionEnv', () => {
  it('detects staging readiness with sandbox credentials and safe AI flags', () => {
    const result = validateProductionEnv(base);
    expect(result.mode).toBe('staging_ready');
    expect(result.checks.paypal).toBe(true);
    expect(result.exposed).toEqual([]);
  });

  it('detects production readiness only with live PayPal and Google backend credentials', () => {
    const result = validateProductionEnv({
      ...base,
      PAYPAL_ENV: 'live',
      GOOGLE_OAUTH_CLIENT_ID: 'google-server',
      GOOGLE_OAUTH_CLIENT_SECRET: 'google-secret',
    });
    expect(result.mode).toBe('production_ready');
  });

  it('detects dangerous public secret exposure', () => {
    const result = validateProductionEnv({
      ...base,
      EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: 'do-not-expose',
    });
    expect(result.mode).toBe('demo_or_partial');
    expect(result.exposed).toContain('EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
  });

  it('blocks unsafe level 4 defaults', () => {
    const result = validateProductionEnv({
      ...base,
      AI_AUTONOMY_LEVEL: 'LEVEL_4_CONTROLLED_EXECUTION',
      ENABLE_AI_LEVEL4_OVERRIDE: 'true',
    });
    expect(result.mode).toBe('demo_or_partial');
    expect(result.risks.join(' ')).toMatch(/LEVEL_4/);
  });
});
