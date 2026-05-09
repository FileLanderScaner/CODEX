import { afterEach, describe, expect, it, vi } from 'vitest';

describe('supabase auth env aliases', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('uses server/public anon key aliases for token introspection', async () => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://staging-ref.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'next-anon-key',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
      SUPABASE_ANON_KEY: '',
    };
    const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ id: 'user-1' }), { status: 200 })));
    vi.stubGlobal('fetch', fetchMock);

    const { getUserFromAccessToken } = await import('../../server/api/supabase/_auth.js');
    await expect(getUserFromAccessToken('access-token')).resolves.toEqual({ id: 'user-1' });

    expect(fetchMock).toHaveBeenCalledWith('https://staging-ref.supabase.co/auth/v1/user', expect.objectContaining({
      headers: expect.objectContaining({
        apikey: 'next-anon-key',
        Authorization: 'Bearer access-token',
      }),
    }));
  });
});
