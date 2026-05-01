# PRODUCTION GITHUB AUDIT

## 1. Estado general

Parcial. El proyecto tiene una arquitectura bien definida para Vercel + Supabase + PayPal, pero hay problemas de configuración y de código que deben resolverse antes de un deploy confiable.

## 2. Qué funciona correctamente

- `package.json` define `npm run build` como `npx expo export --platform web` y `vercel.json` apunta a `dist` con rewrites SPA.
- El frontend usa Expo Web / React Native Web y tiene fallback local para usuarios, alertas y datos.
- El backend está organizado en `api/[...path].js` y en `server/api/v1/` con rutas versionadas.
- PayPal está implementado con flujo de suscripción en `components/PayPalButtons.web.js` y backend serverless en `server/api/v1/billing/subscriptions/create.js`.
- Supabase se usa con `@supabase/supabase-js` y el cliente web se construye en `lib/supabase.js`.
- El servicio de metabuscador está implementado en `services/catalog-service.js` con timeout, fallback JSON-LD y enlaces a tiendas.
- El repositorio no contiene credenciales sensibles obvias como valores reales de `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_SECRET`, `POSTGRES_URL`, etc.

## 3. Qué depende de variables externas

- Ejecución del backend serverless y escritura en Supabase depende de:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ALLOWED_ORIGINS`
- PayPal real depende de:
  - `PAYPAL_ENV`
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`
  - `PAYPAL_WEBHOOK_ID`
  - `PAYPAL_MONTHLY_PLAN_ID`
  - `PAYPAL_YEARLY_PLAN_ID`
- Flujo frontend real depende de:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_API_BASE_URL` o el mismo host relativo
  - `EXPO_PUBLIC_APP_URL`
  - `EXPO_PUBLIC_PAYPAL_CLIENT_ID`
- Google/Facebook login depende de configuración externa en Supabase Auth providers. No hay client secretos de Google cargados en el repo.

## 4. Lista EXACTA de variables faltantes

### Variables públicas faltantes o no alineadas con el código

- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` no aparece en el código ni en `.env.example`.

### Variables privadas/no documentadas faltantes en el repo

- `GOOGLE_OAUTH_CLIENT_ID` no aparece en el código.
- `GOOGLE_OAUTH_CLIENT_SECRET` no aparece en el código.
- `APP_URL` es usado en el backend PayPal como `return_url`/`cancel_url` pero no está documentado en `.env.example`.

### Variables necesarias para producción que no están en la lista de la petición pero sí en el código

- `PAYPAL_MONTHLY_PLAN_ID`
- `PAYPAL_YEARLY_PLAN_ID`

### Variables opcionales de soporte y seguridad que deben estar documentadas

- `CRON_SHARED_SECRET` (usado en cron/internal auth)
- `AFFILIATE_SIGNING_SECRET` (usado por el esquema de env)
- `FEATURE_FLAGS` (usado por `lib/env.js`)

## 5. Problemas de seguridad

- No hay credenciales reales encontradas en el repo. Solo hay placeholders en `.env.example`.
- `.gitignore` excluye `.env`, `.env.local` y `.vercel`, lo cual está bien.
- El archivo `dist/` está presente en el repo a pesar de estar en `.gitignore`; esto sugiere artefactos generados comprometidos en el control de versiones.
- `vercel.json` usa `Content-Security-Policy` con `'unsafe-inline'` para script y style, necesario para PayPal, pero sigue siendo un punto de seguridad que debe validarse.
- Si `ALLOWED_ORIGINS` no se configura, algunas rutas PayPal devuelven `Access-Control-Allow-Origin: *`, lo que es demasiado permisivo.

## 6. Problemas de arquitectura

- El proyecto no tiene `README_PRODUCTION.md`; existe `README_VERCEL.md` y `README_SUPABASE.md` pero no el archivo esperado por el pedido.
- El repo usa múltiples esquemas SQL: `supabase-schema.sql`, `supabase-price-schema.sql` y migraciones en `supabase/migrations/`. Esto es una fuente de ambigüedad.
- No existe un archivo `supabase-production-schema.sql` en la raíz.
- El código y la documentación no están perfectamente alineados: `README_SUPABASE.md` recomienda ejecutar `supabase-price-schema.sql`, pero la migración real de producción está en `supabase/migrations/202604270001_production_schema.sql`.
- Hay una mezcla de rutas legacy y versionadas (`/api/paypal/*` vs `/api/v1/billing/*`), lo que genera complejidad operativa.

## 7. Problemas de UX detectables por código

- El frontend muestra PayPal sólo si `EXPO_PUBLIC_PAYPAL_CLIENT_ID` está presente. Si la configuración pública existe pero el servidor no tiene secret, el pago fallará en la creación de suscripción.
- El flujo de login muestra botones de Google/ Facebook si hay configuración Supabase, pero el repositorio no documenta ningún cliente Google explícito.
- El metabuscador depende de scraping y JSON-LD. Si cambia el HTML de Disco/Devoto/Ta-Ta/Tienda Inglesa, es probable que la búsqueda falle y sólo quede el link directo.
- No existe caché de resultados de metabuscador en el backend; cada búsqueda puede disparar varios fetch externos sin persistencia.

## 8. Estado de Supabase

- El proyecto está preparado para Supabase con tablas principales definidas y uso de RLS.
- El código usa estas tablas:
  - `profiles`
  - `user_favorites`
  - `price_alerts`
  - `monetization_events`
  - `premium_orders`
  - `prices`
  - `shares`
  - `reports`
  - `product_links`
  - `product_clicks`
  - `subscriptions`
- El esquema solicitado por el repo (`search_events`, `price_events`, `commerce_search_results`) no existe en el código ni en los archivos SQL revisados.
- El esquema de producción actual disponible es `supabase/migrations/202604270001_production_schema.sql` y el repo incluye un conjunto de migraciones posteriores.
- Si el schema no está aplicado en Supabase remota, debe ejecutarse manualmente desde el SQL Editor o el pipeline de migraciones; no hay despliegue automático en Vercel para esto.

## 9. Estado de PayPal

- PayPal está implementado con flujo de suscripción en `server/api/v1/billing/subscriptions/create.js` y `components/PayPalButtons.web.js`.
- El backend legacy de PayPal aún existe en `server/api/paypal/*`.
- Se verifica la firma de webhook con `PAYPAL_WEBHOOK_ID`.
- El modo sandbox/live depende correctamente de `PAYPAL_ENV`.
- El flujo real requiere:
  - `PAYPAL_CLIENT_ID`
  - `PAYPAL_CLIENT_SECRET`
  - `PAYPAL_WEBHOOK_ID`
  - `PAYPAL_MONTHLY_PLAN_ID`
  - `PAYPAL_YEARLY_PLAN_ID`
- Si `EXPO_PUBLIC_PAYPAL_CLIENT_ID` está ausente, el front-end no carga PayPal y queda en modo demo.

## 10. Estado de Google Auth

- El front-end invoca `supabase.auth.signInWithOAuth()` para providers `google` y `facebook`.
- No hay variables `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_ID` o `GOOGLE_OAUTH_CLIENT_SECRET` usadas en el código.
- Esto indica que Google Auth depende de la configuración del proveedor OAuth en Supabase console, no de variables locales en el repo.
- En este repo, Google Auth está mutable: se activará si Supabase Auth tiene habilitado el provider Google y la app usa el host de redirección correcto.

## 11. Estado de Vercel (deploy readiness)

- `vercel.json` está configurado para SPA y `dist`.
- `npm run build` es el build command correcto para Expo Web export.
- Rutas serverless en `api/[...path].js` están definidas.
- ⚠️ Bloqueador probable: el proyecto no declara `"type": "module"` en `package.json`, pero las funciones de `api/` y `server/api/` usan sintaxis ESM (`import` / `export`). Esto puede impedir que los serverless functions de Vercel arranquen.
- ⚠️ Otro problema de código: `lib/runtime-mode.js` importa `getEnv` desde `./env`, pero `lib/env.js` exporta `readEnv` y no `getEnv`. Esto causará error de bundling o de ejecución cuando se use `AuthPanel` o `analytics-service`.

## 12. Próximos pasos exactos

1. Agregar `"type": "module"` a `package.json` o convertir las funciones server a CommonJS. Esto es el primer bloqueo para Vercel.
2. Corregir `lib/runtime-mode.js` para usar `readEnv()` o exportar `getEnv` desde `lib/env.js`.
3. Actualizar `.env.example` y documentación con:
   - `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (si se quiere documentar el login social en el app client)
   - `APP_URL` para PayPal `return_url`/`cancel_url`
   - `CRON_SHARED_SECRET`
   - `AFFILIATE_SIGNING_SECRET`
   - `FEATURE_FLAGS`
4. Confirmar y documentar qué SQL se debe aplicar en Supabase. Reemplazar la referencia a `supabase-production-schema.sql` con `supabase/migrations/202604270001_production_schema.sql` y/o `supabase-price-schema.sql` según corresponda.
5. Validar en Vercel que `ALLOWED_ORIGINS` contenga el dominio real de producción y que no use comodines.
6. Validar que la configuración PayPal incluya también `PAYPAL_MONTHLY_PLAN_ID` y `PAYPAL_YEARLY_PLAN_ID`.
7. Ajustar docs para producción: crear `README_PRODUCTION.md` o unificar `README_VERCEL.md` + `README_SUPABASE.md` con los pasos de deploy reales.
8. Limpiar el repo de artefactos comprometidos si `dist/` no debe estar versionado.

## Conclusiones finales

- Deploy en Vercel: parcial; la configuración está casi lista, pero hay un bloqueo técnico con ESM y un bug de importación.
- Usuarios reales: puede funcionar si Supabase y PayPal se configuran correctamente.
- Pagos reales: sí, el flujo de PayPal subscriptions está implementado, pero necesita las variables y IDs de plan correctos.
- Base de datos real: sí, el proyecto está diseñado para Supabase; requiere aplicar el schema/migraciones y usar `SUPABASE_SERVICE_ROLE_KEY`.

> Nota: No se hicieron cambios en el código. El informe identifica errores y ausencias que deben corregirse antes de un deploy de producción confiable.
