# AhorroYA con Supabase

Supabase ya funciona como backend cloud para precios, eventos, usuarios, alertas y monetizacion. La app conserva fallback local si algo falla.

## Conectado

- `prices`: precios comunitarios.
- `shares`: eventos de viralidad.
- `reports`: reportes de precios incorrectos.
- `profiles`: usuarios logueados por OAuth.
- `user_favorites`: favoritos cloud.
- `price_alerts`: alertas cloud.
- `product_links`: links comerciales recomendados.
- `product_clicks`: clicks comerciales.
- `monetization_events`: clicks Premium y eventos de negocio.
- `premium_orders`: ordenes PayPal completadas.

## Auth social

En Supabase > Authentication > Providers activar:

- Google
- Facebook

Agregar redirect/callback:

```text
https://project-6vgnm.vercel.app
```

## Variables Vercel

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_APP_URL
EXPO_PUBLIC_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_ENV
PAYPAL_WEBHOOK_ID
ALLOWED_ORIGINS
```

## Seguridad

- Lectura publica solo de precios aprobados y links activos.
- Escrituras criticas pasan por Vercel Serverless con service role.
- Favoritos/alertas/perfil requieren usuario autenticado.
- Service role nunca se expone en `EXPO_PUBLIC_*`.

## SQL

Ejecutar:

```text
supabase-price-schema.sql
```

Notas:
- `profiles.plan` + `profiles.premium_until` guardan el entitlement Premium.
- `premium_orders` guarda las compras PayPal (idempotente por `provider_order_id`).
