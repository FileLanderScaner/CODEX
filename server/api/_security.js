import { readEnv } from '../../lib/env.js';

const memoryCounters = new Map();

export function setCors(res, allowedOriginsCsv) {
  const originHeader = res.req?.headers?.origin;
  const allowedOrigins = (allowedOriginsCsv || '').split(',').map((value) => value.trim()).filter(Boolean);
  const allowOrigin = allowedOrigins.length
    ? allowedOrigins.includes(originHeader) ? originHeader : allowedOrigins[0]
    : '*';

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(req, res, allowedOriginsCsv) {
  if (req.method === 'OPTIONS') {
    setCors(res, allowedOriginsCsv);
    res.status(204).end();
    return true;
  }

  return false;
}

export function enforceOrigin(req, allowedOriginsCsv) {
  const allowedOrigins = (allowedOriginsCsv || '').split(',').map((value) => value.trim()).filter(Boolean);
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

export function clientIp(req) {
  return (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown')
    .toString()
    .split(',')[0]
    .trim();
}

async function upstashCommand(command) {
  const env = readEnv();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  const response = await fetch(`${env.UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!response.ok) {
    throw new Error(`Upstash rate limit failed (${response.status})`);
  }
  return response.json();
}

function memoryRateLimit(req, key, { limit, windowMs }) {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .toString()
    .split(',')[0]
    .trim();
  const now = Date.now();
  const bucket = `${key}:${ip}:${Math.floor(now / windowMs)}`;
  const current = memoryCounters.get(bucket) || 0;
  memoryCounters.set(bucket, current + 1);
  return { ok: current + 1 <= limit, ip, current: current + 1, limit };
}

export async function rateLimit(req, key, { limit = 100, windowMs = 60_000 } = {}) {
  const ip = clientIp(req);
  const env = readEnv();
  const windowSeconds = Math.ceil(windowMs / 1000);
  const bucket = `rate:${key}:${ip}:${Math.floor(Date.now() / windowMs)}`;

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    if (env.APP_ENV === 'production') {
      return { ok: false, ip, current: 0, limit, error: 'rate_limit_not_configured' };
    }
    return memoryRateLimit(req, key, { limit, windowMs });
  }

  const result = await upstashCommand([
    ['INCR', bucket],
    ['EXPIRE', bucket, windowSeconds],
  ]);
  const current = Number(result?.[0]?.result || 0);
  return {
    ok: current <= limit,
    ip,
    current,
    limit,
    reset_seconds: windowSeconds,
  };
}

export function getBearerToken(req) {
  const header = req.headers?.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1] || '';
}
