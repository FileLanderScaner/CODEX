import { enforceOrigin, getBearerToken, handleOptions, rateLimit, setCors } from './_security.js';
import { getUserFromAccessToken } from './supabase/_auth.js';
import { ALLOWED_ORIGINS, supabaseRest } from './supabase/_utils.js';

function isPremiumFromProfile(profile) {
  if (!profile) {
    return false;
  }

  const plan = String(profile.plan || profile.tier || 'free').toLowerCase();
  if (plan !== 'premium') {
    return false;
  }

  const until = profile.premium_until ? new Date(profile.premium_until) : null;
  if (!until || Number.isNaN(until.getTime())) {
    // If we have plan=premium but no date, treat as premium for backwards compatibility.
    return true;
  }

  return until.getTime() > Date.now();
}

export default async function handler(req, res) {
  if (handleOptions(req, res, ALLOWED_ORIGINS)) {
    return;
  }

  setCors(res, ALLOWED_ORIGINS);

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const originCheck = enforceOrigin(req, ALLOWED_ORIGINS);
  if (!originCheck.ok) {
    res.status(403).json({ error: originCheck.error });
    return;
  }

  const limit = rateLimit(req, 'me', { limit: 120, windowMs: 60_000 });
  if (!limit.ok) {
    res.status(429).json({ error: 'Rate limit exceeded' });
    return;
  }

  try {
    const accessToken = getBearerToken(req);
    const user = await getUserFromAccessToken(accessToken);
    if (!user?.id) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const rows = await supabaseRest(`profiles?select=*&id=eq.${encodeURIComponent(user.id)}&limit=1`, {
      method: 'GET',
    });
    let profile = rows?.[0] || null;

    if (!profile) {
      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        'Usuario';

      const inserted = await supabaseRest('profiles', {
        method: 'POST',
        body: JSON.stringify({
          id: user.id,
          email: user.email || null,
          display_name: displayName,
          provider: user.app_metadata?.provider || null,
          plan: 'free',
        }),
      });

      profile = inserted?.[0] || null;
    }

    const premium = {
      isPremium: isPremiumFromProfile(profile),
      plan: profile?.plan || 'free',
      premiumUntil: profile?.premium_until || null,
    };

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email || null,
      },
      profile,
      premium,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Could not load profile' });
  }
}

