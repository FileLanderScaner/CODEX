# Vercel autonomy audit

Fecha: 2026-05-03.

## Objetivo

Agregar solo variables no secretas y flags seguros para staging sin hacer deploy, sin tocar produccion y sin cargar secretos.

## Acciones ejecutadas

- Se uso Vercel CLI autenticado contra el proyecto linkeado `codex`.
- Se intento agregar variables seguras a `preview` y `development`.
- `development` quedo con variables seguras agregadas.
- `preview` no se modifico porque Vercel CLI pidio resolver el alcance de Git branch para Preview.
- `production` no fue tocado.
- No se ejecuto deploy.
- No se ejecuto `vercel env pull`.
- No se imprimieron valores.
- No se cargaron secretos.

## Variables agregadas en development

- `AI_PROVIDER`
- `AI_AUTONOMY_LEVEL`
- `ENABLE_AI_AGENTS`
- `ENABLE_AGENT_SCHEDULER`
- `ENABLE_ADMIN_AI_PANEL`
- `ENABLE_AI_LEVEL4_OVERRIDE`
- `PAYPAL_ENV`
- `EXPO_PUBLIC_PREMIUM_PRICE`
- `EXPO_PUBLIC_PREMIUM_CURRENCY`

Valores configurados segun politica segura:

- IA mock/read-only/off.
- Panel IA off.
- Scheduler off.
- Level 4 override off.
- PayPal sandbox.
- Precio/currency publicos de premium.

## Preview bloqueado

Al intentar cargar las mismas variables en `preview`, Vercel CLI devolvio `action_required` con `reason=git_branch_required`.

Decision tomada:

- No continuar automaticamente.
- No elegir rama sin confirmacion humana.
- No usar `--force`.
- No tocar production.

Confirmacion requerida:

- Opcion A: agregar a todas las Preview branches.
- Opcion B: agregar solo a la rama `codex/production-deploy-ready`.

## Variables pendientes para preview

- `AI_PROVIDER`
- `AI_AUTONOMY_LEVEL`
- `ENABLE_AI_AGENTS`
- `ENABLE_AGENT_SCHEDULER`
- `ENABLE_ADMIN_AI_PANEL`
- `ENABLE_AI_LEVEL4_OVERRIDE`
- `PAYPAL_ENV`
- `EXPO_PUBLIC_PREMIUM_PRICE`
- `EXPO_PUBLIC_PREMIUM_CURRENCY`

## Variables pendientes que requieren valor real externo

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_APP_URL`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_MONTHLY_PLAN_ID`
- `PAYPAL_YEARLY_PLAN_ID`
- `ALLOWED_ORIGINS`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

## Seguridad

- No se cargo `SUPABASE_SERVICE_ROLE_KEY`.
- No se cargo `PAYPAL_CLIENT_SECRET`.
- No se cargo `GOOGLE_OAUTH_CLIENT_SECRET`.
- No se cargo `OPENAI_API_KEY`.
- No se cargo `GEMINI_API_KEY`.
- No se cargo `TWILIO_AUTH_TOKEN`.
- No se cargo `POSTGRES_PASSWORD`.
- No se activo `PAYPAL_ENV=live`.
- No se activo `ENABLE_AI_LEVEL4_OVERRIDE=true`.
- No se uso `AI_AUTONOMY_LEVEL=LEVEL_4_CONTROLLED_EXECUTION`.
- No se modificaron variables Supabase/Postgres existentes.

## Riesgos

- `development` tiene flags seguros, pero `preview` aun no.
- `staging:check` debe seguir fallando hasta configurar Preview/Staging completo.
- Si se decide cargar variables en todas las Preview branches, cualquier preview del proyecto recibira esos flags seguros.
- Si se decide cargar solo en rama, hay que usar exactamente la rama aprobada.

## Go/No-Go

- Local: Go.
- Development Vercel: parcial, flags seguros agregados.
- Preview/Staging Vercel: No-Go hasta confirmar alcance de rama y cargar variables.
- Production: No-Go, no tocado.

## Actualizacion Preview branch-specific

Fecha: 2026-05-03.

Ronald aprobo usar exclusivamente la rama `codex/production-deploy-ready` para Preview.

Variables no secretas y flags seguros cargados en Preview para branch `codex/production-deploy-ready`:

- `AI_PROVIDER`
- `AI_AUTONOMY_LEVEL`
- `ENABLE_AI_AGENTS`
- `ENABLE_AGENT_SCHEDULER`
- `ENABLE_ADMIN_AI_PANEL`
- `ENABLE_AI_LEVEL4_OVERRIDE`
- `PAYPAL_ENV`
- `EXPO_PUBLIC_PREMIUM_PRICE`
- `EXPO_PUBLIC_PREMIUM_CURRENCY`

Verificacion segura de nombres:

- `vercel env ls preview --format json` muestra esas variables en Preview.
- Solo se imprimieron nombres.
- No se imprimieron valores.
- No se uso `vercel env pull`.
- No se hizo deploy.
- No se toco production.
- No se cargaron secretos.
- No se modificaron variables Supabase/Postgres existentes.

Variables con valores reales que siguen pendientes:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_APP_URL`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_MONTHLY_PLAN_ID`
- `PAYPAL_YEARLY_PLAN_ID`
- `ALLOWED_ORIGINS`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

Estado actualizado:

- Development Vercel: flags seguros cargados.
- Preview branch `codex/production-deploy-ready`: flags seguros cargados.
- Production: No-Go, no tocado.
- Staging: sigue No-Go hasta cargar URLs, PayPal sandbox real, Google Auth y `ALLOWED_ORIGINS`.

## Preview deployment audit

Fecha: 2026-05-03.

Comando ejecutado:

```bash
vercel deploy --yes --no-color --non-interactive
```

Resultado:

- Deploy preview creado correctamente.
- No se uso `--prod`.
- No se modificaron variables remotas.
- No se tocaron secretos.
- No se toco production.

URLs:

- Inspect: `https://vercel.com/akuma424-projects/codex/5kShtPEdGzyVurNy37rvMtLve2QJ`
- Preview: `https://codex-2bidx8wly-akuma424-projects.vercel.app`

Build remoto:

- Vercel build ejecuto `npm run build`.
- Expo export web completo.
- Deployment completed.

Smoke HTTP con `curl.exe`:

- `GET /api/v1/health`: `401 Unauthorized`.
- `GET /api/v1/readiness`: `401 Unauthorized`.

Causa:

- Vercel Deployment Protection requiere autenticacion para acceder al preview.
- La respuesta fue la pagina `Authentication Required` de Vercel, no una respuesta de la API de AhorroYA.

Estado:

- Preview deploy: creado.
- Smoke publico: bloqueado por proteccion de Vercel.
- Staging real: sigue No-Go hasta habilitar acceso seguro al preview y configurar variables reales.

Proximo paso seguro:

- Definir si Ronald quiere validar con sesion autenticada de Vercel, `vercel curl`, o bypass token de Deployment Protection.
- No desactivar proteccion ni publicar production para resolver este smoke.

## Preview URL/CORS variables

Fecha: 2026-05-03.

Ronald aprobo cargar variables no secretas de URL/CORS en Preview branch-specific para `codex/production-deploy-ready`.

Variables agregadas:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_APP_URL`
- `ALLOWED_ORIGINS`

Alcance:

- Environment: `preview`.
- Git branch: `codex/production-deploy-ready`.
- No se uso `--prod`.
- No se hizo deploy.
- No se tocaron variables remotas de production.
- No se cargaron secretos.
- No se modificaron variables Supabase/Postgres existentes.

Comandos usados:

```powershell
"https://codex-2bidx8wly-akuma424-projects.vercel.app" | vercel env add EXPO_PUBLIC_API_BASE_URL preview codex/production-deploy-ready
"https://codex-2bidx8wly-akuma424-projects.vercel.app" | vercel env add EXPO_PUBLIC_APP_URL preview codex/production-deploy-ready
"https://codex-2bidx8wly-akuma424-projects.vercel.app,http://localhost:8081" | vercel env add ALLOWED_ORIGINS preview codex/production-deploy-ready
```

Verificacion segura de nombres:

`vercel env ls preview codex/production-deploy-ready --format json` mostro:

- `ALLOWED_ORIGINS`
- `EXPO_PUBLIC_APP_URL`
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_PREMIUM_CURRENCY`
- `EXPO_PUBLIC_PREMIUM_PRICE`
- `PAYPAL_ENV`
- `ENABLE_AI_LEVEL4_OVERRIDE`
- `ENABLE_ADMIN_AI_PANEL`
- `ENABLE_AGENT_SCHEDULER`
- `ENABLE_AI_AGENTS`
- `AI_AUTONOMY_LEVEL`
- `AI_PROVIDER`

Checks locales:

- `npm run production:check`: OK, `mode=demo_or_partial`.
- `npm run staging:check`: FAIL esperado, `mode=demo_or_partial`.

Nota: los checks locales no leen automaticamente variables remotas de Vercel; siguen mostrando faltantes hasta que esas variables esten disponibles en el entorno local o se valide contra un nuevo deployment Preview.

Pendientes:

- Nuevo deploy preview para que estas env vars apliquen al build/deployment.
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_MONTHLY_PLAN_ID`
- `PAYPAL_YEARLY_PLAN_ID`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

## Preview redeploy after URL/CORS env

Fecha: 2026-05-03.

Comando ejecutado:

```bash
vercel deploy --yes --no-color --non-interactive
```

Resultado:

- Nuevo deploy preview creado correctamente.
- No se uso `--prod`.
- No se tocaron variables remotas.
- No se cargaron secretos.
- No se toco production.

URLs:

- Inspect: `https://vercel.com/akuma424-projects/codex/EffrTRcPgV6Zoh3uL4QMjDhus4Ri`
- Preview: `https://codex-75aq3h1gx-akuma424-projects.vercel.app`

Build remoto:

- Vercel build ejecuto `npm run build`.
- Expo export web completo.
- Deployment completed.

Smoke HTTP con `curl.exe`:

- `GET /api/v1/health`: `401 Unauthorized`.
- `GET /api/v1/readiness`: `401 Unauthorized`.

Causa:

- Vercel Deployment Protection sigue activo.
- La respuesta fue la pagina `Authentication Required` de Vercel, no la API de AhorroYA.

Checks posteriores:

- `npm run production:check`: OK, `mode=demo_or_partial`.
- `npm run staging:check`: FAIL esperado, `mode=demo_or_partial`.

Nota:

- Los checks locales no leen automaticamente variables remotas de Vercel.
- Staging sigue bloqueado por PayPal sandbox real, Google Auth, validacion Supabase/RLS y metodo de acceso al preview protegido.
