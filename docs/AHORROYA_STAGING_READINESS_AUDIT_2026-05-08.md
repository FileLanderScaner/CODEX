# AhorroYA staging readiness audit - 2026-05-08

## Alcance

Rama auditada: `codex/production-deploy-ready`.
Repositorio remoto: `https://github.com/FileLanderScaner/CODEX.git`.
Commit base: `3c8707a Clarify Supabase staging apply plan for existing project`.

No se tocaron produccion, datos reales, migraciones remotas ni variables remotas. La consulta del proyecto Vercel via connector fallo con `403 Forbidden` para el scope `akuma424-projects`; por eso el estado remoto de Vercel no queda validado.

## Stack detectado

- Expo SDK 53, React 19, React Native 0.79, React Native Web.
- Vercel static output desde `dist` con rewrites SPA y API serverless bajo `api/**`.
- Supabase JS v2.104.1, REST server-side con service role en endpoints serverless.
- PayPal server-side para suscripciones/webhooks y SDK publico por `EXPO_PUBLIC_PAYPAL_CLIENT_ID`.
- Google OAuth configurado por variables, sin flujo completo validado en esta auditoria.
- Vitest, Playwright, scripts propios de lint/typecheck/checks.
- Agentes IA internos en `lib/ai-agents` con memoria Supabase opcional.

## Scripts disponibles

- `npm run start`, `android`, `ios`, `web`.
- `npm run build`: `expo export --platform web`.
- `npm run lint`, `typecheck`, `ci`.
- `npm run production:check`, `staging:check`.
- `npm run test`, `test:unit`, `test:integration`, `test:contract`, `test:security`, `test:coverage`, `test:e2e`, `test:rls`.

## Variables esperadas

Cliente preview/staging:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_APP_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`

Servidor preview/staging:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYPAL_ENV=sandbox`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_MONTHLY_PLAN_ID`
- `PAYPAL_YEARLY_PLAN_ID`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `AI_PROVIDER=mock|openai|gemini`
- `OPENAI_API_KEY` o `GEMINI_API_KEY` si `AI_PROVIDER` no es `mock`
- `ALLOWED_ORIGINS`
- `ENABLE_AI_AGENTS`
- `AI_AUTONOMY_LEVEL`
- `ENABLE_ADMIN_AI_PANEL`
- `ENABLE_AI_LEVEL4_OVERRIDE=false`

Locales detectadas sin exponer valores:

- `.env.local`: Supabase public keys/URL.
- `.env.server.local`: Supabase server/Postgres keys; no PayPal, Google, AI flags ni `ALLOWED_ORIGINS` detectados.
- `.env.rls`: credenciales de usuarios de smoke RLS.

## Variables faltantes segun checks

`npm run production:check` reporto:

- Publicas faltantes: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_URL`, `EXPO_PUBLIC_PAYPAL_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.
- Staging faltantes: `ALLOWED_ORIGINS`, `PAYPAL_ENV`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MONTHLY_PLAN_ID`, `PAYPAL_YEARLY_PLAN_ID`.
- Produccion faltantes adicionales: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`.
- Riesgo: `ALLOWED_ORIGINS` no incluye origen HTTPS explicito.

## Estado Supabase

- Migraciones existentes en `supabase/migrations` desde `202604270001` hasta `202605020001_ai_agents_memory.sql`.
- Orden lexicografico correcto para `supabase db push`; documentos existentes tambien contienen runbooks manuales.
- Existe `current_app_role()` en migraciones base/hardening.
- La migracion de agentes crea `agent_authorized_role()` y las tablas `agent_tasks`, `agent_logs`, `agent_reports`, `agent_suggestions`, `agent_memory`, `agent_executions`.
- Todas esas tablas habilitan RLS.
- Politicas RLS de agentes permiten `admin` e `internal_job` por `auth.jwt()->app_metadata->role`.
- No se usa `user_metadata` para autorizacion de agentes.
- Smoke test remoto RLS no validado: `npm run test:rls` fallo porque falta `SUPABASE_DB_URL`.

## Estado Vercel

- `.vercel/project.json` existe y apunta a `projectName=codex`, `projectId=prj_82mOJriJZUJtLZVFEr6NKofdM5zn`.
- `vercel.json` define `npm run build`, `dist`, rewrites SPA y headers de seguridad.
- Connector Vercel no pudo leer proyecto/deployments por 403; requiere reautenticacion o token con scope correcto.
- Workflow `.github/workflows/deploy-vercel.yml` despliega produccion en push a `main`; no hay workflow staging separado validado.

## Estado PayPal

- Codigo server-side existe en `server/api/paypal` y `server/api/v1/billing`.
- Variables PayPal staging faltan localmente.
- `PAYPAL_ENV=live` esta bloqueado por `staging:check`.
- Sandbox no fue validado por falta de credenciales.

## Estado Google Auth

- Variables publicas/servidor documentadas.
- Readiness acepta `GOOGLE_OAUTH_CLIENT_ID` o client ID publico.
- Variables Google faltan localmente; login Google no validado.
- Hay runbooks en `docs/GOOGLE_AUTH_RUNBOOK.md` y `docs/GOOGLE_AUTH_STAGING_EXECUTION_CHECKLIST.md`.

## Estado agentes IA

- Hay 12 agentes definidos: ProductAudit, PriceIntelligence, SavingsOptimizer, Personalization, Growth, Monetization, SupportWhatsApp, DataIngestion, QARegression, DevAutonomy, SecurityCompliance, Observability.
- `AgentPermissions` bloquea acciones peligrosas y produccion sin aprobacion.
- `LEVEL_4_*` queda bloqueado salvo `ENABLE_AI_LEVEL4_OVERRIDE=true`.
- Se agrego compatibilidad con los niveles pedidos por AhorroYA: `LEVEL_1_ASSISTED`, `LEVEL_2_STAGING_WRITE`, `LEVEL_3_LIMITED_AUTOMATION`, `LEVEL_4_HIGH_AUTONOMY`.
- Se mejoro `AIProvider` para respetar `AI_PROVIDER`, soportar mock/OpenAI/Gemini, registrar logs, aplicar rate limit en memoria y redactar contexto sensible antes de llamadas externas.

## Estado panel admin

- Pantalla: `screens/AdminAIAgentsScreen.js`.
- Endpoint: `server/api/v1/ai-agents.js`.
- Bloqueado si `ENABLE_ADMIN_AI_PANEL=false`.
- Requiere usuario autenticado y rol `admin` o `internal_job`.
- Lista agentes, historial, sugerencias, logs/reportes por API.
- Permite aprobar/rechazar sugerencias; no aplica acciones destructivas.
- Ejecucion usa `dryRun=true` por defecto y produccion bloquea `dryRun=false`.

## Estado endpoints API

- Router dinamico en `api/[...path].js` y aliases `api/v1/[path].js`.
- Utilidades comunes en `server/api/v1/_utils.js`: validacion Zod, request id, CORS, rate limit, logging Pino, auth por Bearer.
- Endpoint de agentes cumple validacion, logging y control de rol.
- Service role se usa solo server-side para Supabase REST.

## Checks ejecutados

- `npm install`: OK, sin cambios necesarios; reporta 5 vulnerabilidades npm (4 moderadas, 1 alta).
- `npm run lint`: OK.
- `npm run typecheck`: OK, 135 archivos.
- `npm run test`: OK, 21 archivos / 62 tests.
- `npm run build`: OK, exporta `dist`.
- `npm run production:check`: OK tecnico, modo `demo_or_partial`.
- `npm run staging:check`: FAIL esperado; modo `demo_or_partial`, faltan variables.
- `npm run test:rls`: FAIL esperado; falta `SUPABASE_DB_URL`.
- Busqueda local de patrones de secretos: sin credenciales obvias en archivos versionables revisados; las coincidencias fueron nombres/documentacion.

## Riesgos actuales

- No-go para staging hasta completar variables PayPal, Google, origins y flags IA seguros.
- Vercel remoto no validado por 403 de scope.
- Workflow de Supabase migrations apunta a environment `production`; no usar para staging sin separar proyecto/entorno.
- `deploy-vercel.yml` despliega produccion en push a `main`; staging necesita flujo preview separado.
- `npm audit` reporta 5 vulnerabilidades.
- RLS real no probado contra staging por falta de `SUPABASE_DB_URL` o credenciales JWT verificadas.
- El smoke RLS ahora bloquea ejecucion si `.env.rls` no declara `ENVIRONMENT=staging` y `SUPABASE_STAGING_PROJECT_REF` coincidente con `SUPABASE_URL`.
- `server/api/supabase/_auth.js` acepta aliases `SUPABASE_ANON_KEY`, `EXPO_PUBLIC_*` y `NEXT_PUBLIC_*`.

## Archivos criticos

- `lib/env.js`
- `lib/ai-agents/**`
- `server/api/v1/ai-agents.js`
- `server/api/v1/_utils.js`
- `server/api/supabase/_auth.js`
- `server/api/paypal/_utils.js`
- `screens/AdminAIAgentsScreen.js`
- `supabase/migrations/202605020001_ai_agents_memory.sql`
- `scripts/validate-production-env.mjs`
- `scripts/staging-check.mjs`
- `scripts/rls-agent-user-smoke.mjs`
- `.github/workflows/deploy-vercel.yml`
- `.github/workflows/supabase-migrations.yml`
- `vercel.json`

## Go / No-go

Estado actual: **NO-GO para staging_release_candidate**.

Motivo: falta configuracion staging verificable, Vercel remoto no autorizado para lectura, PayPal/Google no configurados, smoke RLS no ejecutado contra staging.

Estado aceptable para demo/local: **GO parcial** con Supabase public/server local y agentes en modo mock/read-only.

## Deploy preview Vercel

1. Reautenticar Vercel con scope correcto `akuma424-projects`.
2. Confirmar link: `.vercel/project.json` debe apuntar al proyecto staging/preview correcto, no produccion.
3. Cargar variables preview en Vercel, no en repo:
   - publicas: `EXPO_PUBLIC_*`
   - server-only: `SUPABASE_SERVICE_ROLE_KEY`, PayPal sandbox, Google secret, AI keys.
4. Mantener:
   - `PAYPAL_ENV=sandbox`
   - `AI_PROVIDER=mock` para primer preview
   - `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY`
   - `ENABLE_AI_LEVEL4_OVERRIDE=false`
   - `ENABLE_AI_AGENTS=false` hasta validar panel/API
5. Ejecutar localmente: `npm run lint && npm run typecheck && npm run test && npm run build && npm run staging:check`.
6. Desplegar preview, no prod: `npx vercel deploy`.
7. Probar `/api/v1/readiness` y `/api/v1/ai/agents` con usuario admin staging.

## Validacion Supabase staging

1. Crear/usar proyecto Supabase staging separado de produccion.
2. Aplicar migraciones en orden lexicografico con CLI o SQL Editor.
3. Ejecutar `scripts/sql/verify-production-schema.sql`.
4. Ejecutar `scripts/sql/verify-ai-agents-rls.sql`.
5. Crear usuarios staging:
   - normal sin `app_metadata.role`
   - admin con `app_metadata.role=admin`
   - internal job con `app_metadata.role=internal_job`
6. Completar `.env.rls` local con credenciales staging.
7. Agregar en `.env.rls`:
   - `ENVIRONMENT=staging`
   - `SUPABASE_STAGING_PROJECT_REF=<project-ref-staging>`
8. Ejecutar `node scripts/rls-agent-user-smoke.mjs`.
9. Para `npm run test:rls`, definir `SUPABASE_DB_URL` de staging; no usar produccion.

## Checklist demo_or_partial -> staging_release_candidate

- Variables preview/staging completas.
- `ALLOWED_ORIGINS` con URL HTTPS exacta de preview/staging.
- PayPal sandbox validado.
- Google OAuth staging validado.
- Vercel connector/CLI reautenticado y lectura de deployments disponible.
- `npm run staging:check` pasa.
- `npm run test:rls` o smoke JWT staging pasa.
- Panel admin visible solo con flag y rol admin.
- Agentes en `LEVEL_0_READ_ONLY`; `ENABLE_AI_LEVEL4_OVERRIDE=false`.
- `AI_PROVIDER=mock` o provider real con rate limit/logging validado.
- Sin secretos en variables publicas ni archivos versionables.

## Recomendaciones para produccion

- No promover a produccion sin aprobacion explicita.
- Separar workflows staging y produccion para Supabase y Vercel.
- Exigir branch protection y aprobacion manual para `environment: production`.
- Rotar secretos antes del primer go-live si fueron usados en entornos locales.
- Mantener `ENABLE_AI_AGENTS=false` y `ENABLE_ADMIN_AI_PANEL=false` en produccion inicial.
- Subir autonomia solo despues de pruebas staging repetibles y auditoria de logs.
- Resolver `npm audit` antes del release candidate.
