import { describe, expect, it } from 'vitest';
import { applySecurityHeaders } from '../../server/api/v1/_utils.js';

function mockRes() {
  return {
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
  };
}

describe('API CORS headers', () => {
  it('allows only configured origins', () => {
    const previous = process.env.ALLOWED_ORIGINS;
    process.env.ALLOWED_ORIGINS = 'https://staging.ahorroya.app,http://localhost:8081';
    const res = mockRes();
    applySecurityHeaders({ headers: { origin: 'https://staging.ahorroya.app' } }, res);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://staging.ahorroya.app');
    if (previous === undefined) delete process.env.ALLOWED_ORIGINS;
    else process.env.ALLOWED_ORIGINS = previous;
  });

  it('does not reflect unconfigured origins', () => {
    const previous = process.env.ALLOWED_ORIGINS;
    process.env.ALLOWED_ORIGINS = 'https://staging.ahorroya.app';
    const res = mockRes();
    applySecurityHeaders({ headers: { origin: 'https://evil.example' } }, res);
    expect(res.headers['Access-Control-Allow-Origin']).not.toBe('https://evil.example');
    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://staging.ahorroya.app');
    if (previous === undefined) delete process.env.ALLOWED_ORIGINS;
    else process.env.ALLOWED_ORIGINS = previous;
  });
});
