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

## Vercel protected preview access audit

Fecha: 2026-05-03.

Objetivo:

- Determinar metodo seguro para validar el preview protegido sin desactivar Deployment Protection, sin tocar production y sin exponer secretos.

Comandos consultados:

```bash
vercel --help
vercel curl --help
```

Resultado:

- `vercel curl` existe en Vercel CLI 53.1.0.
- Sintaxis soportada:
  - `vercel curl /api/status --deployment <deployment-url>`
  - `vercel curl /api/protected --protection-bypass <secret> -- --request GET`

Prueba ejecutada:

```bash
vercel curl /api/v1/health --deployment https://codex-75aq3h1gx-akuma424-projects.vercel.app --no-color --non-interactive
vercel curl /api/v1/readiness --deployment https://codex-75aq3h1gx-akuma424-projects.vercel.app --no-color --non-interactive
```

Resultado observado:

- La CLI indico que el deployment requiere bypass token.
- La CLI genero automaticamente un Deployment Protection bypass token para el proyecto.
- No se imprimio el token.
- No se imprimieron secretos.
- No se desactivo Deployment Protection.
- No se modificaron variables.
- No se hizo deploy.
- No se toco production.

Control aplicado:

- Se detuvieron nuevas pruebas con `vercel curl` porque la generacion automatica de bypass token requiere aprobacion explicita de Ronald para continuar como metodo operativo.

Estado de health/readiness:

- No queda una validacion concluyente documentada de respuesta JSON de `/api/v1/health` o `/api/v1/readiness`.
- El comando transfirio una respuesta pequena, pero la salida capturada no mostro el cuerpo JSON de la API.

Metodo recomendado:

1. Confirmar si Ronald aprueba usar `vercel curl` aun cuando genere/gestione bypass automaticamente.
2. Alternativa: abrir preview en navegador con sesion Vercel.
3. Alternativa: crear bypass token manualmente por Ronald y pasarlo de forma segura sin imprimirlo.
4. Mantener Deployment Protection activo.

## Protected smoke with Ronald approval

Fecha: 2026-05-03.

Ronald aprobo explicitamente usar `vercel curl` como metodo de smoke protegido para la preview:

```text
https://codex-75aq3h1gx-akuma424-projects.vercel.app
```

Endpoints aprobados:

- `/api/v1/health`
- `/api/v1/readiness`

Comandos ejecutados:

```bash
vercel curl /api/v1/health --deployment https://codex-75aq3h1gx-akuma424-projects.vercel.app --no-color --non-interactive
vercel curl /api/v1/readiness --deployment https://codex-75aq3h1gx-akuma424-projects.vercel.app --no-color --non-interactive
```

Resultado seguro:

- `/api/v1/health`: API alcanzada por `vercel curl`, respuesta no JSON, error `FUNCTION_INVOCATION_FAILED`, request id Vercel `gru1::q8kn4-1777786187299-2d5dd399ca25`.
- `/api/v1/readiness`: API alcanzada por `vercel curl`, respuesta no JSON, error `FUNCTION_INVOCATION_FAILED`, request id Vercel `gru1::v78wv-1777786197615-be70c15a5297`.

Status code:

- No confirmado por `vercel curl` porque el comando no imprimio headers HTTP.
- La respuesta corresponde a error de funcion de Vercel; tratar como fallo server-side de preview hasta revisar logs.

Controles:

- No se imprimio bypass token.
- No se guardo bypass token.
- No se copio token a docs.
- No se desactivo Deployment Protection.
- No se toco production.
- No se hizo deploy.
- No se modificaron variables.
- No se cargaron secretos.
- No se probaron endpoints sensibles, pagos ni IA admin.

Proximo paso recomendado:

- Revisar logs de la deployment/function en Vercel para los request ids anteriores.
- No cambiar production.
- No desactivar protection.
- No avanzar a Go staging hasta corregir `FUNCTION_INVOCATION_FAILED`.

## Function invocation debug and corrected preview

Fecha: 2026-05-03.

Objetivo:

- Diagnosticar y corregir el `FUNCTION_INVOCATION_FAILED` en el preview protegido sin tocar production, sin modificar variables remotas y sin exponer secretos.

Logs Vercel revisados:

- Request health: `gru1::q8kn4-1777786187299-2d5dd399ca25`.
- Request readiness: `gru1::v78wv-1777786197615-be70c15a5297`.

Causa raiz confirmada:

```text
ERR_MODULE_NOT_FOUND: Cannot find module '/var/task/lib/config' imported from /var/task/services/catalog-service.js
```

Impacto:

- `api/[...path].js` importa el router completo.
- El import roto en `services/catalog-service.js` rompia la inicializacion de la Function.
- Por eso fallaban tambien endpoints simples como `/api/v1/health` y `/api/v1/readiness`.

Patch aplicado:

- Se agrego extension `.js` a imports relativos ESM en servicios y librerias usadas por la API serverless.
- No se modifico logica funcional.
- No se modificaron variables remotas.
- No se tocaron secretos.

Validaciones locales:

```text
npm run lint -> OK, basic lint passed
npm run typecheck -> OK, syntax check passed (134 files)
npm test -> OK, 20 files / 59 tests
npm run build -> OK, Expo export web completo
```

Deploy preview corregido:

```text
Comando: vercel deploy --yes --no-color --non-interactive
Preview: https://codex-xpel3o047-akuma424-projects.vercel.app
Inspect: https://vercel.com/akuma424-projects/codex/Hr4vhSZvQ9s7omjdpnzrUZJ19m42
```

No se uso `--prod`.

Smoke protegido con `vercel curl`:

```text
/api/v1/health -> JSON OK, status=ok, service=ahorroya-api
/api/v1/readiness -> JSON OK, status=degraded, mode=demo_or_partial
```

Readiness checks no sensibles observados:

- `supabase_server=ready`
- `supabase_public=ready`
- `paypal=demo_or_missing_config`
- `google_auth=fallback_demo`
- `allowed_origins=configured`
- `rate_limit=memory_fallback`
- `local_fallback=enabled`
- `tracking=supabase_with_local_fallback`

Controles:

- Deployment Protection sigue activo.
- No se imprimio bypass token.
- No se guardo bypass token.
- No se desactivo Deployment Protection.
- No se toco production.
- No se modificaron variables remotas.
- No se cargaron secretos.
- No se probaron endpoints sensibles, pagos ni IA admin.

Estado:

- Health/readiness corregidos para preview protegido.
- Staging sigue Go condicionado, no Go final.
- Produccion sigue No-Go.

Pendientes:

- PayPal sandbox real.
- Google Auth real.
- Supabase staging/RLS con usuarios reales.
- `npm run staging:check` debe llegar a `mode=staging_ready`.
