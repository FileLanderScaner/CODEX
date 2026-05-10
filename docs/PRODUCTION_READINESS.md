# Production readiness

Estado actual: `PRODUCTION_STATUS=NO-GO_PRODUCTION`.

Staging esta sano y revisable: rama subida, Vercel Preview `Ready`, RLS PASS con Session Pooler, AI Gateway apagado, agentes IA apagados, PayPal sandbox y produccion intacta.

Produccion queda bloqueada por politica de release hasta completar el checklist manual de `docs/PRODUCTION_GO_NO_GO.md`.

Modo esperado antes de credenciales reales: `demo_or_partial`.
Modo requerido para staging: `staging_ready`.
Modo requerido para produccion: `production_ready`.

Comandos prohibidos hasta aprobacion humana explicita:

- `npx vercel --prod`
- `npx vercel deploy --prod`
- `npx vercel promote`
- modificar Vercel Production env
- aplicar migraciones Supabase production
- activar PayPal live
- activar AI Gateway
- activar agentes IA

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
- Mantener `PRODUCTION_STATUS=NO-GO_PRODUCTION` hasta completar: Supabase Auth leaked password protection, backup SQL, revert plan, Vercel Production env real, PayPal live, Google OAuth production, ventana de deploy/responsables y aprobacion humana explicita.
- Resolver los runbooks manuales antes de cualquier production action: `docs/security/supabase-auth-production-gate.md`, `docs/deployment/production-backup-sql-plan.md` y `docs/deployment/production-revert-sql-plan.md`.
- Ver `docs/ENVIRONMENT_VARIABLES_MATRIX.md`, `docs/STAGING_DEPLOY_CHECKLIST.md` y `docs/PRODUCTION_GO_NO_GO.md`.
