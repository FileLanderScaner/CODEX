# AhorroYA Produccion

Esta guia deja AhorroYA listo para operar en dos modos:

- **Demo**: sin credenciales, usa AsyncStorage, seed local, premium demo y links oficiales.
- **Produccion**: con Supabase, PayPal, tracking en backend y deploy Vercel.

## Variables publicas

Estas variables pueden estar en Expo/Vercel porque son publicas:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
EXPO_PUBLIC_API_BASE_URL=https://<deployment>.vercel.app
EXPO_PUBLIC_APP_URL=https://<deployment>.vercel.app
EXPO_PUBLIC_PAYPAL_CLIENT_ID=<paypal-client-id>
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-client-id>
EXPO_PUBLIC_PREMIUM_PRICE=4.99
EXPO_PUBLIC_PREMIUM_CURRENCY=USD
```

Tambien se aceptan aliases `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID` y `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Variables privadas de backend

No usar estas variables en frontend ni en `EXPO_PUBLIC_*`:

```bash
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
PAYPAL_ENV=sandbox # o live
PAYPAL_CLIENT_ID=<paypal-server-client-id>
PAYPAL_CLIENT_SECRET=<paypal-server-client-secret>
PAYPAL_WEBHOOK_ID=<paypal-webhook-id>
ALLOWED_ORIGINS=https://<deployment>.vercel.app,http://localhost:8081
```

## Supabase

1. Crear proyecto Supabase.
2. En SQL Editor ejecutar:

```bash
supabase-production-schema.sql
supabase-price-schema.sql
```

3. En Authentication > Providers activar Google.
4. Configurar redirect URL:

```text
https://<deployment>.vercel.app
http://localhost:8081
```

La app migra favoritos y alertas locales a nube al iniciar sesion. Si Supabase no esta configurado, mantiene AsyncStorage.

## PayPal

1. Crear app PayPal REST.
2. Configurar `EXPO_PUBLIC_PAYPAL_CLIENT_ID` para el SDK web.
3. Configurar en Vercel `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`.
4. Configurar `PAYPAL_ENV=live` para produccion real.

El boton usa PayPal JS SDK en web. La orden se crea en `/api/paypal/create-order` y se captura en `/api/paypal/capture-order`; al confirmarse, el backend actualiza `profiles.premium_until` usando service role.

## Tracking

Eventos soportados:

- `search_submitted`
- `cheapest_price_shown`
- `commerce_clicked`
- `premium_started`
- `premium_completed`
- eventos legacy de favoritos, shares y premium click

El flujo intenta backend Supabase. Si falla, guarda localmente en AsyncStorage para no perder la sesion de usuario.

## Deploy Vercel

1. Configurar las variables anteriores en Project Settings > Environment Variables.
2. Ejecutar:

```bash
npm install
npm run test
npm run build
npm run production:check
```

Para exigir monetizacion real antes de deploy:

```bash
npm run production:check -- --strict
```

3. Deploy:

```bash
vercel deploy --prebuilt
vercel deploy --prebuilt --prod
```

Con Git integration, basta pushear a la rama conectada luego de configurar env vars.

## Validacion final

```bash
npm install
npm run test
npm run build
npm run web -- --port 8081
```

Probar:

- Buscar `leche`: multiples comercios, mejor precio y links oficiales.
- Click en comercio: registra `commerce_clicked`.
- Login: Google si Supabase/OAuth esta configurado; demo si no.
- Premium: PayPal real si credenciales existen; demo si no.

## Readiness

El endpoint `/api/v1/readiness` devuelve:

- `mode`: `production` o `demo_or_partial`
- `checks.supabase_server`
- `checks.supabase_public`
- `checks.paypal`
- `checks.google_auth`
- `checks.tracking`
- `checks.local_fallback`

No expone valores secretos. Usarlo como smoke check post-deploy.

## Seguridad

- No poner `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_SECRET`, Postgres URL ni passwords en `EXPO_PUBLIC_*`.
- Los endpoints validan inputs con Zod y usan CORS/origin allowlist.
- RLS queda activa en tablas de usuario.
- La app nunca depende de credenciales para funcionar: si faltan, cae a modo demo/local.
