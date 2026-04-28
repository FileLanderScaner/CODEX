# AhorroYA en Vercel

Este proyecto ya queda preparado para desplegar la version web exportada de Expo en Vercel.

## Configuracion incluida

- `npm run build` ejecuta `npx expo export --platform web`.
- `vercel.json` publica `dist`.
- Rewrites configurados para SPA.
- Cache largo para assets de Expo.

## Deploy manual

```powershell
cd C:\codex
npm.cmd run build
npx.cmd vercel link --yes --project project-6vgnm --scope akuma424-projects
npx.cmd vercel deploy --prod --yes
```

Si la CLI pide login:

```powershell
npx.cmd vercel login
```

Luego repetir:

```powershell
npx.cmd vercel deploy --prod --yes
```

## Variables opcionales

El MVP actual funciona sin variables cloud. Para activar Supabase, agregar:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_APP_URL
```

Para habilitar escrituras cloud (serverless) y Premium PayPal, estas variables deben existir solo en Vercel (Server):

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ALLOWED_ORIGINS

PAYPAL_ENV
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_WEBHOOK_ID
PAYPAL_MONTHLY_PLAN_ID
PAYPAL_YEARLY_PLAN_ID

UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## Seguridad HTTP

`vercel.json` aplica CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy` y `Permissions-Policy`. La CSP permite Supabase, PayPal y Upstash como destinos controlados.
