import { describe, expect, it } from 'vitest';
import health from '../../api/v1/health.js';

function mockReq(method = 'GET') {
  return { method, headers: {}, socket: { remoteAddress: '127.0.0.1' }, url: '/api/v1/health' };
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

describe('GET /api/v1/health', () => {
  it('returns ok', async () => {
    const res = mockRes();
    await health(mockReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.request_id).toBeTruthy();
  });
});
