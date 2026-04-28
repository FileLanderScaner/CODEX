# AhorroYA current state

Fecha de auditoria: 2026-04-27.

## Stack detectado

- Lenguaje predominante: JavaScript.
- App: Expo / React Native / React Native Web.
- Deploy principal documentado: Vercel.
- Backend actual: Vercel Serverless Functions bajo `api/`.
- Datos: Supabase REST y cliente `@supabase/supabase-js`.
- Fallback local: `data/mockPrices.js` + AsyncStorage; queda como modo degradado oficial.
- Package manager: npm, detectado por `package-lock.json`.
- Git: no especificado en el repo; el binario `git` no esta disponible en este entorno.

## Arbol relevante

```text
api/, api/paypal/, api/supabase/, api/v1/
components/, components/home/, components/layout/, components/ui/
data/mockPrices.js
docs/
lib/
screens/
services/
src/services/pricing/
supabase/migrations/
tests/
.github/workflows/
vercel.json
package.json
supabase-schema.sql
supabase-price-schema.sql
```

El repo tambien contiene `stitch/` con pantallas HTML/PNG de referencia visual.

## Scripts package.json

- `start`: `npx expo start`
- `android`: `npx expo start --android`
- `ios`: `npx expo start --ios`
- `web`: `npx expo start --web`
- `build`: `npx expo export --platform web`
- `lint`: lint basico local sin ESLint.
- `typecheck`: validacion sintactica JS.
- `test`, `test:unit`, `test:integration`, `test:contract`, `test:security`, `test:e2e`, `ci`.

## Dependencias actuales

Ver `package.json` y `package-lock.json` como fuente canonica. Las dependencias principales auditadas son Expo `~53.0.10`, React `19.0.0`, React Native `0.79.3`, React Native Web `^0.20.0`, Supabase JS `^2.105.0`, zod `^3.25.76`, csv-parse `^5.6.0`, fast-xml-parser `^5.7.2`, soap `^1.9.1`, pino `^9.14.0`, date-fns `^4.1.0`, vitest `^3.2.4`, supertest `^7.2.2`, msw `^2.13.6`, playwright `^1.59.1` y pdf-parse `^1.1.4`.

## Rutas existentes

Rutas legacy: `/api/prices`, `/api/reports`, `/api/shares`, `/api/me`, `/api/premium-status`, `/api/monetization-event`, `/api/product-click`, `/api/paypal/create-order`, `/api/paypal/capture-order`, `/api/paypal/webhook`.

Rutas nuevas versionadas: `/api/v1/health`, `/api/v1/readiness`, `/api/v1/products`, `/api/v1/products/:id`, `/api/v1/stores`, `/api/v1/categories`, `/api/v1/prices`, `/api/v1/prices/latest`, `/api/v1/prices/history/:productId`, `/api/v1/prices/community`, `/api/v1/alerts`, `/api/v1/favorites`, `/api/v1/reports`, `/api/v1/billing/subscriptions/create`, `/api/v1/billing/webhooks/paypal`, `/api/v1/billing/me`, `/api/v1/admin/jobs`, `/api/v1/admin/retry-job/:id`, `/api/v1/admin/reports`, `/api/v1/admin/approve-price`, `/api/v1/internal/import/:source`.

## Configuracion

- `.babelrc`, `app.json`, `eas.json`, `vercel.json`, `.env.example`.
- Config cliente: `lib/config.js`.
- Config validada server/shared: `lib/env.js`.
- Secrets server-only: `SUPABASE_SERVICE_ROLE_KEY`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `CRON_SHARED_SECRET`, `AFFILIATE_SIGNING_SECRET`.

## Tablas y migraciones encontradas

- Existentes en SQL suelto: `supabase-schema.sql`, `supabase-price-schema.sql`.
- Nueva migracion versionada: `supabase/migrations/202604270001_production_schema.sql`.
- Tablas documentadas mantenidas: `prices`, `shares`, `reports`, `profiles`, `user_favorites`, `price_alerts`, `product_links`, `product_clicks`, `monetization_events`, `premium_orders`.
- Tablas nuevas: `products`, `brands`, `categories`, `stores`, `store_locations`, `countries`, `regions`, `source_feeds`, `source_jobs`, `raw_source_payloads`, `price_observations`, `price_current`, `merchant_accounts`, `merchant_store_access`, `subscriptions`, `referrals`, `api_keys`, `audit_logs`.

## Tests y pipelines

Antes: no especificado en el repo. Ahora: Vitest unit/integration/contract/security, Playwright E2E y GitHub Actions en `.github/workflows/`.

## Riesgos detectados

- El repo real no tenia `git` disponible en el entorno, por lo que no pude producir diff con git.
- Algunas fuentes oficiales requieren URLs de recurso concretas por periodo; se resuelven con variables `*_FEED_URL`.
- El endpoint SIPSA SOAP necesita confirmar metodo WSDL productivo en ambiente real.
- RLS depende de claims de rol en Supabase Auth.
- Expo advierte compatibilidad esperada: `@react-native-async-storage/async-storage` 2.1.2 y `react-native` 0.79.6 para este SDK; el build y E2E pasan con versiones actuales, pero conviene alinear en la proxima iteracion.
- `npm audit --audit-level=high` no falla; existen vulnerabilidades moderadas transitivas en toolchain Expo que `npm audit fix --force` resolveria con downgrade/breaking change, por eso no se aplico automaticamente.
