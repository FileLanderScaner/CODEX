# AhorroYA env resolution report - 2026-05-08

## Estado final

Resultado: `ENV_DISCOVERY_COMPLETE`, `ENV_AUTOFIX_COMPLETE`, `VERCEL_PREVIEW_ENV_UPDATED`, `STAGING_ENV_READY`.

Staging llega a `STAGING_ENV_READY`. PayPal sandbox y Google OAuth staging estan configurados. `npm run test:rls` quedo bloqueado por tooling local: `psql` no esta instalado o no esta en `PATH`.

No se toco produccion, no se ejecuto deploy, no se aplicaron migraciones remotas, no se imprimieron secretos y no se activaron agentes IA.

## Fuentes auditadas

- `.env.local`.
- `.env.server.local`.
- `.env.rls`.
- `.env.example`.
- `.env.rls.example`.
- `.env.vercel.local`.
- `package.json`.
- `lib/env.js`.
- `scripts/staging-check.mjs`.
- `scripts/validate-production-env.mjs`.
- `scripts/rls-agent-user-smoke.mjs`.
- `scripts/run-rls-tests.mjs`.
- `docs/AHORROYA_CURRENT_DEVELOPMENT_STATUS_2026-05-08.md`.
- `docs/AHORROYA_ENV_MATRIX_2026-05-08.md`.
- `docs/AHORROYA_PRODUCTION_DEPLOY_PLAN_2026-05-08.md`.
- `docs/AI_GATEWAY_INTEGRATION_2026-05-08.md`.
- Vercel Preview via CLI.
- Vercel Development via CLI.
- Vercel Production solo lectura via CLI.

## Backups creados

Backups locales creados sin imprimir contenidos:

- `.env.local.backup.local`.
- `.env.server.local.backup.local`.
- `.env.rls.backup.local`.
- `.env.example.backup.local`.
- `.env.rls.example.backup.local`.
- `.env.vercel.local.backup.local`.

`git check-ignore` confirma que los backups estan ignorados.

## Archivos corregidos

- `.gitignore`: agregado patron amplio `.env.*` con excepciones para `.env.example` y `.env.rls.example`, y backups locales.
- `.env.local`: quedo limitado a variables publicas `EXPO_PUBLIC_*`.
- `.env.server.local`: recibio variables server/staging y defaults seguros.
- `.env.rls`: conserva guards staging y credenciales RLS staging, sin `SUPABASE_DB_URL`.
- `.env.vercel.local`: repull de Preview branch `codex/production-deploy-ready`; sigue ignorado.
- `.env.example`: actualizado con nombres completos, placeholders seguros y `AI_GATEWAY_SMOKE_PROMPT_ENABLED=false`.
- `.env.rls.example`: agregado `ENVIRONMENT`, `SUPABASE_STAGING_PROJECT_REF` y `SUPABASE_DB_URL` placeholder.

## Variables movidas fuera de `.env.local`

`.env.local` contenia o arrastraba variables server-side desde Vercel/Supabase. Fueron movidas a `.env.server.local` o `.env.rls` segun correspondia, sin imprimir valores.

Categorias movidas:

- Supabase server: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET`.
- Postgres: `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`.
- PayPal server: `PAYPAL_CLIENT_SECRET` cuando existia.
- Tokens/secrets: cualquier clave con patron `token`, `password` o `secret`.

Estado final de `.env.local`:

- `EXPO_PUBLIC_API_BASE_URL`.
- `EXPO_PUBLIC_APP_URL`.
- `EXPO_PUBLIC_SUPABASE_URL`.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`.
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.

No faltan variables publicas requeridas en `.env.local`.

## Defaults seguros aplicados

En `.env.server.local`:

- `ENVIRONMENT=staging`.
- `SUPABASE_STAGING_PROJECT_REF=wzwjjjajmyfwvspxysjb`.
- `PAYPAL_ENV=sandbox`.
- `AI_PROVIDER=mock`.
- `AI_GATEWAY_ENABLED=false`.
- `AI_GATEWAY_MODEL=openai/gpt-5.5`.
- `AI_GATEWAY_MAX_OUTPUT_TOKENS=600`.
- `AI_GATEWAY_SMOKE_PROMPT_ENABLED=false`.
- `ENABLE_AI_AGENTS=false`.
- `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY`.
- `ENABLE_ADMIN_AI_PANEL=false`.
- `ENABLE_AI_LEVEL4_OVERRIDE=false`.

En `.env.rls`:

- `ENVIRONMENT=staging`.
- `SUPABASE_STAGING_PROJECT_REF=wzwjjjajmyfwvspxysjb`.

## Variables cargadas en Vercel Preview

Se cargo solo Preview, branch `codex/production-deploy-ready`, sin tocar Production.

Variables agregadas o confirmadas por repull posterior:

- `EXPO_PUBLIC_SUPABASE_URL`.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- `ENVIRONMENT`.
- `SUPABASE_STAGING_PROJECT_REF`.
- `AI_GATEWAY_ENABLED`.
- `AI_GATEWAY_MODEL`.
- `AI_GATEWAY_MAX_OUTPUT_TOKENS`.
- `AI_GATEWAY_SMOKE_PROMPT_ENABLED`.

Variables Preview ya existentes antes o confirmadas por pull:

- `EXPO_PUBLIC_API_BASE_URL`.
- `EXPO_PUBLIC_APP_URL`.
- `ALLOWED_ORIGINS`.
- `PAYPAL_ENV`.
- `AI_PROVIDER`.
- `AI_AUTONOMY_LEVEL`.
- `ENABLE_AI_AGENTS`.
- `ENABLE_ADMIN_AI_PANEL`.
- `ENABLE_AI_LEVEL4_OVERRIDE`.
- Supabase marketplace aliases: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Variables que requieren accion manual

No quedan variables PayPal/Google faltantes para staging. `SUPABASE_DB_URL` esta presente para el guard RLS, pero `npm run test:rls` requiere instalar `psql` localmente o ejecutarlo en un entorno CI que tenga cliente Postgres.

## Matriz final

| Variable | Estado local | Vercel Preview | Accion |
|---|---:|---:|---|
| `EXPO_PUBLIC_API_BASE_URL` | present | present | Confirmar URL preview HTTPS exacta |
| `EXPO_PUBLIC_APP_URL` | present | present | Confirmar URL preview HTTPS exacta |
| `EXPO_PUBLIC_SUPABASE_URL` | present | present | OK |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | present | present | OK |
| `EXPO_PUBLIC_PAYPAL_CLIENT_ID` | present | present | OK |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | present | present | OK |
| `ENVIRONMENT` | present | present | OK |
| `SUPABASE_STAGING_PROJECT_REF` | present | present | OK |
| `SUPABASE_URL` | present | present | OK, staging ref esperado |
| `SUPABASE_ANON_KEY` | present | present | OK |
| `SUPABASE_SERVICE_ROLE_KEY` | present | present | Server-only |
| `SUPABASE_DB_URL` | present | local only | `psql` requerido para `test:rls` |
| `ALLOWED_ORIGINS` | present | present | OK, URL HTTPS Preview exacta |
| `PAYPAL_ENV` | present | present | Debe seguir `sandbox` |
| `PAYPAL_CLIENT_ID` | present | present | Server-side sandbox |
| `PAYPAL_CLIENT_SECRET` | present | present | Server-only/sensitive |
| `PAYPAL_WEBHOOK_ID` | present | present | OK |
| `PAYPAL_MONTHLY_PLAN_ID` | present | present | OK |
| `PAYPAL_YEARLY_PLAN_ID` | present | present | OK |
| `GOOGLE_OAUTH_CLIENT_ID` | present | present | OK |
| `GOOGLE_OAUTH_CLIENT_SECRET` | present | present | Server-only/sensitive |
| `AI_PROVIDER` | present | present | `mock` |
| `AI_GATEWAY_ENABLED` | present | present | `false` |
| `AI_GATEWAY_MODEL` | present | present | `openai/gpt-5.5` |
| `AI_GATEWAY_MAX_OUTPUT_TOKENS` | present | present | `600` |
| `AI_GATEWAY_SMOKE_PROMPT_ENABLED` | present | present | `false` |
| `ENABLE_AI_AGENTS` | present | present | `false` |
| `AI_AUTONOMY_LEVEL` | present | present | `LEVEL_0_READ_ONLY` |
| `ENABLE_ADMIN_AI_PANEL` | present | present | `false` |
| `ENABLE_AI_LEVEL4_OVERRIDE` | present | present | `false` |
| `RLS_NORMAL_EMAIL/PASSWORD` | present | local only | OK para smoke local |
| `RLS_ADMIN_EMAIL/PASSWORD` | present | local only | OK para smoke local |
| `RLS_INTERNAL_EMAIL/PASSWORD` | present | local only | OK para smoke local |

## Checks ejecutados despues de configurar

| Comando | Resultado | Nota |
|---|---:|---|
| `npm run staging:check` | OK | `mode=staging_ready` |
| `npm run lint` | OK | `basic lint passed` |
| `npm run typecheck` | OK | `syntax check passed (136 files)` |
| `npm run test` | OK | `22 passed`, `68 tests` |
| `npm run build` | OK | Build exporta solo variables publicas `EXPO_PUBLIC_*` |
| `npm run production:check` | OK tecnico | `mode=staging_ready` |
| `npm run test:rls` | BLOCKED | `psql` no esta instalado o no esta en `PATH` |

`node scripts/rls-agent-user-smoke.mjs` paso con `rls_validation: PASS`.

## Comandos manuales pendientes

No quedan comandos manuales de variables para PayPal/Google staging.

PayPal sandbox tiene webhook activo en el alias Preview estable con Protection Bypass for Automation configurado en PayPal. La URL debe documentarse siempre redaccionada:

```text
https://codex-akuma424424-akuma424-projects.vercel.app/api/v1/billing/webhooks/paypal?x-vercel-protection-bypass=<REDACTED>
```

Suscripcion sandbox real creada para validacion E2E:

- Subscription ID: `I-BUMBH66SEMAW`.
- Estado pendiente: buyer sandbox debe aprobar manualmente.

Validacion posterior con usuario staging real:

- Subscription ID: `I-G3M126LWGLBW`.
- Evento recibido: `BILLING.SUBSCRIPTION.CREATED`.
- Firma PayPal: verificada.
- HTTP Preview webhook: 202.
- Resultado: delivery externo OK; almacenamiento Supabase queda bloqueado por `PGRST205` en `subscriptions`.
- Reparacion staging aplicada con aprobacion explicita: `scripts/sql/staging-fix-subscriptions-schema.sql`.
- `public.subscriptions` quedo visible por REST/Data API.
- RLS quedo activo en `public.subscriptions`.
- Policies verificadas: `own_subscriptions_read`, `admin_subscriptions_all`, `internal_job_subscriptions_all`.
- PayPal webhook reprobo con suscripcion sandbox `I-F4WJMV10442E`: firma verificada, HTTP 2xx y `subscription_recorded`.

Para ejecutar `npm run test:rls` localmente en Windows, instalar `psql` o agregarlo al `PATH`, y luego repetir:

```powershell
npm run test:rls
```

## Riesgos pendientes

- `npm run test:rls` requiere `psql`; el entorno local actual no lo tiene disponible.
- AI Gateway sigue desactivado y no debe activarse hasta resolver billing/creditos Vercel.
- Vercel Preview tiene Deployment Protection activo. Protection Bypass for Automation esta presente y validado para PayPal Sandbox con query parameter redaccionado.

## Proximo comando exacto

Para que Vercel Preview tome las variables nuevas en runtime:

```powershell
npx vercel deploy --scope akuma424-projects
```

No usar `--prod`. Despues validar:

```text
https://codex-akuma424424-akuma424-projects.vercel.app/api/v1/health
https://codex-akuma424424-akuma424-projects.vercel.app/api/v1/readiness
https://codex-akuma424424-akuma424-projects.vercel.app/api/v1/billing/webhooks/paypal
```

El Preview sigue protegido; usar Protection Bypass for Automation con esta forma redaccionada para PayPal Sandbox:

```text
https://codex-akuma424424-akuma424-projects.vercel.app/api/v1/billing/webhooks/paypal?x-vercel-protection-bypass=<REDACTED>
```

No commitear ni documentar el secreto real.

Validacion de bypass:

- Sin bypass: `GET /api/v1/health` devuelve 401.
- Con bypass: `GET /api/v1/health` devuelve 200.
- Con bypass: `GET /api/v1/readiness` devuelve 200.
- Con bypass: `OPTIONS /api/v1/billing/webhooks/paypal` devuelve 204.

No ejecutar deploy todavia.
