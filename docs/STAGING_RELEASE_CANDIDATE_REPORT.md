# Staging release candidate report

Completar despues del deploy staging.

## Identificacion

- Branch:
- Branch: `codex/production-deploy-ready`
- Commit: `f086010` + cambios pendientes de patch ESM/docs
- Fecha: 2026-05-03
- Responsable:
- URL staging: `https://codex-xpel3o047-akuma424-projects.vercel.app`
- Supabase project ref:
- Vercel deployment id/url: `https://vercel.com/akuma424-projects/codex/Hr4vhSZvQ9s7omjdpnzrUZJ19m42`

## Validaciones automaticas

- `npm run lint`: OK, `basic lint passed`.
- `npm run typecheck`: OK, `syntax check passed (134 files)`.
- `npm test`: OK, 20 files / 59 tests.
- `npm run build`: OK, Expo export web completo.
- `npm run production:check`: OK, `mode=demo_or_partial`.
- `npm run staging:check`: FAIL esperado, `mode=demo_or_partial`.
- `npm run test:e2e`:

## Resultado `production:check`

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
dangerously_exposed=none
risks=ALLOWED_ORIGINS should include explicit HTTPS staging/production origins.
```

Nota: este resultado fue ejecutado localmente. Las variables `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_URL` y `ALLOWED_ORIGINS` ya fueron cargadas en Vercel Preview branch-specific, pero los checks locales no leen automaticamente variables remotas de Vercel.

## Smoke tests

- Resultado general: bloqueado por Vercel Deployment Protection.
- Pruebas fallidas: `curl.exe` publico contra `/api/v1/health` y `/api/v1/readiness` recibio `401 Unauthorized`.
- Evidencia: preview responde pagina `Authentication Required` de Vercel; se requiere acceso autenticado, `vercel curl` o bypass token aprobado.
- Auditoria `vercel curl`: disponible, pero al usarse contra el preview protegido genero automaticamente un Deployment Protection bypass token. No se imprimio el token. Se detuvieron nuevas pruebas hasta aprobacion explicita de Ronald.
- Ronald aprobo `vercel curl` para smoke protegido. Resultado: `/api/v1/health` y `/api/v1/readiness` fueron alcanzados, pero ambos devolvieron `FUNCTION_INVOCATION_FAILED` sin JSON. Request ids: health `gru1::q8kn4-1777786187299-2d5dd399ca25`; readiness `gru1::v78wv-1777786197615-be70c15a5297`.
- Debug posterior: logs Vercel confirmaron `ERR_MODULE_NOT_FOUND` por imports relativos ESM sin `.js`, empezando por `services/catalog-service.js`.
- Patch aplicado: imports relativos ESM actualizados con `.js` en servicios/librerias usadas por API.
- Nuevo preview: `https://codex-xpel3o047-akuma424-projects.vercel.app`.
- Smoke protegido corregido:
  - `/api/v1/health`: JSON OK, `status=ok`, `service=ahorroya-api`.
  - `/api/v1/readiness`: JSON OK, `status=degraded`, `mode=demo_or_partial`.
  - Checks no sensibles: Supabase server/public ready; PayPal demo/missing; Google Auth fallback demo; origins configured; rate limit memory fallback; local fallback enabled; tracking with fallback.

## PayPal sandbox

- Compra mensual:
- Compra anual:
- Webhook:
- `premium_until`:
- Cancelacion/fallo:
- Incidentes:

## Google Auth

- Login:
- Logout:
- Favoritos migrados:
- Alertas migradas:
- Usuario sin rol:
- Usuario admin:
- Incidentes:

## Supabase RLS

- `scripts/sql/verify-production-schema.sql`:
- `scripts/sql/verify-ai-agents-rls.sql`:
- Usuario normal bloqueado:
- Admin permitido:
- Internal job permitido:
- RLS activo:
- Incidentes:

## Panel IA

- Bloqueado con `ENABLE_ADMIN_AI_PANEL=false`:
- Admin dry-run:
- Usuario normal denegado:
- Level 4 bloqueado:
- Incidentes:

## Decision

Elegir una:

- Go staging
- No-Go staging

Decision actual: No-Go staging.

Motivo: el `FUNCTION_INVOCATION_FAILED` fue corregido y health/readiness responden en el preview protegido, pero staging todavia no puede declararse Go porque faltan PayPal sandbox real, Google Auth y validacion Supabase/RLS. `npm run staging:check` sigue fallando correctamente con `mode=demo_or_partial`.

## Proximos pasos

1. Validar Supabase/RLS en staging con usuario normal, admin e internal_job.
2. Cargar variables reales pendientes de PayPal sandbox y Google Auth.
3. Actualizar URL/CORS si se decide usar el preview corregido como staging temporal.
4. Reejecutar `production:check`, `staging:check` y smoke tests.
5. Completar evidencia de PayPal sandbox, Google Auth, RLS y panel IA antes de considerar Go staging.
