# AhorroYA environment matrix - 2026-05-08

## Principios

- `.env.local` debe contener solo variables publicas para Expo/web.
- `.env.server.local` debe contener secretos locales de servidor/staging.
- `.env.rls` debe contener solo credenciales de smoke RLS staging.
- `.env.vercel.local` es salida de `npx vercel env pull`; no se commitea.
- Vercel Preview debe usar staging/sandbox.
- Vercel Production debe usar production/live solo despues de aprobacion.
- Ningun secreto debe tener prefijo `EXPO_PUBLIC_` o `NEXT_PUBLIC_`.

## Matriz local

| Variable | Archivo esperado | Tipo | Estado actual | Accion |
|---|---|---:|---:|---|
| `EXPO_PUBLIC_API_BASE_URL` | `.env.local` | Publica | Faltante local | Definir URL API preview/staging |
| `EXPO_PUBLIC_APP_URL` | `.env.local` | Publica | Faltante local | Definir URL app preview/staging |
| `EXPO_PUBLIC_SUPABASE_URL` | `.env.local` | Publica | Presente | Confirmar que coincide con staging |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Publica | Presente | Mantener anon/publishable solamente |
| `EXPO_PUBLIC_PAYPAL_CLIENT_ID` | `.env.local` | Publica | Faltante | Usar PayPal sandbox public client id |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | `.env.local` | Publica | Faltante | Usar OAuth client id staging |
| `SUPABASE_URL` | `.env.server.local` | Server secret config | Presente | Confirmar staging |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.server.local` | Secreta | Presente | Server-only, nunca frontend |
| `SUPABASE_DB_URL` | `.env.rls` | Secreta | Faltante | Agregar URL DB staging para `test:rls` |
| `ALLOWED_ORIGINS` | `.env.server.local` | Server config | Faltante | Agregar HTTPS exacto |
| `PAYPAL_ENV` | `.env.server.local` | Server config | Presente seguro | Mantener `sandbox` |
| `PAYPAL_CLIENT_ID` | `.env.server.local` | Secreta | Faltante | Cargar sandbox server-side |
| `PAYPAL_CLIENT_SECRET` | `.env.server.local` | Secreta | Faltante | Cargar sandbox server-side |
| `PAYPAL_WEBHOOK_ID` | `.env.server.local` | Secreta/config | Faltante | Crear webhook sandbox |
| `PAYPAL_MONTHLY_PLAN_ID` | `.env.server.local` | Config | Faltante | Crear plan sandbox mensual |
| `PAYPAL_YEARLY_PLAN_ID` | `.env.server.local` | Config | Faltante | Crear plan sandbox anual |
| `GOOGLE_OAUTH_CLIENT_ID` | `.env.server.local` | Server config | Faltante | Cargar client id staging |
| `GOOGLE_OAUTH_CLIENT_SECRET` | `.env.server.local` | Secreta | Faltante | Cargar secreto staging |
| `AI_PROVIDER` | `.env.server.local` | Server config | Presente seguro | Mantener `mock` |
| `AI_GATEWAY_ENABLED` | `.env.server.local` | Server config | No confirmado | Usar `false` |
| `AI_GATEWAY_MODEL` | `.env.server.local` | Server config | Default codigo | Opcional `openai/gpt-5.5` |
| `ENABLE_AI_AGENTS` | `.env.server.local` | Server config | Presente seguro | Mantener `false` |
| `AI_AUTONOMY_LEVEL` | `.env.server.local` | Server config | Presente seguro | Mantener `LEVEL_0_READ_ONLY` |
| `ENABLE_ADMIN_AI_PANEL` | `.env.server.local` | Server config | Presente seguro | Mantener `false` |
| `ENABLE_AI_LEVEL4_OVERRIDE` | `.env.server.local` | Server config | Presente seguro | Mantener `false` |

## Matriz RLS staging

| Variable | Archivo esperado | Tipo | Estado actual | Accion |
|---|---|---:|---:|---|
| `ENVIRONMENT` | `.env.rls` | Guard | Presente | Debe ser `staging` |
| `SUPABASE_STAGING_PROJECT_REF` | `.env.rls` | Guard | Presente | Debe ser `wzwjjjajmyfwvspxysjb` |
| `SUPABASE_URL` | `.env.rls` | Publica/config | Presente | Debe apuntar a staging |
| `SUPABASE_ANON_KEY` | `.env.rls` | Publica/anon | Presente | No debe ser service role |
| `SUPABASE_DB_URL` | `.env.rls` | Secreta | Faltante | Necesaria para `npm run test:rls` |
| `RLS_NORMAL_EMAIL` | `.env.rls` | Test credential | Presente | Usuario normal staging |
| `RLS_NORMAL_PASSWORD` | `.env.rls` | Test credential | Presente | No imprimir |
| `RLS_ADMIN_EMAIL` | `.env.rls` | Test credential | Presente | Usuario admin staging |
| `RLS_ADMIN_PASSWORD` | `.env.rls` | Test credential | Presente | No imprimir |
| `RLS_INTERNAL_EMAIL` | `.env.rls` | Test credential | Presente | Usuario internal_job staging |
| `RLS_INTERNAL_PASSWORD` | `.env.rls` | Test credential | Presente | No imprimir |

## Vercel Preview

| Variable | Servicio | Tipo | Estado observado | Accion |
|---|---|---:|---:|---|
| `EXPO_PUBLIC_API_BASE_URL` | Vercel Preview | Publica | Vista en branch preview | Confirmar valor HTTPS exacto |
| `EXPO_PUBLIC_APP_URL` | Vercel Preview | Publica | Vista en branch preview | Confirmar valor HTTPS exacto |
| `EXPO_PUBLIC_SUPABASE_URL` | Vercel Preview | Publica | Alias `NEXT_PUBLIC_SUPABASE_URL` visto | Agregar `EXPO_PUBLIC_*` si Expo lo requiere |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Vercel Preview | Publica | Alias `NEXT_PUBLIC_SUPABASE_ANON_KEY` visto | Agregar `EXPO_PUBLIC_*` si Expo lo requiere |
| `EXPO_PUBLIC_PAYPAL_CLIENT_ID` | Vercel Preview | Publica | No visto | Cargar sandbox public id |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Vercel Preview | Publica | No visto | Cargar OAuth staging |
| `SUPABASE_URL` | Vercel Preview | Server | Visto | Confirmar staging project ref |
| `SUPABASE_ANON_KEY` | Vercel Preview | Server/public anon | Visto | Confirmar anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel Preview | Secreta | Visto | Server-only |
| `ALLOWED_ORIGINS` | Vercel Preview | Server config | Visto en branch preview | Confirmar HTTPS exacto |
| `PAYPAL_ENV` | Vercel Preview | Server config | Visto en branch preview | Debe ser `sandbox` |
| `PAYPAL_CLIENT_ID` | Vercel Preview | Secreta | No visto | Cargar sandbox |
| `PAYPAL_CLIENT_SECRET` | Vercel Preview | Secreta | No visto | Cargar sandbox |
| `PAYPAL_WEBHOOK_ID` | Vercel Preview | Secreta/config | No visto | Cargar sandbox webhook |
| `PAYPAL_MONTHLY_PLAN_ID` | Vercel Preview | Config | No visto | Cargar sandbox plan |
| `PAYPAL_YEARLY_PLAN_ID` | Vercel Preview | Config | No visto | Cargar sandbox plan |
| `GOOGLE_OAUTH_CLIENT_ID` | Vercel Preview | Server config | No visto | Cargar staging |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Vercel Preview | Secreta | No visto | Cargar staging |
| `AI_PROVIDER` | Vercel Preview | Server config | Visto | Mantener `mock` |
| `AI_GATEWAY_ENABLED` | Vercel Preview | Server config | No visto | Cargar `false` |
| `AI_GATEWAY_MODEL` | Vercel Preview | Server config | No visto | Cargar `openai/gpt-5.5` |
| `AI_GATEWAY_MAX_OUTPUT_TOKENS` | Vercel Preview | Server config | No visto | Cargar `600` |
| `ENABLE_AI_AGENTS` | Vercel Preview | Server config | Visto | Mantener `false` |
| `AI_AUTONOMY_LEVEL` | Vercel Preview | Server config | Visto | Mantener `LEVEL_0_READ_ONLY` |
| `ENABLE_ADMIN_AI_PANEL` | Vercel Preview | Server config | Visto | Mantener `false` hasta validar admin |
| `ENABLE_AI_LEVEL4_OVERRIDE` | Vercel Preview | Server config | Visto | Mantener `false` |

## Vercel Production

| Variable | Servicio | Tipo | Estado | Accion |
|---|---|---:|---:|---|
| `EXPO_PUBLIC_API_BASE_URL` | Vercel Production | Publica | No validada | Cargar dominio production solo al final |
| `EXPO_PUBLIC_APP_URL` | Vercel Production | Publica | No validada | Cargar dominio production solo al final |
| `EXPO_PUBLIC_SUPABASE_URL` | Vercel Production | Publica | No validada | Usar proyecto Supabase production separado |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Vercel Production | Publica | No validada | Usar anon production |
| `EXPO_PUBLIC_PAYPAL_CLIENT_ID` | Vercel Production | Publica | No validada | Usar PayPal live solo en production |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Vercel Production | Publica | No validada | Usar OAuth production |
| `SUPABASE_URL` | Vercel Production | Server | Visto por nombre | Confirmar production ref antes de go-live |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel Production | Secreta | Visto por nombre | Server-only |
| `ALLOWED_ORIGINS` | Vercel Production | Server config | No confirmado | Dominio production HTTPS exacto |
| `PAYPAL_ENV` | Vercel Production | Server config | No confirmado | `live` solo en production |
| `PAYPAL_CLIENT_ID` | Vercel Production | Secreta | No validada | Live credential |
| `PAYPAL_CLIENT_SECRET` | Vercel Production | Secreta | No validada | Live credential |
| `PAYPAL_WEBHOOK_ID` | Vercel Production | Secreta/config | No validada | Live webhook |
| `GOOGLE_OAUTH_CLIENT_ID` | Vercel Production | Server config | No validada | OAuth production |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Vercel Production | Secreta | No validada | OAuth production |
| `AI_PROVIDER` | Vercel Production | Server config | No validada | Inicialmente `mock` |
| `ENABLE_AI_AGENTS` | Vercel Production | Server config | No validada | Inicialmente `false` |
| `ENABLE_ADMIN_AI_PANEL` | Vercel Production | Server config | No validada | Inicialmente `false` |
| `ENABLE_AI_LEVEL4_OVERRIDE` | Vercel Production | Server config | No validada | Siempre `false` para launch inicial |

## Donde obtener cada tipo de variable

| Grupo | Fuente |
|---|---|
| Supabase public | Dashboard Supabase staging, API settings |
| Supabase service role | Dashboard Supabase staging, server-only |
| Supabase DB URL | Dashboard Supabase staging, connection string, solo `.env.rls`/CI protegido |
| PayPal sandbox | PayPal Developer Dashboard, sandbox app/plans/webhooks |
| Google OAuth staging | Google Cloud Console, OAuth client con dominios preview/staging |
| Vercel Preview | Dashboard Vercel proyecto `codex` o `npx vercel env add ... preview --scope akuma424-projects` |
| AI Gateway | Vercel env pull/OIDC; requiere billing/creditos habilitados |

## Checks asociados

```powershell
npm run staging:check
node scripts/rls-agent-user-smoke.mjs
npm run test:rls
npm run build
```

No ejecutar `npm run test:rls` si `.env.rls` no apunta inequivocamente a staging. No ejecutar deploy production desde este estado.
