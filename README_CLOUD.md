# AhorroYA Cloud Architecture

Esta guia deja la arquitectura del proyecto unificada alrededor de `Expo + Vercel + Supabase + PayPal`.

## Stack activo

- `Expo / React Native Web` para la app.
- `Vercel` para publicar la web exportada y correr `api/*`.
- `Supabase` para auth, perfiles, precios, favoritos, alertas y eventos.
- `PayPal` para Premium.
- `AsyncStorage + mock data` como fallback local para desarrollo y resiliencia.

## Principio de arquitectura

La app debe funcionar incluso sin cloud completo:

- Si existe configuracion de Supabase, usa backend real.
- Si no existe, mantiene experiencia local con datos mock y almacenamiento local.
- Las escrituras sensibles pasan por `api/*` en Vercel usando `SUPABASE_SERVICE_ROLE_KEY`.

## Flujo unificado

1. El cliente Expo consulta datos publicos en Supabase y usa fallback local si falta configuracion.
2. Las acciones con escritura o privilegios pasan por Vercel Serverless.
3. Las APIs validan sesion de Supabase cuando corresponde.
4. PayPal confirma compras y Vercel actualiza el entitlement Premium en Supabase.

## Variables de entorno

Cliente:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_APP_URL
EXPO_PUBLIC_PAYPAL_CLIENT_ID
EXPO_PUBLIC_PREMIUM_PRICE
EXPO_PUBLIC_PREMIUM_CURRENCY
```

Servidor:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PAYPAL_ENV
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_WEBHOOK_ID
ALLOWED_ORIGINS
```

## Fuentes de datos

- Precios reales: `/api/v1/prices` conectado a Supabase; sin fallback mock local.
- `services/supabase-price-service.js`: lectura y escritura cloud de precios.
- `services/account-service.js`: sesion, perfil, favoritos y alertas.
- `api/*.js`: capa segura para escrituras, monetizacion y perfil.

## Deploy

Web:

```powershell
npm.cmd run build
npx.cmd vercel deploy --prod --yes
```

Base de datos:

```text
supabase-price-schema.sql
```

## Decision de unificacion

Este repo ya no depende de Firebase. La arquitectura oficial del proyecto queda concentrada en Supabase como backend cloud y Vercel como capa de despliegue y APIs.
