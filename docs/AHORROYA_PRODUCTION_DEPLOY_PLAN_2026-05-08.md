# AhorroYA production deploy plan - 2026-05-08

## Estado actual

Estado actual: `demo_or_partial`.

Objetivo inmediato: pasar a `staging_release_candidate` sin tocar produccion.

Objetivo posterior: pasar a `production_ready` solo despues de staging validado, preview operativo, RLS confirmado, PayPal sandbox confirmado, Google OAuth staging confirmado y aprobacion humana explicita.

## Reglas de seguridad

- No tocar produccion.
- No ejecutar `npx vercel --prod`.
- No aplicar migraciones Supabase remotas sin confirmacion explicita.
- No usar credenciales de produccion en local/staging.
- No imprimir secretos.
- No commitear `.env`.
- No activar agentes IA autonomos.
- Mantener `AI_PROVIDER=mock` por defecto.
- Mantener `ENABLE_AI_AGENTS=false`.
- Mantener `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY`.
- Mantener `ENABLE_ADMIN_AI_PANEL=false`.
- Mantener `ENABLE_AI_LEVEL4_OVERRIDE=false`.
- Mantener `PAYPAL_ENV=sandbox` hasta produccion real.

## Plan demo_or_partial -> staging_release_candidate

### 1. Completar `.env.server.local`

Agregar solo valores de staging/sandbox:

- `ENVIRONMENT=staging`.
- `SUPABASE_STAGING_PROJECT_REF=wzwjjjajmyfwvspxysjb`.
- `SUPABASE_URL`.
- `SUPABASE_SERVICE_ROLE_KEY`.
- `ALLOWED_ORIGINS` con URL HTTPS exacta de preview/staging.
- `PAYPAL_ENV=sandbox`.
- `PAYPAL_CLIENT_ID`.
- `PAYPAL_CLIENT_SECRET`.
- `PAYPAL_WEBHOOK_ID`.
- `PAYPAL_MONTHLY_PLAN_ID`.
- `PAYPAL_YEARLY_PLAN_ID`.
- `GOOGLE_OAUTH_CLIENT_ID`.
- `GOOGLE_OAUTH_CLIENT_SECRET`.
- `AI_PROVIDER=mock`.
- `AI_GATEWAY_ENABLED=false`.
- `AI_GATEWAY_MODEL=openai/gpt-5.5`.
- `AI_GATEWAY_MAX_OUTPUT_TOKENS=600`.
- `ENABLE_AI_AGENTS=false`.
- `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY`.
- `ENABLE_ADMIN_AI_PANEL=false`.
- `ENABLE_AI_LEVEL4_OVERRIDE=false`.

### 2. Completar `.env.local`

Mantener solo variables publicas:

- `EXPO_PUBLIC_API_BASE_URL`.
- `EXPO_PUBLIC_APP_URL`.
- `EXPO_PUBLIC_SUPABASE_URL`.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`.
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.

Accion critica: remover de `.env.local` cualquier variable server-side como `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_SECRET`, `POSTGRES_*`, `SUPABASE_JWT_SECRET`, tokens o passwords. Esos valores deben quedar en `.env.server.local` o Vercel server env.

### 3. Completar `.env.rls`

Debe apuntar inequivocamente a staging:

- `ENVIRONMENT=staging`.
- `SUPABASE_STAGING_PROJECT_REF=wzwjjjajmyfwvspxysjb`.
- `SUPABASE_URL=https://wzwjjjajmyfwvspxysjb.supabase.co`.
- `SUPABASE_ANON_KEY`.
- `SUPABASE_DB_URL` si se va a ejecutar `npm run test:rls`.
- `RLS_NORMAL_EMAIL`.
- `RLS_NORMAL_PASSWORD`.
- `RLS_ADMIN_EMAIL`.
- `RLS_ADMIN_PASSWORD`.
- `RLS_INTERNAL_EMAIL`.
- `RLS_INTERNAL_PASSWORD`.

### 4. Confirmar Supabase staging

Validaciones obligatorias:

- `SUPABASE_URL` host contiene `wzwjjjajmyfwvspxysjb.supabase.co`.
- `EXPO_PUBLIC_SUPABASE_URL` coincide con `SUPABASE_URL`.
- `SUPABASE_DB_URL` apunta al mismo project ref si existe.
- `.env.rls` no contiene marcadores `prod`, `production` o hosts ajenos.
- La anon key no parece service role.

### 5. Ejecutar checks locales staging

```powershell
npm run staging:check
```

Criterio pass:

- `mode=staging_ready`.
- `supabase_public=ready`.
- `supabase_server=ready`.
- `paypal=ready`.
- `google_auth=ready`.
- `allowed_origins=ready`.
- `ai_safe_defaults=ready`.
- `missing_public=none`.
- `missing_staging=none`.

### 6. Ejecutar smoke RLS

```powershell
node scripts/rls-agent-user-smoke.mjs
```

Criterio pass:

- normal: login OK.
- normal: `insert agent_logs` bloqueado 403.
- admin: `insert agent_logs` permitido.
- internal_job: `insert agent_logs` permitido.
- `rls_validation: PASS`.

### 7. Ejecutar test SQL RLS

Solo si `SUPABASE_DB_URL` staging esta presente:

```powershell
npm run test:rls
```

Criterio pass:

- El script no bloquea por `SUPABASE_DB_URL`.
- El project ref coincide con `SUPABASE_STAGING_PROJECT_REF`.
- `psql` ejecuta `tests/rls/rls-policies.sql` sin errores.

### 8. Ejecutar build y suite local

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

Criterio pass:

- Todos los comandos exit code 0.
- Build no requiere secretos publicos.
- No aparecen valores secretos en logs.

### 9. Cargar variables Preview en Vercel

No usar produccion. Usar entorno Preview y scope correcto:

```powershell
npx vercel env ls --scope akuma424-projects
```

Luego cargar faltantes con `npx vercel env add <VARIABLE> preview --scope akuma424-projects` o por dashboard.

Variables Preview minimas:

- Publicas: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_APP_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_PAYPAL_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.
- Server-only: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`, `PAYPAL_ENV`, PayPal sandbox, Google OAuth staging.
- IA segura: `AI_PROVIDER=mock`, `AI_GATEWAY_ENABLED=false`, `ENABLE_AI_AGENTS=false`, `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY`, `ENABLE_ADMIN_AI_PANEL=false`, `ENABLE_AI_LEVEL4_OVERRIDE=false`.

### 10. Deploy Preview

Solo despues de que staging local pase:

```powershell
npx vercel deploy --scope akuma424-projects
```

No usar `--prod`.

### 11. Validar Preview

Probar:

- `/api/v1/health`.
- `/api/v1/readiness`.
- `/api/v1/ai/agents` con panel deshabilitado debe bloquear.
- `/api/v1/ai/agents` con panel habilitado solo en staging debe requerir admin.
- PayPal sandbox create/capture order.
- Google OAuth staging callback.

### 12. Crear release candidate

Solo si todo pasa:

- Crear tag o rama `staging_release_candidate`.
- Adjuntar salida de checks.
- Congelar cambios no relacionados.

## Plan staging_release_candidate -> production_ready

### 1. Preparar variables Production

Definir en Vercel Production, no en repo:

- `EXPO_PUBLIC_API_BASE_URL` con dominio production.
- `EXPO_PUBLIC_APP_URL` con dominio production.
- `EXPO_PUBLIC_SUPABASE_URL` de production.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` de production.
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID` live.
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` production.
- `SUPABASE_URL` production.
- `SUPABASE_SERVICE_ROLE_KEY` production.
- `ALLOWED_ORIGINS` production exacto HTTPS.
- `PAYPAL_ENV=live`.
- PayPal live credentials y plans.
- Google OAuth production.
- IA inicial: `AI_PROVIDER=mock`, `ENABLE_AI_AGENTS=false`, `ENABLE_ADMIN_AI_PANEL=false`, `ENABLE_AI_LEVEL4_OVERRIDE=false`.

### 2. Revisar workflows

Obligatorio antes de production:

- Branch protection en `main`.
- Requerir PR y checks verdes.
- Requerir aprobacion manual para environment `production`.
- Separar workflow de Supabase staging de production.
- No permitir `supabase db push` production automatico desde cualquier push.

### 3. Ejecutar production checks sin deploy

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run production:check
```

Criterio pass:

- `production:check` debe estar en `production_ready` solo cuando variables production reales esten cargadas en el entorno de validacion.

## Deploy production

Solo con aprobacion explicita posterior:

```powershell
npx vercel --prod --scope akuma424-projects
```

Este comando queda como plan. No fue ejecutado.

## Rollback

Rollback de aplicacion:

1. Identificar ultimo deployment estable en Vercel.
2. Promover deployment anterior desde dashboard o CLI.
3. Mantener `ENABLE_AI_AGENTS=false`.
4. Mantener `ENABLE_ADMIN_AI_PANEL=false`.
5. Mantener `AI_PROVIDER=mock`.

Rollback IA Gateway:

1. Setear `AI_GATEWAY_ENABLED=false`.
2. Setear `AI_PROVIDER=mock`.
3. Remover o ignorar `AI_GATEWAY_MODEL`.
4. Si se revierte dependencia: `npm uninstall ai`.

Rollback Supabase:

- No hay rollback automatico seguro para migraciones remotas.
- Antes de migraciones production debe existir backup, plan de revert SQL y ventana aprobada.
- No aplicar migraciones production desde este estado.

## Checklist Go/No-Go production

Production es `GO` solo si todo esto esta completo:

- `npm run lint` OK.
- `npm run typecheck` OK.
- `npm run test` OK.
- `npm run build` OK.
- `npm run staging:check` OK.
- RLS smoke OK.
- `npm run test:rls` OK.
- Vercel Preview OK.
- `/api/v1/readiness` preview OK.
- Supabase staging separado de production OK.
- PayPal sandbox OK.
- Google OAuth staging OK.
- Variables production cargadas en Vercel OK.
- `PAYPAL_ENV=live` solo en production.
- `ALLOWED_ORIGINS` production con dominio real HTTPS.
- Agentes IA desactivados en production inicial.
- Panel admin IA desactivado en production inicial.
- Sin secretos en repo.
- Workflows revisados.
- Rollback definido.
- Aprobacion humana explicita.

Si falta un punto: `NO-GO_PRODUCTION`.

## Proximo paso exacto

Cargar las variables faltantes de staging/sandbox y ejecutar:

```powershell
npm run staging:check
```

No avanzar a deploy preview hasta que ese comando pase.
