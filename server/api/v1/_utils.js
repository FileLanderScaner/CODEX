import crypto from 'node:crypto';
import pino from 'pino';
import { z } from 'zod';
import { readEnv } from '../../../lib/env.js';
import { getBearerToken, rateLimit } from '../_security.js';
import { getUserFromAccessToken } from '../supabase/_auth.js';

export const logger = pino({ name: 'ahorroya-api' });

export function requestId(req) {
  return req.headers['x-request-id'] || crypto.randomUUID();
}

export function json(res, status, body, reqId) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Request-Id', reqId);
  res.status(status).json({ request_id: reqId, ...body });
}

export function applySecurityHeaders(req, res, methods = 'GET,POST,DELETE,OPTIONS') {
  const env = readEnv();
  const origin = req.headers.origin;
  const allowOrigin = env.allowedOrigins.includes(origin) ? origin : env.allowedOrigins[0] || '';
  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id, X-Cron-Secret');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  res.setHeader('Cache-Control', 'no-store');
}

export function preflight(req, res, methods) {
  applySecurityHeaders(req, res, methods);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function guardMethod(req, res, reqId, methods) {
  if (!methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '));
    json(res, 405, { error: 'method_not_allowed' }, reqId);
    return false;
  }
  return true;
}

export async function guardRateLimit(req, res, reqId, key, options) {
  const limit = await rateLimit(req, key, options);
  if (!limit.ok) {
    json(res, 429, { error: limit.error || 'rate_limit_exceeded', limit: limit.limit }, reqId);
    return false;
  }
  return true;
}

export function validate(schema, value) {
  return schema.parse(value || {});
}

export async function supabaseRest(path, options = {}) {
  const { data } = await supabaseRestWithMeta(path, options);
  return data;
}

export async function supabaseRestWithMeta(path, options = {}) {
  const env = readEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase server config not available');
  }

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,count=exact',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || data?.hint || `Supabase request failed (${response.status})`);
  }
  const contentRange = response.headers.get('content-range') || '';
  const totalMatch = /\/(\d+|\*)$/.exec(contentRange);
  const total = totalMatch && totalMatch[1] !== '*' ? Number(totalMatch[1]) : null;
  return { data, total, contentRange };
}

export async function optionalUser(req) {
  return getUserFromAccessToken(getBearerToken(req));
}

export async function requireUser(req) {
  const user = await optionalUser(req);
  if (!user) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
  return user;
}

export async function requireRole(req, roles) {
  const user = await requireUser(req);
  const role = user.app_metadata?.role || 'authenticated';
  if (!roles.includes(role)) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }
  return { user, role };
}

export function cronAuthorized(req) {
  const env = readEnv();
  return Boolean(env.CRON_SHARED_SECRET && req.headers['x-cron-secret'] === env.CRON_SHARED_SECRET);
}

const optionalText = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().optional(),
);

const isoDate = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').optional(),
);

export const paginationSchema = z.object({
  q: optionalText,
  country: optionalText.transform((value) => value?.toUpperCase()).pipe(z.string().length(2).optional()),
  region: optionalText,
  currency: optionalText.transform((value) => value?.toUpperCase()).pipe(z.string().length(3).optional()),
  brand: optionalText,
  category: optionalText,
  date: isoDate,
  from: isoDate,
  to: isoDate,
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).optional(),
}).transform((query) => {
  const offset = query.offset ?? ((query.page ?? 1) - 1) * query.limit;
  return { ...query, offset };
}).superRefine((query, ctx) => {
  if (query.from && query.to && query.from > query.to) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['from'], message: 'from must be before or equal to to' });
  }
});

export function encodeFilterValue(value) {
  return encodeURIComponent(String(value).trim());
}

export function ilikeFilter(value) {
  return `ilike.*${encodeFilterValue(value)}*`;
}

export function buildPageMeta(query, total) {
  const normalizedTotal = Number.isFinite(total) ? total : null;
  return {
    limit: query.limit,
    offset: query.offset,
    page: Math.floor(query.offset / query.limit) + 1,
    total: normalizedTotal,
    has_more: normalizedTotal === null ? null : query.offset + query.limit < normalizedTotal,
  };
}

export async function runEndpoint(req, res, methods, key, handler) {
  const reqId = requestId(req);
  if (preflight(req, res, methods.join(','))) return;
  if (!guardMethod(req, res, reqId, methods)) return;
  if (!(await guardRateLimit(req, res, reqId, key, { limit: 100, windowMs: 60_000 }))) return;

  try {
    await handler(req, res, reqId);
  } catch (error) {
    const status = error.statusCode || (error instanceof z.ZodError ? 400 : 500);
    logger.error({ err: error, request_id: reqId, path: req.url }, 'api_error');
    json(res, status, { error: status === 500 ? 'internal_error' : error.message }, reqId);
  }
}
