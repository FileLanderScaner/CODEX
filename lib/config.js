export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
  appUrl: process.env.EXPO_PUBLIC_APP_URL || '',
  paypalClientId: process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || '',
  premiumPrice: process.env.EXPO_PUBLIC_PREMIUM_PRICE || '4.99',
  premiumCurrency: process.env.EXPO_PUBLIC_PREMIUM_CURRENCY || 'USD',
};

export const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);
export const hasPayPalConfig = Boolean(config.apiBaseUrl && config.paypalClientId);
