import { readEnv } from '../../../lib/env.js';
import { json, runEndpoint } from './_utils.js';

export default function handler(req, res) {
  return runEndpoint(req, res, ['GET'], 'readiness', async (_req, _res, reqId) => {
    const env = readEnv();
    const hasSupabase = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
    const hasRateLimitStore = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
    json(res, 200, {
      status: hasSupabase && (hasRateLimitStore || env.ENABLE_LOCAL_FALLBACK) ? 'ready' : 'degraded',
      checks: {
        supabase: hasSupabase ? 'ready' : 'missing_config',
        rate_limit: hasRateLimitStore ? 'upstash' : env.ENABLE_LOCAL_FALLBACK ? 'memory_fallback' : 'missing_config',
      },
    }, reqId);
  });
}
