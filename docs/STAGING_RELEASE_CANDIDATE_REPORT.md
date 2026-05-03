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

- Supabase CLI: no disponible en este entorno (`supabase` no reconocido).
- Ruta recomendada: Supabase Dashboard / SQL Editor sobre proyecto staging confirmado por Ronald.
- Plan operativo: `docs/SUPABASE_STAGING_APPLY_PLAN.md`.
- Paquete SQL Editor agentes: `docs/SUPABASE_AGENT_MIGRATION_SQL_EDITOR_PACKAGE.md`.
- Proyecto staging confirmado: `supabase-aquamarine-battery`.
- Project ref staging confirmado: `wzwjjjajmyfwvspxysjb`.
- Migración agent IA aplicada: sí (2026-05-03).
- Tablas agent_* creadas: sí.
- public.agent_authorized_role(): sí.
- RLS en agent_*: true.
- Policies admin_internal_agent_*: 6/6.
- Policies públicas/no esperadas agent_*: 0.
- Policies usan: `for all to authenticated`.
- Autorización usa: `auth.jwt() -> 'app_metadata' ->> 'role'`.
- Roles permitidos: admin, internal_job.
- No usa user_metadata/raw_user_meta_data.
- Producción no tocada.
- Secrets no expuestos.
- Usuario normal bloqueado: pendiente (validación con usuarios reales).
- Admin permitido: pendiente (validación con usuarios reales).
- Internal job permitido: pendiente (validación con usuarios reales).
- RLS activo: sí.
- Incidentes: ninguno.

## Runbook operativo

Validar RLS real con usuarios autenticados siguiendo `docs/SUPABASE_AGENT_RLS_USER_VALIDATION_RUNBOOK.md`.

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

Motivo: la migración de agentes IA fue aplicada correctamente en Supabase staging, pero staging sigue No-Go hasta validar RLS con usuarios reales, PayPal sandbox real y Google Auth. `npm run staging:check` sigue fallando correctamente con `mode=demo_or_partial`. Validar RLS real con el runbook `docs/SUPABASE_AGENT_RLS_USER_VALIDATION_RUNBOOK.md`.

## Proximos pasos

1. Confirmar proyecto Supabase staging y aplicar `docs/SUPABASE_STAGING_APPLY_PLAN.md`.
2. Validar Supabase/RLS en staging con usuario normal, admin e internal_job.
3. Cargar variables reales pendientes de PayPal sandbox y Google Auth.
4. Actualizar URL/CORS si se decide usar el preview corregido como staging temporal.
5. Reejecutar `production:check`, `staging:check` y smoke tests.
6. Completar evidencia de PayPal sandbox, Google Auth, RLS y panel IA antes de considerar Go staging.
