# Staging execution plan

Objetivo: levantar AhorroYA en staging real sin activar produccion, sin PayPal live, sin Level 4 y sin secretos versionados.

## 1. Orden exacto de ejecucion

1. Confirmar rama `codex/production-deploy-ready` y working tree conocido.
2. Ejecutar validacion local: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run production:check`.
3. Crear o seleccionar proyecto Supabase staging.
4. Aplicar migraciones Supabase staging en el orden documentado.
5. Ejecutar scripts SQL de verificacion.
6. Crear usuarios staging: normal, admin e internal_job.
7. Configurar Google OAuth en Google Cloud y Supabase Auth.
8. Crear PayPal REST app sandbox, planes y webhook.
9. Configurar variables en Vercel Preview/Staging.
10. Deploy preview/staging en Vercel.
11. Ejecutar `npm run production:check` con variables staging disponibles.
12. Ejecutar `npm run staging:check`; debe devolver `mode=staging_ready`.
13. Ejecutar smoke tests manuales contra la URL staging.
14. Completar `docs/STAGING_RELEASE_CANDIDATE_REPORT.md`.
15. Mantener produccion en No-Go hasta aprobar `docs/PRODUCTION_GO_NO_GO.md`.

## 2. Variables que el humano debe cargar en Vercel

Publicas:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_APP_URL`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `EXPO_PUBLIC_PREMIUM_PRICE=4.99`
- `EXPO_PUBLIC_PREMIUM_CURRENCY=USD`

Servidor:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYPAL_ENV=sandbox`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_MONTHLY_PLAN_ID`
- `PAYPAL_YEARLY_PLAN_ID`
- `ALLOWED_ORIGINS`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `AI_PROVIDER=mock`
- `AI_AUTONOMY_LEVEL=LEVEL_0_READ_ONLY`
- `ENABLE_AI_AGENTS=false`
- `ENABLE_AGENT_SCHEDULER=false`
- `ENABLE_ADMIN_AI_PANEL=false`
- `ENABLE_AI_LEVEL4_OVERRIDE=false`

No cargar secretos en variables `EXPO_PUBLIC_*`.

## 3. Variables que el humano debe configurar en Supabase

- URL del proyecto staging para `EXPO_PUBLIC_SUPABASE_URL` y `SUPABASE_URL`.
- Anon/publishable key para `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Service role key solo en Vercel server env: `SUPABASE_SERVICE_ROLE_KEY`.
- Google Auth Provider con `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET`.
- Redirect URLs locales y staging.
- Roles en `app_metadata.role`: `admin` e `internal_job`.

## 4. Variables que el humano debe obtener de PayPal

- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`: client id publico sandbox.
- `PAYPAL_CLIENT_ID`: client id servidor sandbox.
- `PAYPAL_CLIENT_SECRET`: secret servidor sandbox.
- `PAYPAL_WEBHOOK_ID`: id del webhook sandbox.
- `PAYPAL_MONTHLY_PLAN_ID`: plan mensual sandbox.
- `PAYPAL_YEARLY_PLAN_ID`: plan anual sandbox.
- `PAYPAL_ENV=sandbox`: no usar `live` en staging.

## 5. Variables que el humano debe obtener de Google Cloud

- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

Configurar authorized origins y redirect URLs para localhost, staging y dominio futuro de produccion.

## 6. Comandos locales

```bash
git status
npm run lint
npm run typecheck
npm test
npm run build
npm run production:check
```

Antes de variables reales es esperado `mode=demo_or_partial`.

## 7. Comandos contra staging

Con variables staging cargadas en el entorno de ejecucion:

```bash
npm run production:check
npm run staging:check
curl -i https://<staging-domain>/api/v1/readiness -H "Origin: https://<staging-domain>"
curl -i https://<staging-domain>/api/v1/health -H "Origin: https://<staging-domain>"
```

En Supabase SQL Editor:

```sql
-- scripts/sql/verify-production-schema.sql
-- scripts/sql/verify-ai-agents-rls.sql
```

## 8. Smoke tests manuales

Ejecutar `docs/STAGING_MANUAL_SMOKE_TESTS.md` completo y guardar evidencia con URL, capturas, request ids o filas verificadas.

## 9. Criterios Go staging

- `npm run staging:check` devuelve exit code 0.
- `production:check` muestra `mode=staging_ready`.
- Supabase migrado y RLS activo.
- Usuario normal bloqueado en tablas de agentes.
- Admin/internal_job autorizados.
- PayPal sandbox compra/cancelacion probadas.
- Google login/logout probados.
- Panel IA bloqueado por defecto; con admin solo dry-run.
- Level 4 bloqueado.
- Smoke tests manuales sin bloqueantes.

## 10. Criterios que bloquean staging

- `mode=demo_or_partial`.
- `PAYPAL_ENV=live`.
- `ENABLE_AI_LEVEL4_OVERRIDE=true`.
- `AI_AUTONOMY_LEVEL=LEVEL_4_CONTROLLED_EXECUTION`.
- `SUPABASE_SERVICE_ROLE_KEY` o cualquier secreto en frontend.
- RLS desactivado o basado en `user_metadata`.
- Usuario normal accede a panel IA o tablas de agentes.
- PayPal sandbox no valida webhook o no actualiza `premium_until`.
- Google Auth no inicia sesion en staging.
