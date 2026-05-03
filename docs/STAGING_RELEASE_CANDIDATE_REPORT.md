# Staging release candidate report

Completar despues del deploy staging.

## Identificacion

- Branch:
- Branch: `codex/production-deploy-ready`
- Commit: `022939d`
- Fecha: 2026-05-03
- Responsable:
- URL staging: `https://codex-75aq3h1gx-akuma424-projects.vercel.app`
- Supabase project ref:
- Vercel deployment id/url: `https://vercel.com/akuma424-projects/codex/EffrTRcPgV6Zoh3uL4QMjDhus4Ri`

## Validaciones automaticas

- `npm run lint`: OK, `basic lint passed`.
- `npm run typecheck`: OK, `syntax check passed (134 files)`.
- `npm test`: OK, 20 files / 59 tests.
- `npm run build`: OK, Expo export web completo.
- `npm run production:check`:
- `npm run staging:check`:
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

Motivo: nuevo preview fue creado despues de cargar URL/CORS, pero smoke HTTP publico no alcanza la API por Deployment Protection. Ademas faltan PayPal sandbox real, Google Auth y validacion Supabase/RLS.

## Proximos pasos

1. Definir metodo aprobado para smoke protegido: sesion Vercel, `vercel curl` o bypass token.
2. Cargar variables reales pendientes de PayPal sandbox y Google Auth.
3. Validar Supabase/RLS en staging.
4. Reejecutar `production:check`, `staging:check` y smoke tests.
