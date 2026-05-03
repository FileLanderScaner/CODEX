# Fase 3 - Auditoria final staging/deploy

Fecha: 2026-05-02.

## Veredicto

- Staging: Go condicionado. El repositorio queda listo para configurar variables reales, aplicar migraciones y ejecutar smoke tests contra preview/staging.
- Produccion: No-Go. Faltan credenciales y validaciones externas de PayPal, Google Auth, Supabase staging/RLS y `ALLOWED_ORIGINS`.
- Seguridad: No se agregaron secretos reales. `SUPABASE_SERVICE_ROLE_KEY` queda documentada como solo servidor. IA, panel IA y Level 4 siguen apagados por defecto.

## Archivos verificados

- `docs/FASE_3_PLAN_STAGING_DEPLOY.md`: existe y contiene estado inicial, riesgos, estrategia y comandos finales.
- `docs/ENVIRONMENT_VARIABLES_MATRIX.md`: existe y separa variables publicas, privadas, staging, produccion, opcionales y exposicion frontend.
- `docs/SUPABASE_STAGING_RUNBOOK.md`: existe y contiene orden de migraciones, RLS, roles `admin`/`internal_job`, smoke queries y rollback.
- `docs/STAGING_ADMIN_AI_PANEL_TEST_PLAN.md`: existe y cubre bloqueo por flag/auth/rol y dry-run admin.
- `docs/PAYPAL_SANDBOX_RUNBOOK.md`: existe y cubre variables sandbox, webhook, `premium_until` y prohibicion de live prematuro.
- `docs/GOOGLE_AUTH_RUNBOOK.md`: existe y cubre Google Cloud, Supabase Auth Provider, redirects local/staging/produccion y validacion.
- `docs/CORS_AND_ORIGINS.md`: existe y documenta formato de `ALLOWED_ORIGINS`, ejemplos y pruebas.
- `docs/STAGING_DEPLOY_CHECKLIST.md`: existe y divide tareas de deploy, Supabase, PayPal, Google, smoke tests y Go/No-Go.
- `docs/PRODUCTION_GO_NO_GO.md`: existe y mantiene produccion en No-Go.
- `docs/FASE_3_RESULTADO_STAGING_DEPLOY.md`: existe y registra implementacion y validaciones.
- `.env.example`: verificado y alineado; contiene placeholders, no secretos reales.
- `README_PRODUCTION.md`: verificado para variables y runbooks.
- `DEPLOYMENT_CHECKLIST.md`: actualizado con variables publicas/privadas, staging/produccion, opcionales y prohibiciones frontend.
- `docs/PRODUCTION_READINESS.md`: actualizado con matriz resumida de variables y flags seguros.
- `App.js`: verificado; usa tracking real minimo y fallback `.catch(() => null)`.
- `server/api/v1/_utils.js`: verificado; CORS usa `ALLOWED_ORIGINS`.
- `scripts/validate-production-env.mjs`: verificado; distingue `demo_or_partial`, `staging_ready`, `production_ready`.
- `scripts/sql/verify-ai-agents-rls.sql`: existe.
- `scripts/sql/verify-production-schema.sql`: existe.

## Archivos creados en esta auditoria

- `docs/FASE_3_AUDITORIA_FINAL.md`
- `tests/unit/tracking-service.test.js`

## Archivos modificados en esta auditoria

- `.env.example`: se agrego `EXPO_PUBLIC_GOOGLE_CLIENT_ID` al bloque publico principal y se eliminaron duplicados de `CRON_SHARED_SECRET`/`AFFILIATE_SIGNING_SECRET`.
- `DEPLOYMENT_CHECKLIST.md`: se completo la separacion de variables publicas, privadas, staging, produccion, opcionales y prohibidas en frontend.
- `docs/PRODUCTION_READINESS.md`: se agrego resumen explicito de variables y secretos prohibidos.
- `services/premium-service.js`: se corrigio mojibake en comentarios y textos visibles sin cambiar la logica de pago/premium.
- `tests/integration/cors.test.js`: se agrego caso para confirmar que no refleja origins no configurados.

## Tracking minimo

`App.js` ya no queda como placeholder de analytics. Envia:

- `app_loaded`
- `web_session_started`
- `client_error`

El tracking usa `services/tracking-service.js`, no registra datos personales y usa fallback local si el backend falla. Se agrego test unitario para confirmar que esos eventos se envian al endpoint de tracking y que eventos desconocidos se descartan.

## Production check

`npm run production:check` valida:

- Supabase publico.
- Supabase servidor.
- PayPal.
- Google Auth.
- `ALLOWED_ORIGINS`.
- Secretos expuestos en variables publicas.
- Flags IA inseguros.
- `ENABLE_AI_LEVEL4_OVERRIDE`.
- `SUPABASE_SERVICE_ROLE_KEY` expuesta como variable publica.

Resultado actual:

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

El modo strict falla correctamente:

```text
FAIL strict production readiness requires production_ready mode
```

## Comandos ejecutados

- `npm run lint`: OK, `basic lint passed`.
- `npm run typecheck`: OK, `syntax check passed (134 files)`.
- `npm test`: OK, 20 test files y 59 tests pasaron. Los logs 400/401/403 son tests negativos esperados.
- `npm run build`: OK, Expo export web genero `dist`.
- `npm run production:check`: OK en `demo_or_partial`.
- `npm run production:check -- --strict`: FAIL esperado por credenciales/config externa faltante.
- `npm run test:e2e`: primer intento FAIL transitorio por arranque/fetch del servidor de Playwright; segundo intento OK, 1 test paso.
- Chequeo mojibake en `README_PRODUCTION.md`, `README.md`, `App.js`, `screens` y `services`: OK sin ocurrencias de `Ã`, `Â` o `�`.

## Estado de staging

Staging puede avanzar cuando se carguen variables reales en Vercel preview/staging y se apliquen migraciones en Supabase staging. El estado requerido es `mode=staging_ready`, no `production_ready`.

Pendiente para staging:

- Configurar variables publicas reales.
- Configurar variables servidor reales de Supabase, PayPal sandbox y `ALLOWED_ORIGINS`.
- Aplicar migraciones Supabase en staging.
- Ejecutar `scripts/sql/verify-production-schema.sql`.
- Ejecutar `scripts/sql/verify-ai-agents-rls.sql`.
- Validar usuarios reales con `app_metadata.role = "admin"` e `app_metadata.role = "internal_job"`.
- Probar panel IA con admin real.
- Ejecutar smoke tests contra deployment preview.

## Estado de produccion

Produccion queda No-Go.

Motivos:

- Falta PayPal live validado.
- Falta Google OAuth production configurado.
- Falta `ALLOWED_ORIGINS` productivo.
- Falta validar Supabase/RLS en staging antes de promover.
- Falta smoke test contra deployment real.
- `production:check -- --strict` falla correctamente.

## Riesgos pendientes

- Configurar `ALLOWED_ORIGINS` demasiado amplio o con dominio incorrecto.
- Copiar `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_SECRET` o secretos OAuth a variables publicas.
- Activar `PAYPAL_ENV=live` antes de sandbox end-to-end.
- Activar `ENABLE_ADMIN_AI_PANEL` sin rol admin real.
- Activar `ENABLE_AI_AGENTS` fuera de dry-run o con nivel superior al aprobado.
- Intentar arreglar RLS bajando politicas en vez de usar `app_metadata.role`.

## Variables faltantes actuales

Publicas:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_APP_URL`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

Staging servidor:

- `ALLOWED_ORIGINS`
- `PAYPAL_ENV`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_MONTHLY_PLAN_ID`
- `PAYPAL_YEARLY_PLAN_ID`

Produccion servidor:

- Todas las de staging.
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

## Go/No-Go

| Area | Decision |
|---|---|
| Build local | Go |
| Tests local | Go |
| E2E local | Go tras reintento |
| Secretos | Go, no hay secretos reales versionados |
| IA | Go seguro, apagada por defecto |
| Panel IA | Go seguro, apagado por defecto |
| Level 4 | Go seguro, bloqueado |
| Staging | Go condicionado a variables/migraciones reales |
| Produccion | No-Go |

## Proximos pasos exactos

1. Crear proyecto Supabase staging o confirmar el existente.
2. Aplicar migraciones en el orden documentado en `docs/SUPABASE_STAGING_RUNBOOK.md`.
3. Crear usuarios staging `admin`, `internal_job` y usuario normal.
4. Ejecutar los scripts SQL de verificacion.
5. Configurar variables reales en Vercel preview/staging.
6. Configurar PayPal sandbox app, planes y webhook.
7. Configurar Google OAuth en Google Cloud y Supabase Auth Provider.
8. Definir `ALLOWED_ORIGINS` con dominio staging HTTPS exacto.
9. Ejecutar `npm run production:check` hasta obtener `staging_ready`.
10. Deploy preview en Vercel y smoke tests completos.
11. Solo despues evaluar produccion con `docs/PRODUCTION_GO_NO_GO.md`.
