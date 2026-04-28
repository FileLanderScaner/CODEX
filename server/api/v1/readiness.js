import { readEnv } from '../../../lib/env.js';
import { json, runEndpoint } from './_utils.js';

export default function handler(req, res) {
  return runEndpoint(req, res, ['GET'], 'readiness', async (_req, _res, reqId) => {
    const env = readEnv();
    json(res, 200, {
      status: env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY ? 'ready' : 'degraded',
      fallback: env.ENABLE_LOCAL_FALLBACK,
    }, reqId);
  });
}
