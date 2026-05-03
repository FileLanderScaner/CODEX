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
