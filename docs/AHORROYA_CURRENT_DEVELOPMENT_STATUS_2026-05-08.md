# AhorroYA current development status - 2026-05-08

## Resumen ejecutivo

Estado general: `DEMO_OR_PARTIAL`.

Staging: `NO-GO` para `staging_release_candidate`.

Produccion: `NO-GO_PRODUCTION`.

La rama auditada es `codex/production-deploy-ready`. No se ejecuto deploy de produccion, no se uso `--prod`, no se aplicaron migraciones remotas Supabase y no se imprimieron secretos. El proyecto tiene una base funcional de frontend, API serverless, Supabase, PayPal, Google OAuth, Vercel Preview y agentes IA, pero todavia faltan variables criticas, validacion completa de staging, `SUPABASE_DB_URL` para tests SQL RLS, validacion PayPal/Google staging y desbloqueo de AI Gateway en Vercel.

## Evidencia de comandos ejecutados

| Comando | Resultado | Evidencia |
|---|---:|---|
| `git branch --show-current` | OK | `codex/production-deploy-ready` |
| `git status --short --branch` | OK con cambios | Rama contra `AhorroYa/codex/production-deploy-ready`; working tree dirty y revisable |
| `git log --oneline -10` | OK | Ultimo commit visto: `3c8707a Clarify Supabase staging apply plan for existing project` |
| `node -v` | OK | `v24.15.0` |
| `npm -v` | OK | `11.12.1` |
| `npx vercel --version` | OK | `53.1.0` |
| `npx vercel env ls --scope akuma424-projects` | OK | CLI autenticado; variables listadas sin valores |
| `npm run lint` | OK | `basic lint passed` |
| `npm run typecheck` | OK | `syntax check passed` |
| `npm run test` | OK | `22 passed`, `68 tests` |
| `npm run build` | OK con riesgo | Exporta `dist`; Expo carga `.env.local` y lista nombres de variables server-side |
| `npm run production:check` | OK tecnico, no listo | `mode=demo_or_partial` |
| `npm run staging:check` | FAIL esperado | `Expected mode=staging_ready, got mode=demo_or_partial` |
| `node scripts/rls-agent-user-smoke.mjs` | OK | RLS validation `PASS` contra staging guard |
| `npm run test:rls` | BLOCKED | Falta `SUPABASE_DB_URL` |
| `npm run ai:gateway:smoke` | BLOCKED/FAIL | Gateway auth presente, pero Vercel requiere tarjeta/creditos para usar Gateway |

## Git y rama

- Rama actual: `codex/production-deploy-ready`.
- Remoto: `https://github.com/FileLanderScaner/CODEX.git`.
- La rama no es `main`.
- No hay archivos `.env` versionados salvo ejemplos: `.env.example` y `.env.rls.example`.
- Hay cambios no commiteados y archivos nuevos; el diff es revisable.

Cambios/untracked relevantes detectados:

- `.env.example`, `.env.rls.example`, `.gitignore`, `package.json`, `package-lock.json`.
- `.github/workflows/preview.yml`.
- `lib/env.js`, `lib/ai-agents/AIProvider.js`, `lib/ai-agents/AgentPermissions.js`, `lib/ai-agents/contracts.js`.
- `scripts/ai-gateway-smoke.mjs`, `scripts/rls-agent-user-smoke.mjs`, `scripts/run-rls-tests.mjs`, `scripts/staging-check.mjs`, `scripts/validate-production-env.mjs`.
- `server/api/supabase/_auth.js`, `server/api/v1/ai-agents.js`.
- `tests/unit/ai-provider.test.js`, `tests/unit/supabase-auth-env.test.js`.
- `docs/AI_GATEWAY_INTEGRATION_2026-05-08.md`.

## Frontend

Estado: `PARTIAL`.

Stack real:

- Expo SDK 53.
- React 19.
- React Native 0.79.
- React Native Web.
- Build web con `expo export --platform web`.
- Output Vercel: `dist`.

Pantallas implementadas:

- `LandingScreen`.
- `PriceSearchScreen`.
- `ResultsScreen`.
- `ProductDetailScreen`.
- `DashboardScreen`.
- `AuthScreen`.
- `PaywallScreen`.
- `QrScreen`.
- `AdminAIAgentsScreen`.

Flujos presentes:

- Busqueda de productos y comparacion de precios.
- Resultados, detalle, favoritos y dashboard.
- Premium/paywall y botones PayPal.
- Compartir por WhatsApp.
- Login/Supabase Auth.
- Panel admin IA oculto/detras de flags y rol.

Riesgos frontend:

- `npm run build` funciona, pero el log de Expo muestra que `.env.local` contiene nombres de variables server-side como `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_SECRET`, `POSTGRES_*` y `SUPABASE_JWT_SECRET`. No se imprimieron valores, pero `.env.local` debe quedar reservado a variables publicas `EXPO_PUBLIC_*`; secretos deben moverse a `.env.server.local` y Vercel server env.
- Variables publicas incompletas para staging: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_URL`, `EXPO_PUBLIC_PAYPAL_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.

## Backend/API

Estado: `PARTIAL`.

Arquitectura:

- Rutas serverless bajo `api/**` que delegan a `server/api/**`.
- API v1 bajo `server/api/v1/**`.
- Utilidades comunes en `server/api/v1/_utils.js`: request id, CORS, logging Pino, Zod, rate limit, auth Bearer, control de rol.
- Seguridad/rate limit en `server/api/_security.js`.

Endpoints criticos:

- `GET /api/v1/health`: existe y devuelve estado basico.
- `GET /api/v1/readiness`: existe y reporta readiness degradado si faltan integraciones.
- `/api/v1/ai/agents`: existe, valida input, requiere panel habilitado, auth y rol.
- PayPal: `server/api/paypal/*` y `server/api/v1/billing/*`.
- Supabase auth helpers: `server/api/supabase/_auth.js`.

Riesgos backend:

- `ALLOWED_ORIGINS` faltante o incompleto bloquea staging seguro.
- PayPal sandbox no validado por falta de credenciales/plan/webhook.
- Google OAuth staging no validado por falta de variables publicas y server-side.
- Service role debe permanecer solo server-side. Actualmente el codigo lo usa server-side, pero `.env.local` local debe limpiarse para que Expo no cargue nombres de secretos durante build.

## Supabase

Estado: `PARTIAL`.

Proyecto staging detectado por guard local:

- Project ref esperado: `wzwjjjajmyfwvspxysjb`.
- Host esperado: `wzwjjjajmyfwvspxysjb.supabase.co`.
- `.env.rls` tiene marcador `ENVIRONMENT=staging` y `SUPABASE_STAGING_PROJECT_REF` presente.

Migraciones existentes:

- `202604270001_production_schema.sql`.
- `202604270002_app_role_values.sql`.
- `202604270003_roles_rls_hardening.sql`.
- `202604270004_paypal_subscriptions.sql`.
- `202604270005_growth_retention_tracking.sql`.
- `202604271200_monetization_v2_premium_system.sql`.
- `202604301430_auth_profile_bootstrap.sql`.
- `202604301520_frontend_supabase_compat.sql`.
- `202605010001_unicorn_growth_monetization.sql`.
- `202605020001_ai_agents_memory.sql`.

Funciones y tablas IA/RLS:

- `current_app_role()` existe en migraciones base/hardening.
- `agent_authorized_role()` existe en la migracion de agentes.
- Tablas de agentes: `agent_tasks`, `agent_logs`, `agent_reports`, `agent_suggestions`, `agent_memory`, `agent_executions`.
- RLS habilitado para tablas de agentes.
- Politicas permiten `admin` e `internal_job` usando `auth.jwt()->app_metadata->role`.

RLS:

- Smoke HTTP/Auth/REST paso:
  - normal: login OK, select `agent_executions` OK, insert `agent_logs` bloqueado 403.
  - admin: insert `agent_logs` permitido.
  - internal_job: insert `agent_logs` permitido.
- `npm run test:rls` sigue bloqueado porque falta `SUPABASE_DB_URL`.

## Vercel

Estado Preview: `PARTIAL`.

Estado Production: `BLOCKED`.

Configuracion local:

- `.vercel/project.json` existe:
  - `projectName=codex`.
  - `projectId=prj_82mOJriJZUJtLZVFEr6NKofdM5zn`.
  - `orgId=team_hxhoCuOTVudxi86gRHOsAuJF`.
- `vercel.json` usa:
  - `buildCommand=npm run build`.
  - `outputDirectory=dist`.
  - rewrites SPA a `index.html`.
  - headers de seguridad/CSP.
- Vercel CLI funciona con scope `akuma424-projects`.

Variables remotas vistas por nombre, no valor:

- Preview branch `codex/production-deploy-ready` tiene flags IA seguros y `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_URL`, `ALLOWED_ORIGINS`, `PAYPAL_ENV`.
- Production/Preview/Development tienen variables Supabase/Postgres del marketplace (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.).
- Faltan o no se observaron por nombre: `EXPO_PUBLIC_PAYPAL_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MONTHLY_PLAN_ID`, `PAYPAL_YEARLY_PLAN_ID`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `AI_GATEWAY_ENABLED`, `AI_GATEWAY_MODEL`, `AI_GATEWAY_MAX_OUTPUT_TOKENS`, `SUPABASE_DB_URL`.

Riesgos Vercel:

- `deploy-vercel.yml` despliega produccion en push a `main` con `--prod`.
- Preview esta preparado, pero no se ejecuto deploy por regla de seguridad.
- AI Gateway tiene `VERCEL_OIDC_TOKEN` local via `.env.vercel.local`, pero el smoke falla porque Vercel requiere tarjeta/creditos habilitados.

## GitHub/CI

Estado: `PARTIAL`.

Workflows detectados:

- `.github/workflows/ci.yml`.
- `.github/workflows/preview.yml`.
- `.github/workflows/deploy-vercel.yml`.
- `.github/workflows/mobile-eas.yml`.
- `.github/workflows/supabase-migrations.yml`.

Riesgos CI/CD:

- `deploy-vercel.yml` produce deploy production desde `main`; requiere branch protection y aprobacion humana.
- `supabase-migrations.yml` usa `environment: production` y ejecuta `supabase db push`; no usar para staging sin separarlo.
- Falta evidencia de branch protection desde el repo local.

## PayPal

Estado: `BLOCKED`.

- Codigo server-side existe.
- `PAYPAL_ENV=sandbox` es el valor seguro para staging.
- Faltan variables sandbox criticas en checks locales/remotos: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MONTHLY_PLAN_ID`, `PAYPAL_YEARLY_PLAN_ID`, `EXPO_PUBLIC_PAYPAL_CLIENT_ID`.
- No se valido sandbox.

## Google OAuth

Estado: `BLOCKED`.

- Hay integracion cliente/servicios y checks de readiness.
- Faltan `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`.
- No se valido callback/origen staging.

## IA / AI Gateway / agentes

Estado: `PARTIAL`.

- `AI_PROVIDER=mock` por defecto.
- `ENABLE_AI_AGENTS=false` por defecto esperado.
- `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY` por defecto esperado.
- `ENABLE_ADMIN_AI_PANEL=false` por defecto esperado.
- `ENABLE_AI_LEVEL4_OVERRIDE=false` por defecto esperado.
- AIProvider soporta `mock`, `openai`, `gemini`, `vercel_gateway`.
- `vercel_gateway` esta detras de `AI_PROVIDER=vercel_gateway` y `AI_GATEWAY_ENABLED=true`.
- `scripts/ai-gateway-smoke.mjs` existe y no toca Supabase ni agentes.
- Smoke AI Gateway no paso: Vercel exige tarjeta/creditos para AI Gateway.

## Matriz de estado por area

| Area | Estado | Motivo |
|---|---:|---|
| Frontend | `PARTIAL` | Build OK, flujo base existe, faltan env publicas y limpieza de `.env.local` |
| Backend/API | `PARTIAL` | Endpoints existen, readiness degrada por integraciones faltantes |
| Supabase | `PARTIAL` | Proyecto staging identificado y smoke REST pasa; falta `SUPABASE_DB_URL` para SQL RLS |
| RLS | `PARTIAL` | Smoke JWT/REST pasa; `test:rls` bloqueado |
| Vercel Preview | `PARTIAL` | CLI y env ls OK; faltan variables y no se hizo deploy preview |
| Vercel Production | `BLOCKED` | Produccion no debe tocarse; faltan criterios go-live |
| GitHub/CI | `PARTIAL` | Workflows existen; produccion en push a main y migraciones production son riesgos |
| PayPal | `BLOCKED` | Faltan sandbox vars y validacion |
| Google Auth | `BLOCKED` | Faltan OAuth vars y validacion |
| AI/Gateway/Agents | `PARTIAL` | Integracion preparada, flags seguros; Gateway smoke bloqueado por billing/creditos |

## Variables faltantes o no confirmadas

| Variable | Entorno | Estado | Riesgo | Accion requerida |
|---|---|---:|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | local/preview | Faltante local, vista en preview | API base incorrecta | Definir URL HTTPS exacta de preview/staging |
| `EXPO_PUBLIC_APP_URL` | local/preview | Faltante local, vista en preview | OAuth/share/callback rotos | Definir URL app preview/staging |
| `EXPO_PUBLIC_PAYPAL_CLIENT_ID` | local/preview | Faltante/no vista | PayPal UI no carga | Crear app sandbox y cargar public client id |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | local/preview | Faltante/no vista | Login Google no funciona | Crear OAuth client staging |
| `ALLOWED_ORIGINS` | local/preview | Faltante local, vista en preview | CORS inseguro o bloqueado | Cargar origen HTTPS exacto |
| `PAYPAL_CLIENT_ID` | staging/preview | Faltante/no vista | Billing bloqueado | Cargar credencial sandbox server-side |
| `PAYPAL_CLIENT_SECRET` | staging/preview | Faltante/no vista | Billing bloqueado | Cargar secreto sandbox server-side |
| `PAYPAL_WEBHOOK_ID` | staging/preview | Faltante/no vista | Webhooks no verifican | Configurar webhook sandbox |
| `PAYPAL_MONTHLY_PLAN_ID` | staging/preview | Faltante/no vista | Plan mensual bloqueado | Crear plan sandbox |
| `PAYPAL_YEARLY_PLAN_ID` | staging/preview | Faltante/no vista | Plan anual bloqueado | Crear plan sandbox |
| `GOOGLE_OAUTH_CLIENT_ID` | staging/preview | Faltante/no vista | Auth server readiness falla | Cargar client id staging |
| `GOOGLE_OAUTH_CLIENT_SECRET` | staging/preview | Faltante/no vista | Auth server readiness falla | Cargar secreto staging |
| `SUPABASE_DB_URL` | local RLS/CI | Faltante | `test:rls` bloqueado | Cargar DB URL staging, nunca produccion |
| `AI_GATEWAY_ENABLED` | preview | No vista | Gateway no activable por flag | Cargar `false` inicialmente |
| `AI_GATEWAY_MODEL` | preview | No vista | Modelo default local solamente | Cargar `openai/gpt-5.5` si se prueba Gateway |
| `AI_GATEWAY_MAX_OUTPUT_TOKENS` | preview | No vista | Limites no explicitados | Cargar `600` |

## Bloqueos

- `BLOCKED_MISSING_ENV`: faltan PayPal, Google, public envs y `SUPABASE_DB_URL`.
- `BLOCKED_SUPABASE_RLS_SQL`: `npm run test:rls` no puede correr sin `SUPABASE_DB_URL`.
- `BLOCKED_AI_GATEWAY_BILLING`: AI Gateway smoke falla por requisito de tarjeta/creditos en Vercel.
- `STAGING_BLOCKED`: `npm run staging:check` no llega a `staging_ready`.
- `NO_GO_PRODUCTION`: faltan todos los gates de staging y aprobacion humana.

## Proximo comando exacto recomendado

Despues de cargar variables faltantes en archivos locales staging y Vercel Preview, ejecutar:

```powershell
npm run staging:check
```

Si pasa, continuar con:

```powershell
node scripts/rls-agent-user-smoke.mjs
npm run test:rls
npm run build
```

No ejecutar `npx vercel deploy` hasta que esos checks pasen.
