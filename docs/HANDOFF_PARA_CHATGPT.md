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
  - Motivo: hay plan operativo y guardrails, pero falta cargar variables reales, aplicar migraciones y ejecutar smoke tests. `staging:check` aun falla correctamente.
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

Codex completo la preparacion operativa de STAGING REAL para AhorroYA.
La rama actual es `codex/production-deploy-ready` y hay cambios pendientes sin commit.
Se crearon runbooks/checklists de staging: Vercel env, Supabase migrations/RLS, PayPal sandbox, Google Auth, smoke tests manuales y release candidate report.
Se agrego `npm run staging:check`, que exige `mode=staging_ready` y bloquea PayPal live, Level 4 y secretos expuestos.
Validaciones ejecutadas: `npm run lint` OK, `npm run typecheck` OK, `npm test` OK con 59 tests, `npm run build` OK, `npm run test:e2e` OK.
`npm run production:check` esta OK pero devuelve `mode=demo_or_partial`.
`npm run staging:check` falla correctamente porque faltan variables reales de staging.
No se agregaron secretos reales.
No se expuso `SUPABASE_SERVICE_ROLE_KEY` ni `PAYPAL_CLIENT_SECRET` en frontend.
No se activo `PAYPAL_ENV=live`.
No se activo `ENABLE_AI_LEVEL4_OVERRIDE=true`.
IA sigue segura: mock/read-only/off por defecto.
RLS no fue debilitado; debe validarse en Supabase staging con usuarios `admin` e `internal_job`.
Staging queda Go condicionado hasta cargar variables reales, aplicar migraciones y pasar smoke tests.
Produccion sigue No-Go.
Archivos clave para revisar: `docs/HANDOFF_PARA_CHATGPT.md`, `docs/STAGING_EXECUTION_PLAN.md`, `docs/VERCEL_STAGING_ENV_CHECKLIST.md`, `docs/SUPABASE_STAGING_EXECUTION_CHECKLIST.md`, `docs/PAYPAL_STAGING_EXECUTION_CHECKLIST.md`, `docs/GOOGLE_AUTH_STAGING_EXECUTION_CHECKLIST.md`, `docs/STAGING_MANUAL_SMOKE_TESTS.md`, `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`, `.env.example`, `package.json`.
Necesito que ChatGPT me guie ahora a cargar credenciales reales de staging sin exponer secretos, ejecutar Supabase/PayPal/Google, correr `npm run staging:check` hasta `mode=staging_ready`, y completar el release candidate report.
