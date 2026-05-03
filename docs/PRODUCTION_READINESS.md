# Production readiness

Estado actual: build/test local verde tras la implementacion, pendiente aplicar migraciones y variables reales.

Modo esperado antes de credenciales reales: `demo_or_partial`.
Modo requerido para staging: `staging_ready`.
Modo requerido para produccion: `production_ready`.

Checklist:

- Variables publicas staging: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_URL`, `EXPO_PUBLIC_PAYPAL_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.
- Variables privadas staging: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_ENV=sandbox`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MONTHLY_PLAN_ID`, `PAYPAL_YEARLY_PLAN_ID`, `ALLOWED_ORIGINS`.
- Variables privadas produccion: todas las de staging, `PAYPAL_ENV=live`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`.
- Variables opcionales: `OPENAI_API_KEY`, `OPENAI_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`, `CRON_SHARED_SECRET`, `AFFILIATE_SIGNING_SECRET`.
- Nunca exponer en frontend: `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_SECRET`, `GOOGLE_OAUTH_CLIENT_SECRET`, API keys privadas, tokens privados ni service role.
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Aplicar migraciones Supabase.
- Configurar variables Vercel.
- Validar PayPal sandbox antes de live.
- Activar `ALLOWED_ORIGINS` solo con dominios reales.
- Configurar `CRON_SHARED_SECRET`.
- Mantener `ENABLE_ADMIN_AI_PANEL=false` hasta tener rol admin real.
- Para staging controlado, activar `ENABLE_ADMIN_AI_PANEL=true` y `ENABLE_AI_AGENTS=true` con `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY`.
- Mantener `ENABLE_AI_LEVEL4_OVERRIDE=false` salvo revision explicita fuera de produccion.
- Ver `docs/SUPABASE_AI_AGENTS_SETUP.md` antes de aplicar la migracion de memoria.
- Ejecutar Playwright E2E contra deploy preview.
- Ejecutar `npm run production:check -- --strict` solo cuando las variables productivas reales esten cargadas.
- Ver `docs/ENVIRONMENT_VARIABLES_MATRIX.md`, `docs/STAGING_DEPLOY_CHECKLIST.md` y `docs/PRODUCTION_GO_NO_GO.md`.
