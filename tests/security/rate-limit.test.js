import { describe, expect, it } from 'vitest';
import { rateLimit } from '../../api/_security.js';

describe('rate limiting', () => {
  it('blocks after configured limit', () => {
    const req = { headers: { 'x-forwarded-for': '10.0.0.1' }, socket: {} };
    expect(rateLimit(req, 'security-test', { limit: 1, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(req, 'security-test', { limit: 1, windowMs: 60_000 }).ok).toBe(false);
  });
});
