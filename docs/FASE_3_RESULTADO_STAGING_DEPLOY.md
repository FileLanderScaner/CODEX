# Fase 3 - Resultado staging deploy

## Implementado

- Validador de entorno `scripts/validate-production-env.mjs`.
- `npm run production:check` ahora reporta `demo_or_partial`, `staging_ready` o `production_ready`.
- Tests del validador y CORS.
- Observabilidad minima real en `App.js`: `app_loaded`, `web_session_started`, `client_error`.
- Runbooks de Supabase staging, PayPal sandbox, Google Auth, CORS y panel admin IA.
- Checklists de staging deploy y Go/No-Go produccion.
- Scripts SQL de verificacion de schema y RLS.

## Archivos creados

- `docs/FASE_3_PLAN_STAGING_DEPLOY.md`
- `docs/ENVIRONMENT_VARIABLES_MATRIX.md`
- `docs/SUPABASE_STAGING_RUNBOOK.md`
- `docs/STAGING_ADMIN_AI_PANEL_TEST_PLAN.md`
- `docs/PAYPAL_SANDBOX_RUNBOOK.md`
- `docs/GOOGLE_AUTH_RUNBOOK.md`
- `docs/CORS_AND_ORIGINS.md`
- `docs/STAGING_DEPLOY_CHECKLIST.md`
- `docs/PRODUCTION_GO_NO_GO.md`
- `scripts/validate-production-env.mjs`
- `scripts/sql/verify-ai-agents-rls.sql`
- `scripts/sql/verify-production-schema.sql`
- `tests/unit/validate-production-env.test.js`
- `tests/integration/cors.test.js`

## Estado actual

- Supabase: listo para staging por runbook; migraciones no aplicadas desde esta sesion.
- Vercel: listo para variables reales; no se deployo desde esta sesion.
- PayPal: sandbox documentado; live no activado.
- Google Auth: documentado; faltan credenciales/redirects reales.
- CORS: documentado y testeado localmente.
- Observabilidad: eventos minimos conectados al tracking existente.
- Panel IA: sigue apagado por defecto y listo para prueba staging con admin real.
- Agentes IA: siguen apagados por defecto y en dry-run.

## Validaciones

- `npm run lint`: OK, `basic lint passed`.
- `npm run typecheck`: OK, `syntax check passed (133 files)`.
- `npm test`: OK, 19 test files y 56 tests pasaron. La salida incluye errores esperados de tests negativos de API/auth.
- `npm run build`: OK, Expo export web generado en `dist`.
- `npm run production:check`: OK en modo `demo_or_partial`.
- `npm run production:check -- --strict`: FAIL esperado porque faltan credenciales reales y configuracion externa; no se declara produccion lista.
- `npm run test:e2e`: OK, 1 test Playwright paso.
- Mojibake check en `README_PRODUCTION.md`, `README.md`, `App.js`, `screens` y `services`: OK sin ocurrencias de `Ã`, `Â` o `�` usando fallback PowerShell. `rg` no pudo ejecutarse por `Acceso denegado` en este entorno.

Resultado exacto de `production:check`:

- `mode=demo_or_partial`
- `supabase_public=ready`
- `supabase_server=ready`
- `paypal=missing`
- `google_auth=missing`
- `allowed_origins=missing`
- `ai_safe_defaults=missing`
- `missing_public=EXPO_PUBLIC_API_BASE_URL,EXPO_PUBLIC_APP_URL,EXPO_PUBLIC_PAYPAL_CLIENT_ID,EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `missing_staging=ALLOWED_ORIGINS,PAYPAL_ENV,PAYPAL_CLIENT_ID,PAYPAL_CLIENT_SECRET,PAYPAL_WEBHOOK_ID,PAYPAL_MONTHLY_PLAN_ID,PAYPAL_YEARLY_PLAN_ID`
- `missing_production=ALLOWED_ORIGINS,PAYPAL_ENV,PAYPAL_CLIENT_ID,PAYPAL_CLIENT_SECRET,PAYPAL_WEBHOOK_ID,PAYPAL_MONTHLY_PLAN_ID,PAYPAL_YEARLY_PLAN_ID,GOOGLE_OAUTH_CLIENT_ID,GOOGLE_OAUTH_CLIENT_SECRET`
- `dangerously_exposed=none`
- `risks=ALLOWED_ORIGINS should include explicit HTTPS staging/production origins.`

El modo estricto fallo correctamente con:

```text
FAIL strict production readiness requires production_ready mode
```

Esto confirma que el proyecto no queda marcado como production-ready sin variables reales.

## Pendientes externos

- Configurar variables reales de Vercel preview/staging.
- Aplicar migraciones Supabase en staging.
- Validar RLS con usuarios reales `admin` e `internal_job`.
- Configurar PayPal sandbox y webhook.
- Configurar Google Auth con redirects reales.
- Definir `ALLOWED_ORIGINS` con dominios HTTPS de staging/produccion.
- Ejecutar smoke tests contra deployment preview.

## Go/No-Go

Go para staging controlado cuando Vercel/Supabase/PayPal/Google tengan variables reales.

No-Go para produccion real hasta que `docs/PRODUCTION_GO_NO_GO.md` este todo en Go.
