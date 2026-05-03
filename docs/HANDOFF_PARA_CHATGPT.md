# Handoff para ChatGPT - AhorroYA

## Resumen ejecutivo

Se completaron las fases de autonomia IA, persistencia/control de agentes, auditoria de staging/deploy y preparacion operativa para STAGING REAL de AhorroYA.

El problema que se resolvia era pasar de una arquitectura local/documentada a un proyecto con guardrails reales: endpoint IA protegido, memoria Supabase preparada, panel admin bloqueado por defecto, runbooks de staging, checklist de variables, validadores de entorno y smoke tests.

Quedo mejor que antes porque ahora:

- La app compila y pasa tests locales.
- `production:check` distingue `demo_or_partial`, `staging_ready` y `production_ready`.
- `staging:check` existe y falla si staging no esta realmente listo.
- Hay checklists quirurgicos para Vercel, Supabase, PayPal sandbox, Google Auth, CORS y smoke manual.
- La produccion sigue bloqueada correctamente.

Sigue pendiente cargar credenciales reales, aplicar migraciones en Supabase staging, validar RLS con usuarios reales, configurar PayPal sandbox, configurar Google Auth y ejecutar smoke tests contra un deployment preview/staging.

Actualizacion 2026-05-03: se revisaron `docs/HANDOFF_PARA_CHATGPT.md` y los checklists operativos de staging. La secuencia recomendada sigue siendo Supabase staging primero, luego Vercel con variables base, Google Auth, PayPal sandbox, `ALLOWED_ORIGINS`, deploy preview, `production:check`, `staging:check`, smoke tests y release candidate report. No se activaron produccion, PayPal live, panel IA, agentes IA ni Level 4.

Actualizacion 2026-05-03 Vercel env audit: con Vercel CLI autenticado y proyecto `codex` linkeado, se auditaron solo nombres de variables con `vercel env ls <environment> --format json` redirigido a archivos temporales. No se imprimieron valores, no se uso `vercel env pull`, no se modificaron variables, no se hizo deploy y los temporales se eliminaron. Preview, production y development contienen solo variables Supabase/Postgres actuales: `SUPABASE_SECRET_KEY`, `POSTGRES_URL_NON_POOLING`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `POSTGRES_DATABASE`, `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_PASSWORD`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL`, `POSTGRES_USER`, `SUPABASE_JWT_SECRET`, `POSTGRES_HOST`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY`. Faltan variables staging requeridas para AhorroYA: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_URL`, `EXPO_PUBLIC_PAYPAL_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `PAYPAL_ENV`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MONTHLY_PLAN_ID`, `PAYPAL_YEARLY_PLAN_ID`, `ALLOWED_ORIGINS`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `AI_PROVIDER`, `AI_AUTONOMY_LEVEL`, `ENABLE_AI_AGENTS`, `ENABLE_AGENT_SCHEDULER`, `ENABLE_ADMIN_AI_PANEL`, `ENABLE_AI_LEVEL4_OVERRIDE`.

Actualizacion 2026-05-03 Vercel safe flags: se agregaron variables no secretas y flags seguros solo en `development`: `AI_PROVIDER`, `AI_AUTONOMY_LEVEL`, `ENABLE_AI_AGENTS`, `ENABLE_AGENT_SCHEDULER`, `ENABLE_ADMIN_AI_PANEL`, `ENABLE_AI_LEVEL4_OVERRIDE`, `PAYPAL_ENV`, `EXPO_PUBLIC_PREMIUM_PRICE`, `EXPO_PUBLIC_PREMIUM_CURRENCY`. No se tocaron secretos, Supabase/Postgres ni production. Al intentar `preview`, Vercel CLI pidio decidir Git branch (`git_branch_required`), por lo que se detuvo la accion segun regla de confirmacion humana. Ver `docs/VERCEL_AUTONOMY_AUDIT.md`.

Actualizacion 2026-05-03 Preview branch-specific: Ronald aprobo cargar las variables seguras en Preview exclusivamente para la rama `codex/production-deploy-ready`. Se agregaron `AI_PROVIDER`, `AI_AUTONOMY_LEVEL`, `ENABLE_AI_AGENTS`, `ENABLE_AGENT_SCHEDULER`, `ENABLE_ADMIN_AI_PANEL`, `ENABLE_AI_LEVEL4_OVERRIDE`, `PAYPAL_ENV`, `EXPO_PUBLIC_PREMIUM_PRICE`, `EXPO_PUBLIC_PREMIUM_CURRENCY`. No se toco production, no se hizo deploy, no se cargaron secretos y no se modificaron variables Supabase/Postgres existentes. La auditoria segura de nombres confirma presencia en Preview. Staging sigue No-Go porque faltan URLs reales, PayPal sandbox real, Google Auth y `ALLOWED_ORIGINS`.

Actualizacion 2026-05-03 Preview deploy: se ejecuto `vercel deploy --yes --no-color --non-interactive` sin `--prod`. Preview creado en `https://codex-2bidx8wly-akuma424-projects.vercel.app`; inspect en `https://vercel.com/akuma424-projects/codex/5kShtPEdGzyVurNy37rvMtLve2QJ`. No se tocaron variables remotas, no se imprimieron secretos y production no fue tocado. Smoke con `curl.exe` a `/api/v1/health` y `/api/v1/readiness` devolvio `401 Unauthorized` por Vercel Deployment Protection. La API no fue alcanzada publicamente; se requiere validar con acceso autenticado, `vercel curl` o bypass token aprobado. Staging sigue No-Go.

Actualizacion 2026-05-03 Preview URL/CORS env: se cargaron en Vercel Preview branch-specific `codex/production-deploy-ready` las variables no secretas `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_URL` y `ALLOWED_ORIGINS` usando stdin/pipe de Vercel CLI. No se toco production, no se hizo deploy y no se cargaron secretos. La auditoria segura de nombres confirma presencia en Preview branch-specific. Los checks locales siguen en `demo_or_partial` porque no leen automaticamente las variables remotas; se requiere nuevo deploy preview para que estas env vars apliquen al deployment.

Actualizacion 2026-05-03 Preview redeploy: se ejecuto un nuevo `vercel deploy --yes --no-color --non-interactive` sin `--prod` para aplicar las variables Preview branch-specific. Nueva URL: `https://codex-75aq3h1gx-akuma424-projects.vercel.app`; inspect: `https://vercel.com/akuma424-projects/codex/EffrTRcPgV6Zoh3uL4QMjDhus4Ri`. Build remoto OK. Smoke publico `/api/v1/health` y `/api/v1/readiness` sigue devolviendo `401 Unauthorized` por Vercel Deployment Protection. No se desactivo proteccion, no se tocaron variables remotas, no se cargaron secretos y production no fue tocado. Staging sigue No-Go hasta validar acceso protegido, PayPal sandbox, Google Auth y Supabase/RLS.

Actualizacion 2026-05-03 Vercel protected access: se verifico que `vercel curl` existe. Al probar `vercel curl /api/v1/health --deployment <preview>` y `vercel curl /api/v1/readiness --deployment <preview>`, la CLI informo que el deployment requiere bypass y genero automaticamente un Deployment Protection bypass token para el proyecto. No se imprimio el token, no se desactivo proteccion, no se modificaron variables, no se hizo deploy y production no fue tocado. Se detuvieron nuevas pruebas porque continuar con bypass automatico requiere aprobacion explicita de Ronald. Health/readiness no quedan concluyentemente validados con cuerpo JSON visible.

Actualizacion 2026-05-03 protected smoke aprobado: Ronald aprobo usar `vercel curl` contra `https://codex-75aq3h1gx-akuma424-projects.vercel.app` solo para `/api/v1/health` y `/api/v1/readiness`. Ambos endpoints fueron alcanzados via `vercel curl`, pero devolvieron respuesta no JSON con `FUNCTION_INVOCATION_FAILED`. Request ids: health `gru1::q8kn4-1777786187299-2d5dd399ca25`; readiness `gru1::v78wv-1777786197615-be70c15a5297`. No se imprimio token, no se guardo token, no se desactivo Deployment Protection, no se toco production, no se modificaron variables y no se hizo deploy. Staging sigue No-Go.

Actualizacion 2026-05-03 debug Vercel Function: se revisaron logs Vercel del preview protegido y la causa confirmada fue `ERR_MODULE_NOT_FOUND`: Node ESM en Vercel no podia resolver imports relativos sin extension, empezando por `services/catalog-service.js` importando `../lib/config`. Como `api/[...path].js` carga el router completo, ese import rompia tambien `/api/v1/health` y `/api/v1/readiness`. Se aplico patch minimo agregando `.js` a imports relativos en `services/*.js`, `lib/runtime-mode.js` y `lib/supabase.js`. Validaciones locales posteriores: `npm run lint` OK, `npm run typecheck` OK, `npm test` OK, `npm run build` OK. Se genero nuevo preview sin `--prod`: `https://codex-xpel3o047-akuma424-projects.vercel.app`; inspect: `https://vercel.com/akuma424-projects/codex/Hr4vhSZvQ9s7omjdpnzrUZJ19m42`. Smoke protegido con `vercel curl` ahora devuelve JSON en ambos endpoints: `/api/v1/health` status app `ok`; `/api/v1/readiness` status app `degraded`, `mode=demo_or_partial`, con Supabase ready, PayPal demo/missing, Google Auth fallback demo, origins configurados, rate limit memory fallback, local fallback enabled y tracking con fallback. Production no fue tocado, no se modificaron variables remotas y no se imprimieron secretos.

Actualizacion 2026-05-03 Supabase staging plan: se verifico que Supabase CLI no esta disponible en este entorno (`supabase` no reconocido). No se aplicaron migraciones, no se linkeo proyecto y no se tocaron variables remotas. Se revisaron esquemas/migraciones y se creo `docs/SUPABASE_STAGING_APPLY_PLAN.md`. Hallazgo clave: `202605010001_unicorn_growth_monetization.sql` usa `current_app_role()`, pero esa funcion no se crea en `supabase-production-schema.sql` ni `supabase-price-schema.sql`; existe en migraciones previas y debe estar presente antes de aplicar growth/monetizacion. El plan incluye preflight, helper seguro basado solo en `app_metadata.role`, orden de migraciones, verificacion RLS, creacion de usuarios normal/admin/internal_job y rollback seguro. Supabase staging sigue No-Go hasta ejecutar migraciones y validar RLS con usuarios reales.

Actualizacion 2026-05-03 Supabase agent migration aplicada: Ronald aplico la migracion de agentes IA en Supabase staging `supabase-aquamarine-battery` (project ref `wzwjjjajmyfwvspxysjb`) via SQL Editor. Evidencia: tablas agent_* creadas OK, public.agent_authorized_role() OK, RLS activo OK, policies admin_internal_agent_* 6/6 OK, policies publicas/no esperadas 0, policies usan `for all to authenticated`, autorizacion usa `auth.jwt() -> 'app_metadata' ->> 'role'`, roles permitidos admin/internal_job, no usa user_metadata/raw_user_meta_data, produccion no tocada, secrets no expuestos. Staging sigue No-Go hasta validar RLS con usuarios reales, PayPal sandbox y Google Auth.

## Cambios realizados

### Estado tecnico

- Rama actual: `codex/production-deploy-ready`.
- Commit: no se creo commit en esta sesion; hay cambios pendientes en working tree.
- Archivos eliminados: ninguno confirmado como eliminacion intencional.
- Migraciones nuevas: `supabase/migrations/202605020001_ai_agents_memory.sql`.
- Scripts nuevos:
  - `scripts/validate-production-env.mjs`
  - `scripts/staging-check.mjs`
  - `scripts/sql/verify-ai-agents-rls.sql`
  - `scripts/sql/verify-production-schema.sql`

### Archivos creados principales

- `docs/HANDOFF_PARA_CHATGPT.md`
- `docs/STAGING_EXECUTION_PLAN.md`
- `docs/VERCEL_STAGING_ENV_CHECKLIST.md`
- `docs/SUPABASE_STAGING_EXECUTION_CHECKLIST.md`
- `docs/PAYPAL_STAGING_EXECUTION_CHECKLIST.md`
- `docs/GOOGLE_AUTH_STAGING_EXECUTION_CHECKLIST.md`
- `docs/STAGING_MANUAL_SMOKE_TESTS.md`
- `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`
- `docs/SUPABASE_STAGING_APPLY_PLAN.md`
- `docs/SUPABASE_AGENT_MIGRATION_SQL_EDITOR_PACKAGE.md`
- `docs/FASE_4_STAGING_OPERATIVO_RESULTADO.md`
- `docs/FASE_3_AUDITORIA_FINAL.md`
- `docs/FASE_3_RESULTADO_STAGING_DEPLOY.md`
- `docs/FASE_2_RESULTADO.md`
- `docs/SUPABASE_AI_AGENTS_SETUP.md`
- `docs/ADMIN_AI_PANEL_USAGE.md`
- `docs/AI_AGENTS_ENDPOINTS.md`
- `docs/PRODUCTION_READINESS.md`
- `docs/PRODUCTION_GO_NO_GO.md`
- `DEPLOYMENT_CHECKLIST.md`
- `lib/ai-agents/*`
- `server/api/v1/ai-agents.js`
- `screens/AdminAIAgentsScreen.js`
- `screens/admin-ai-agents-view-model.js`
- tests de agentes, Supabase memory, panel admin, endpoint IA, CORS, premium, tracking y validador.

### Archivos modificados principales

- `.env.example`
- `App.js`
- `README_PRODUCTION.md`
- `api/[...path].js`
- `components/layout/AppShell.js`
- `lib/env.js`
- `lib/runtime-mode.js`
- `package.json`
- `screens/PriceSearchScreen.js`
- `scripts/production-check.mjs`
- `services/premium-service.js`
- `services/tracking-service.js`
- `lib/supabase.js`
- `services/account-service.js`
- `services/ai-savings-service.js`
- `services/analytics-service.js`
- `services/auth-service.js`
- `services/catalog-service.js`
- `services/commerce-service.js`
- `services/finance-service.js`
- `services/growth-service.js`
- `services/local-commerce-service.js`
- `services/price-engine.js`
- `services/price-service.js`
- `services/product-normalizer.js`
- `services/savings-intelligence-service.js`
- `services/search-intent-service.js`
- `services/supabase-price-service.js`
- `services/user-price-service.js`
- `web-out.log` aparece modificado como artefacto/preexistente; no usar como evidencia funcional.

## Validaciones

### `git status`

Estado: OK con cambios pendientes.

Salida relevante:

```text
branch: codex/production-deploy-ready
M .env.example
M App.js
M README_PRODUCTION.md
M api/[...path].js
M components/layout/AppShell.js
M lib/env.js
M lib/runtime-mode.js
M package.json
M screens/PriceSearchScreen.js
M scripts/production-check.mjs
M services/premium-service.js
M services/tracking-service.js
M web-out.log
?? docs/...
?? lib/ai-agents/
?? server/api/v1/ai-agents.js
?? scripts/staging-check.mjs
?? scripts/validate-production-env.mjs
?? scripts/sql/
?? tests/...
```

Accion humana: revisar, stagear y commitear cuando Ronald lo apruebe.

### `npm run lint`

Estado: OK.

Salida relevante:

```text
basic lint passed
```

### `npm run typecheck`

Estado: OK.

Salida relevante:

```text
syntax check passed (134 files)
```

### `npm test`

Estado: OK.

Salida relevante:

```text
Test Files 20 passed (20)
Tests 59 passed (59)
```

Notas: aparecen logs 400/401/403 esperados por tests negativos de validacion, auth y permisos.

### `npm run build`

Estado: OK.

Salida relevante:

```text
Expo export web genero dist
Web Bundled
```

### `npm run production:check`

Estado: OK, pero modo parcial.

Salida relevante:

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

Causa: faltan credenciales/variables reales de staging.

Accion humana: cargar variables reales en Vercel/Supabase/PayPal/Google.

### `npm run staging:check`

Estado: FAIL esperado.

Salida relevante:

```text
mode=demo_or_partial
FAIL Expected mode=staging_ready, got mode=demo_or_partial.
```

Causa: staging todavia no tiene variables reales.

Accion humana: completar `docs/VERCEL_STAGING_ENV_CHECKLIST.md`, aplicar Supabase staging y configurar PayPal/Google.

### `npm run test:e2e`

Estado: OK.

Salida relevante:

```text
1 passed
```

### `vercel deploy`

Estado: OK para Preview.

Salida relevante:

```text
Preview: https://codex-2bidx8wly-akuma424-projects.vercel.app
Deployment completed
```

No se uso `--prod`.

### `curl.exe` smoke preview

Estado: bloqueado por Deployment Protection.

Salida relevante:

```text
GET /api/v1/health -> HTTP/1.1 401 Unauthorized
GET /api/v1/readiness -> HTTP/1.1 401 Unauthorized
```

Causa: Vercel Authentication Required en el preview.

Accion humana: validar con acceso autenticado, `vercel curl` o bypass token aprobado.

### Vercel Preview URL/CORS env

Estado: OK en Preview branch-specific.

Variables agregadas:

```text
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_APP_URL
ALLOWED_ORIGINS
```

Branch:

```text
codex/production-deploy-ready
```

No se tocaron production ni secretos.

### Vercel Preview redeploy after URL/CORS

Estado: OK para Preview deploy.

Salida relevante:

```text
Preview: https://codex-75aq3h1gx-akuma424-projects.vercel.app
Deployment completed
```

Smoke:

```text
GET /api/v1/health -> 401 Unauthorized
GET /api/v1/readiness -> 401 Unauthorized
```

Causa: Vercel Deployment Protection.

No se uso `--prod`.

### Vercel protected preview access

Estado: metodo disponible, pendiente aprobacion operativa.

Hallazgo:

```text
vercel curl existe.
Al usarlo contra el preview protegido, Vercel CLI genero automaticamente un Deployment Protection bypass token.
```

No se imprimio el token.

No se continuo con nuevas pruebas.

Proximo paso: Ronald debe aprobar explicitamente `vercel curl` como metodo de smoke protegido o proveer un bypass token manual/usar navegador autenticado.

### Protected smoke after Ronald approval

Estado: FAIL server-side en preview.

Resultado:

```text
/api/v1/health -> FUNCTION_INVOCATION_FAILED, no JSON
/api/v1/readiness -> FUNCTION_INVOCATION_FAILED, no JSON
```

Request ids:

```text
health: gru1::q8kn4-1777786187299-2d5dd399ca25
readiness: gru1::v78wv-1777786197615-be70c15a5297
```

No se imprimieron ni guardaron tokens.

Proximo paso: revisar logs Vercel para esos request ids.

### Vercel Function debug y preview corregido

Estado: OK para health/readiness en nuevo preview protegido.

Causa raiz confirmada:

```text
ERR_MODULE_NOT_FOUND: Cannot find module '/var/task/lib/config' imported from /var/task/services/catalog-service.js
```

Correccion aplicada:

```text
Imports relativos ESM actualizados para incluir extension `.js` en servicios y librerias usadas por API/serverless.
```

Validaciones posteriores:

```text
npm run lint -> OK, basic lint passed
npm run typecheck -> OK, syntax check passed (134 files)
npm test -> OK, 20 files / 59 tests
npm run build -> OK, Expo export web completo
```

Preview nuevo:

```text
Preview: https://codex-xpel3o047-akuma424-projects.vercel.app
Inspect: https://vercel.com/akuma424-projects/codex/Hr4vhSZvQ9s7omjdpnzrUZJ19m42
```

Smoke protegido:

```text
/api/v1/health -> JSON OK, status=ok, service=ahorroya-api
/api/v1/readiness -> JSON OK, status=degraded, mode=demo_or_partial
```

Checks locales posteriores:

```text
npm run production:check -> OK, mode=demo_or_partial
npm run staging:check -> FAIL esperado, mode=demo_or_partial
```

Causa de `staging:check` FAIL esperado: los checks locales no leen automaticamente variables remotas de Vercel y aun faltan PayPal sandbox real, Google Auth y variables publicas/servidor completas en entorno local/staging.

## Seguridad

- No se agregaron secretos reales versionados.
- No se expuso `SUPABASE_SERVICE_ROLE_KEY` en frontend.
- No se expuso `PAYPAL_CLIENT_SECRET` en frontend.
- No se activo `PAYPAL_ENV=live`.
- No se activo `ENABLE_AI_LEVEL4_OVERRIDE=true`.
- IA sigue apagada o en modo seguro por defecto:
  - `AI_PROVIDER=mock`
  - `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY`
  - `ENABLE_AI_AGENTS=false`
  - `ENABLE_AGENT_SCHEDULER=false`
  - `ENABLE_ADMIN_AI_PANEL=false`
  - `ENABLE_AI_LEVEL4_OVERRIDE=false`
- RLS no fue debilitado. La migracion de agentes usa autorizacion basada en `app_metadata.role`, no en `user_metadata`.
- Produccion sigue No-Go.
- PayPal live sigue bloqueado.
- Level 4 sigue bloqueado.

## Estado Go/No-Go

- Local: Go.
  - Motivo: lint, typecheck, tests, build y E2E pasan.
- Staging: Go condicionado.
  - Motivo: health/readiness ya responden en preview protegido corregido, pero falta cargar PayPal sandbox real, Google Auth, aplicar/validar Supabase staging/RLS y lograr `npm run staging:check` con `mode=staging_ready`.
- Produccion: No-Go.
  - Motivo: faltan PayPal live aprobado, Google Auth produccion, `ALLOWED_ORIGINS` productivo, Supabase/RLS validado en staging y smoke tests reales.

### Secuencia operativa aprobada para Ronald

1. Supabase staging.
2. Vercel con variables base Supabase y flags seguros.
3. Google Cloud OAuth y Supabase Auth Provider.
4. PayPal sandbox.
5. `ALLOWED_ORIGINS` definitivo para staging.
6. Deploy preview/staging.
7. `npm run production:check`.
8. `npm run staging:check`.
9. Smoke tests manuales.
10. Completar `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`.

Staging no puede pasar a Go si `npm run staging:check` no devuelve `mode=staging_ready`.

## Pendientes

### Variables faltantes publicas

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_APP_URL`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

### Variables faltantes servidor

- `ALLOWED_ORIGINS`
- `PAYPAL_ENV=sandbox`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_MONTHLY_PLAN_ID`
- `PAYPAL_YEARLY_PLAN_ID`

### Supabase

- Crear/confirmar proyecto staging.
- Aplicar preflight de `current_app_role()` antes de growth/monetizacion.
- Para el proyecto staging confirmado `wzwjjjajmyfwvspxysjb`, aplicar solo la migracion de agentes desde `docs/SUPABASE_AGENT_MIGRATION_SQL_EDITOR_PACKAGE.md`.
- Aplicar migraciones.
- Ejecutar `scripts/sql/verify-production-schema.sql`.
- Ejecutar `scripts/sql/verify-ai-agents-rls.sql`.
- Crear usuarios normal, admin e internal_job.
- Setear `app_metadata.role=admin` e `app_metadata.role=internal_job`.
- Validar RLS con usuarios reales.

### PayPal

- Crear REST app sandbox.
- Crear planes mensual/anual sandbox.
- Configurar webhook sandbox.
- Validar compra, cancelacion/fallo y `premium_until`.

### Google Auth

- Crear OAuth client.
- Configurar authorized origins y redirects.
- Activar Google provider en Supabase.
- Validar login/logout y migracion de favoritos/alertas.

### IA

- Mantener `AI_PROVIDER=mock`.
- Mantener `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY`.
- Mantener `ENABLE_AI_AGENTS=false` hasta staging controlado.
- Mantener `ENABLE_ADMIN_AI_PANEL=false` hasta roles reales.
- Mantener `ENABLE_AI_LEVEL4_OVERRIDE=false`.

### Opcionales

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`
- `CRON_SHARED_SECRET`
- `AFFILIATE_SIGNING_SECRET`

## Cambios que Ronald debe subir a ChatGPT

1. Copiar el contenido completo de `docs/HANDOFF_PARA_CHATGPT.md`.
2. Adjuntar archivos clave modificados.
3. Adjuntar reportes relevantes.
4. Adjuntar errores/logs si algun comando falla en la siguiente corrida.
5. No adjuntar secretos reales.
6. No pegar valores reales de service role, PayPal secret, Google secret ni tokens.

## Archivos para adjuntar

- `docs/HANDOFF_PARA_CHATGPT.md`
- `docs/FASE_4_STAGING_OPERATIVO_RESULTADO.md`
- `docs/STAGING_EXECUTION_PLAN.md`
- `docs/VERCEL_STAGING_ENV_CHECKLIST.md`
- `docs/SUPABASE_STAGING_EXECUTION_CHECKLIST.md`
- `docs/PAYPAL_STAGING_EXECUTION_CHECKLIST.md`
- `docs/GOOGLE_AUTH_STAGING_EXECUTION_CHECKLIST.md`
- `docs/STAGING_MANUAL_SMOKE_TESTS.md`
- `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`
- `docs/PRODUCTION_READINESS.md`
- `docs/PRODUCTION_GO_NO_GO.md`
- `DEPLOYMENT_CHECKLIST.md`
- `README_PRODUCTION.md`
- `.env.example` sin secretos reales
- `package.json`
- `scripts/staging-check.mjs`
- `scripts/validate-production-env.mjs`
- `scripts/production-check.mjs`
- `scripts/sql/verify-ai-agents-rls.sql`
- `scripts/sql/verify-production-schema.sql`

## Proximo prompt recomendado

```text
Actua como Release Manager, DevOps Lead y Security Engineer para AhorroYA.

Contexto:
- La rama es `codex/production-deploy-ready`.
- Ya existen arquitectura IA, SupabaseAgentMemory, endpoint `/api/v1/ai/agents`, panel `/admin/ai-agents`, migracion Supabase de agentes, documentacion, tests y runbooks.
- La fase operativa de staging creo:
  - `docs/STAGING_EXECUTION_PLAN.md`
  - `docs/VERCEL_STAGING_ENV_CHECKLIST.md`
  - `docs/SUPABASE_STAGING_EXECUTION_CHECKLIST.md`
  - `docs/PAYPAL_STAGING_EXECUTION_CHECKLIST.md`
  - `docs/GOOGLE_AUTH_STAGING_EXECUTION_CHECKLIST.md`
  - `docs/STAGING_MANUAL_SMOKE_TESTS.md`
  - `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`
  - `scripts/staging-check.mjs`
- Validaciones locales pasan: lint, typecheck, tests, build, E2E.
- `production:check` devuelve `mode=demo_or_partial`.
- `staging:check` falla correctamente hasta que se carguen variables reales.

Objetivo:
Guiarme paso a paso para ejecutar STAGING REAL sin activar produccion.

Reglas:
- No crear features nuevas.
- No duplicar agentes ni arquitectura IA.
- No activar produccion.
- No activar PayPal live.
- No activar `ENABLE_AI_LEVEL4_OVERRIDE=true`.
- No usar `AI_AUTONOMY_LEVEL=LEVEL_4_CONTROLLED_EXECUTION`.
- No exponer secretos.
- No bajar RLS.
- No declarar staging listo hasta que `npm run staging:check` devuelva `mode=staging_ready` y pasen smoke tests.

Tareas:
1. Revisar `docs/HANDOFF_PARA_CHATGPT.md`.
2. Revisar los checklists de staging.
3. Indicar exactamente que valores debo obtener de Supabase, Vercel, PayPal y Google Cloud.
4. Darme el orden exacto de carga de variables.
5. Darme comandos para verificar staging.
6. Ayudarme a completar `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`.
7. Mantener produccion en No-Go hasta que todos los criterios esten completos.
```

## MENSAJE PARA CHATGPT

Codex preparo el paquete SQL Editor para aplicar la migracion de agentes IA en Supabase staging.
Proyecto staging confirmado por Ronald: `supabase-aquamarine-battery`, project ref `wzwjjjajmyfwvspxysjb`.
El proyecto no esta limpio y ya tiene tablas base, por eso no se deben ejecutar `supabase-production-schema.sql` ni `supabase-price-schema.sql`.
Preflight confirmado por Ronald: `current_app_role()` existe, tablas `agent_*` no existen y policies `agent_*` no existen.
Se reviso `supabase/migrations/202605020001_ai_agents_memory.sql`.
La migracion crea `agent_tasks`, `agent_logs`, `agent_reports`, `agent_suggestions`, `agent_memory` y `agent_executions`.
Crea `public.agent_authorized_role()` usando solo `auth.jwt() -> 'app_metadata' ->> 'role'`.
Roles permitidos: `admin` e `internal_job`.
No usa `user_metadata`.
Activa RLS en todas las tablas `agent_*`.
Crea policies `admin_internal_agent_*` con `for all to authenticated` para admin/internal_job.
Es segura para este staging porque `agent_*` no existe todavia, pero no debe reejecutarse completa si las policies ya existen.
Se creo `docs/SUPABASE_AGENT_MIGRATION_SQL_EDITOR_PACKAGE.md` con instrucciones, SQL completo y queries post-migracion.
No se ejecuto SQL, no se tocaron variables remotas, no se imprimieron secretos y no se toco production.
Staging sigue No-Go hasta que Ronald ejecute el SQL en Supabase Dashboard y valide RLS con usuarios reales.
Produccion sigue No-Go.
