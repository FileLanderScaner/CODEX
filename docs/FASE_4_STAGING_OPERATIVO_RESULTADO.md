# Fase 4 - Staging operativo resultado

Fecha: 2026-05-02.

## Que se implemento

Se preparo una guia operativa ejecutable para levantar staging real sin activar produccion, sin PayPal live, sin Level 4, sin nuevos agentes y sin secretos versionados.

## Documentos creados

- `docs/STAGING_EXECUTION_PLAN.md`
- `docs/VERCEL_STAGING_ENV_CHECKLIST.md`
- `docs/SUPABASE_STAGING_EXECUTION_CHECKLIST.md`
- `docs/PAYPAL_STAGING_EXECUTION_CHECKLIST.md`
- `docs/GOOGLE_AUTH_STAGING_EXECUTION_CHECKLIST.md`
- `docs/STAGING_MANUAL_SMOKE_TESTS.md`
- `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`
- `docs/FASE_4_STAGING_OPERATIVO_RESULTADO.md`

## Scripts creados

- `scripts/staging-check.mjs`

## Archivos modificados

- `package.json`: agrega `npm run staging:check`.

## Comandos ejecutados

- `npm run lint`: OK, `basic lint passed`.
- `npm run typecheck`: OK, `syntax check passed (134 files)`.
- `npm test`: OK, 20 test files y 59 tests pasaron. Los logs 400/401/403 son tests negativos esperados.
- `npm run build`: OK, Expo export web genero `dist`.
- `npm run production:check`: OK, devuelve `mode=demo_or_partial`.
- `npm run staging:check`: FAIL esperado, porque todavia faltan variables reales y el modo actual es `demo_or_partial`.
- `npm run test:e2e`: OK, 1 test Playwright paso.

## Resultado actual de `production:check`

```text
mode=demo_or_partial
supabase_public=ready
supabase_server=ready
paypal=missing
google_auth=missing
allowed_origins=missing
ai_safe_defaults=missing
missing_public=EXPO_PUBLIC_API_BASE_URL,EXPO_PUBLIC_APP_URL,EXPO_PUBLIC_PAYPAL_CLIENT_ID,EXPO_PUBLIC_GOOGLE_CLIENT_ID
missing_staging=ALLOWED_ORIGINS,PAYPAL_ENV,PAYPAL_CLIENT_ID,PAYPAL_CLIENT_SECRET,PAYPAL_WEBHOOK_ID,PAYPAL_MONTHLY_PLAN_ID,PAYPAL_YEARLY_PLAN_ID
missing_production=ALLOWED_ORIGINS,PAYPAL_ENV,PAYPAL_CLIENT_ID,PAYPAL_CLIENT_SECRET,PAYPAL_WEBHOOK_ID,PAYPAL_MONTHLY_PLAN_ID,PAYPAL_YEARLY_PLAN_ID,GOOGLE_OAUTH_CLIENT_ID,GOOGLE_OAUTH_CLIENT_SECRET
dangerously_exposed=none
risks=ALLOWED_ORIGINS should include explicit HTTPS staging/production origins.
```

## Resultado actual de `staging:check`

```text
mode=demo_or_partial
FAIL Expected mode=staging_ready, got mode=demo_or_partial.
```

Este fallo es correcto y protege contra declarar staging listo sin credenciales reales.

## Estado actual

Local:

- Build OK.
- Tests OK.
- E2E OK.
- Sin secretos reales agregados.

Staging:

- Go condicionado.
- Falta cargar variables reales en Vercel.
- Falta aplicar migraciones Supabase staging.
- Falta validar RLS con usuarios reales.
- Falta PayPal sandbox end-to-end.
- Falta Google Auth end-to-end.
- Falta smoke manual contra deployment preview.
- `staging:check` aun falla correctamente.

Produccion:

- No-Go.
- No se activo PayPal live.
- No se activo Level 4.
- No se cambio `ENABLE_AI_LEVEL4_OVERRIDE=false`.

## Que falta cargar manualmente

En Vercel staging:

- Publicas: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_URL`, `EXPO_PUBLIC_PAYPAL_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_PREMIUM_PRICE`, `EXPO_PUBLIC_PREMIUM_CURRENCY`.
- Servidor: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_ENV=sandbox`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MONTHLY_PLAN_ID`, `PAYPAL_YEARLY_PLAN_ID`, `ALLOWED_ORIGINS`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`.
- IA segura: `AI_PROVIDER=mock`, `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY`, `ENABLE_AI_AGENTS=false`, `ENABLE_AGENT_SCHEDULER=false`, `ENABLE_ADMIN_AI_PANEL=false`, `ENABLE_AI_LEVEL4_OVERRIDE=false`.

En Supabase staging:

- Migraciones aplicadas en orden.
- Google Auth Provider.
- Usuarios normal, admin e internal_job.
- `app_metadata.role` para admin/internal_job.

En PayPal:

- REST app sandbox.
- Plan mensual/anual sandbox.
- Webhook sandbox.

En Google Cloud:

- OAuth client.
- Authorized origins.
- Redirect URLs.

## Que no debe activarse todavia

- `PAYPAL_ENV=live`.
- `ENABLE_AI_LEVEL4_OVERRIDE=true`.
- `AI_AUTONOMY_LEVEL=LEVEL_4_CONTROLLED_EXECUTION`.
- `ENABLE_ADMIN_AI_PANEL=true` sin usuarios y roles reales.
- Produccion Vercel.
- RLS laxo o desactivado.

## Orden exacto para el humano

1. Leer `docs/STAGING_EXECUTION_PLAN.md`.
2. Completar `docs/VERCEL_STAGING_ENV_CHECKLIST.md`.
3. Ejecutar `docs/SUPABASE_STAGING_EXECUTION_CHECKLIST.md`.
4. Ejecutar `docs/PAYPAL_STAGING_EXECUTION_CHECKLIST.md`.
5. Ejecutar `docs/GOOGLE_AUTH_STAGING_EXECUTION_CHECKLIST.md`.
6. Cargar variables en Vercel staging.
7. Deploy preview/staging.
8. Ejecutar `npm run production:check`.
9. Ejecutar `npm run staging:check`; debe pasar con `mode=staging_ready`.
10. Ejecutar `docs/STAGING_MANUAL_SMOKE_TESTS.md`.
11. Completar `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`.
12. Mantener produccion en No-Go hasta resolver `docs/PRODUCTION_GO_NO_GO.md`.

## Go/No-Go actual

- Local: Go.
- Staging: Go condicionado, no listo aun.
- Produccion: No-Go.
