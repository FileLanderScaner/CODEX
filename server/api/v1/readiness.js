import { readEnv } from '../../../lib/env.js';
import { json, runEndpoint } from './_utils.js';

export default function handler(req, res) {
  return runEndpoint(req, res, ['GET'], 'readiness', async (_req, _res, reqId) => {
    const env = readEnv();
    const hasSupabase = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
    const hasSupabasePublic = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
    const hasPayPal = Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
    const hasGoogle = Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
    const hasRateLimitStore = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
    const hasAllowedOrigins = env.allowedOrigins.length > 0;
    const productionReady = hasSupabase && hasSupabasePublic && hasPayPal && hasAllowedOrigins;
    json(res, 200, {
      status: productionReady && (hasRateLimitStore || env.ENABLE_LOCAL_FALLBACK) ? 'ready' : 'degraded',
      mode: productionReady ? 'production' : 'demo_or_partial',
      checks: {
        supabase_server: hasSupabase ? 'ready' : 'missing_config',
        supabase_public: hasSupabasePublic ? 'ready' : 'missing_config',
        paypal: hasPayPal ? 'ready' : 'demo_or_missing_config',
        google_auth: hasGoogle ? 'configured' : 'fallback_demo',
        allowed_origins: hasAllowedOrigins ? 'configured' : 'open_or_missing',
        rate_limit: hasRateLimitStore ? 'upstash' : env.ENABLE_LOCAL_FALLBACK ? 'memory_fallback' : 'missing_config',
        local_fallback: env.ENABLE_LOCAL_FALLBACK ? 'enabled' : 'disabled',
        tracking: hasSupabase ? 'supabase_with_local_fallback' : 'local_only',
      },
    }, reqId);
  });
}
