import { describe, expect, it } from 'vitest';
import { readEnv } from '../../lib/env.js';

describe('env config', () => {
  it('keeps server secrets separate from public config', () => {
    const env = readEnv({
      APP_ENV: 'test',
      APP_URL: 'http://localhost:8081',
      API_BASE_URL: 'http://localhost:3000',
      ALLOWED_ORIGINS: 'http://localhost:8081',
      SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
      FEATURE_FLAGS: '{"premium":true}',
    });

    expect(env.allowedOrigins).toEqual(['http://localhost:8081']);
    expect(env.FEATURE_FLAGS.premium).toBe(true);
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('server-secret');
  });
});
