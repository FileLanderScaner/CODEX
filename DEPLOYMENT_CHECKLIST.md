# Deployment checklist

- Build command: `npm run build`.
- Output directory: `dist`.
- Target recomendado: Vercel.
- Variables publicas obligatorias para staging: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_URL`, `EXPO_PUBLIC_PAYPAL_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.
- Variables publicas opcionales: `EXPO_PUBLIC_PREMIUM_PRICE`, `EXPO_PUBLIC_PREMIUM_CURRENCY`.
- Variables servidor obligatorias para staging: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_ENV=sandbox`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MONTHLY_PLAN_ID`, `PAYPAL_YEARLY_PLAN_ID`, `ALLOWED_ORIGINS`.
- Variables servidor obligatorias para produccion: todas las de staging, `PAYPAL_ENV=live`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`.
- Variables servidor opcionales: `OPENAI_API_KEY`, `OPENAI_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`, `CRON_SHARED_SECRET`, `AFFILIATE_SIGNING_SECRET`.
- Prohibido en frontend: `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_SECRET`, `GOOGLE_OAUTH_CLIENT_SECRET`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `TWILIO_AUTH_TOKEN`, cualquier `*_SECRET`, `*_TOKEN` privado o service role.
- Flags IA iniciales: `ENABLE_AI_AGENTS=false`, `ENABLE_AGENT_SCHEDULER=false`, `ENABLE_ADMIN_AI_PANEL=false`, `ENABLE_AI_LEVEL4_OVERRIDE=false`, `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY`.
- Antes de produccion: lint, typecheck, tests, build, migraciones Supabase, smoke E2E, PayPal sandbox.
- Staging debe alcanzar `mode=staging_ready` en `npm run production:check`.
- Produccion solo puede avanzar con `docs/PRODUCTION_GO_NO_GO.md` en Go.
