function getSupabaseUrl() {
  return process.env.SUPABASE_URL
    || process.env.NEXT_PUBLIC_SUPABASE_URL
    || process.env.EXPO_PUBLIC_SUPABASE_URL;
}

function getPublishableAnonKey() {
  return process.env.SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = getPublishableAnonKey();

export async function getUserFromAccessToken(accessToken) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !accessToken) {
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
