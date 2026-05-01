import { describe, expect, it } from 'vitest';
import readiness from '../../server/api/v1/readiness.js';

function mockReq(method = 'GET') {
  return { method, headers: {}, socket: { remoteAddress: '127.0.0.1' }, url: '/api/v1/readiness' };
}

function mockRes() {
  return {
    headers: {},
    statusCode: 0,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

describe('GET /api/v1/readiness', () => {
  it('reports production capabilities without exposing secrets', async () => {
    const res = mockRes();
    await readiness(mockReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.checks).toHaveProperty('supabase_server');
    expect(res.body.checks).toHaveProperty('paypal');
    expect(JSON.stringify(res.body)).not.toMatch(/service_role|password|secret/i);
  });
});
