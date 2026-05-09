import { afterEach, describe, expect, it, vi } from 'vitest';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_USER_ID = '22222222-2222-4222-8222-222222222222';
const THIRD_USER_ID = '33333333-3333-4333-8333-333333333333';

function mockReq(body, headers = {}) {
  return {
    method: 'POST',
    headers: {
      'paypal-transmission-id': 'transmission-id',
      'paypal-transmission-time': '2026-05-09T00:00:00Z',
      'paypal-cert-url': 'https://api-m.sandbox.paypal.com/certs/test',
      'paypal-auth-algo': 'SHA256withRSA',
      'paypal-transmission-sig': 'signature',
      ...headers,
    },
    socket: { remoteAddress: '127.0.0.1' },
    url: '/api/v1/billing/webhooks/paypal',
    body,
    query: {},
  };
}

function mockRes() {
  return {
    headers: {},
    statusCode: 0,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { this.ended = true; return this; },
  };
}

async function loadHandler(env = {}) {
  vi.resetModules();
  process.env = {
    ...process.env,
    PAYPAL_ENV: 'sandbox',
    PAYPAL_CLIENT_ID: 'paypal-client-id',
    PAYPAL_CLIENT_SECRET: 'paypal-client-secret',
    PAYPAL_WEBHOOK_ID: 'webhook-id',
    PAYPAL_MONTHLY_PLAN_ID: 'P-monthly',
    PAYPAL_YEARLY_PLAN_ID: 'P-yearly',
    SUPABASE_URL: 'https://supabase.example.com',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    ...env,
  };
  const mod = await import('../../server/api/paypal/webhook.js');
  return mod.default;
}

function jsonResponse(body, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

function mockVerifiedFetch(extraResponses = []) {
  vi.stubGlobal('fetch', vi.fn()
    .mockImplementationOnce(() => jsonResponse({ access_token: 'paypal-access-token' }))
    .mockImplementationOnce(() => jsonResponse({ verification_status: 'SUCCESS' }))
    .mockImplementationOnce(() => jsonResponse([{ id: 'updated' }]))
    .mockImplementationOnce(() => jsonResponse([{ id: 'updated-profile' }]))
    .mockImplementation(() => {
      const next = extraResponses.shift();
      return next || jsonResponse([{ id: 'updated' }]);
    }));
}

describe('PayPal webhook handler', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('processes BILLING.SUBSCRIPTION.CREATED after signature verification', async () => {
    mockVerifiedFetch();
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({
      id: 'WH-created',
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource: { id: 'sub-1', custom_id: USER_ID, plan_id: 'P-monthly', status: 'CREATED' },
    }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('processed');
  });

  it('processes BILLING.SUBSCRIPTION.ACTIVATED and updates premium profile', async () => {
    mockVerifiedFetch();
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({
      id: 'WH-activated',
      event_type: 'BILLING.SUBSCRIPTION.ACTIVATED',
      resource: { id: 'sub-2', custom_id: SECOND_USER_ID, plan_id: 'P-yearly', status: 'ACTIVE' },
    }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('processed');
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('processes BILLING.SUBSCRIPTION.CANCELLED without a 500', async () => {
    mockVerifiedFetch();
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({
      id: 'WH-cancelled',
      event_type: 'BILLING.SUBSCRIPTION.CANCELLED',
      resource: { id: 'sub-3', custom_id: THIRD_USER_ID, plan_id: 'P-monthly', status: 'CANCELLED' },
    }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('processed');
  });

  it('ignores PAYMENT.CAPTURE.COMPLETED when the payload has no user/order identity', async () => {
    mockVerifiedFetch();
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({
      id: 'WH-capture',
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: { id: 'capture-only' },
    }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ignored');
    expect(res.body.reason).toBe('missing_checkout_identity');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('ignores subscription events without a valid internal user id', async () => {
    mockVerifiedFetch();
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({
      id: 'WH-created-missing-user',
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource: { id: 'sub-missing-user', custom_id: 'sandbox-validation-123', plan_id: 'P-monthly', status: 'CREATED' },
    }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ignored');
    expect(res.body.reason).toBe('missing_subscription_user_identity');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns a controlled 400 when PayPal signature headers are missing', async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({
      id: 'WH-missing-headers',
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource: { id: 'sub-4' },
    }, {
      'paypal-transmission-id': undefined,
    }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('paypal_signature_headers_missing');
  });

  it('returns controlled config error when PAYPAL_WEBHOOK_ID is missing', async () => {
    const handler = await loadHandler({ PAYPAL_WEBHOOK_ID: '' });
    const res = mockRes();
    await handler(mockReq({
      id: 'WH-missing-config',
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource: { id: 'sub-5' },
    }), res);
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('paypal_webhook_config_invalid');
  });

  it('reports Supabase update errors without exposing secrets', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockImplementationOnce(() => jsonResponse({ access_token: 'paypal-access-token' }))
      .mockImplementationOnce(() => jsonResponse({ verification_status: 'SUCCESS' }))
      .mockImplementationOnce(() => jsonResponse({ message: 'relation missing' }, 500)));
    const handler = await loadHandler({ SUPABASE_SERVICE_ROLE_KEY: 'super-secret-service-role' });
    const res = mockRes();
    await handler(mockReq({
      id: 'WH-supabase-error',
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource: { id: 'sub-6', custom_id: USER_ID, plan_id: 'P-monthly' },
    }), res);
    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe('paypal_supabase_update_failed');
    expect(JSON.stringify(res.body)).not.toContain('super-secret-service-role');
  });

  it('accepts verified staging webhooks when optional storage is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockImplementationOnce(() => jsonResponse({ access_token: 'paypal-access-token' }))
      .mockImplementationOnce(() => jsonResponse({ verification_status: 'SUCCESS' }))
      .mockImplementationOnce(() => jsonResponse({ code: 'PGRST205', message: 'table not found in schema cache' }, 404)));
    const handler = await loadHandler({ ENVIRONMENT: 'staging' });
    const res = mockRes();
    await handler(mockReq({
      id: 'WH-storage-unavailable',
      event_type: 'BILLING.SUBSCRIPTION.CREATED',
      resource: { id: 'sub-storage-missing', custom_id: USER_ID, plan_id: 'P-monthly' },
    }), res);
    expect(res.statusCode).toBe(202);
    expect(res.body.status).toBe('accepted_pending_storage');
    expect(res.body.reason).toBe('storage_unavailable');
  });
});
