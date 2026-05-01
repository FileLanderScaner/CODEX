# PROJECT AUDIT AHORROYA - 2026-05-01

## Stack Real

Base deployable actual: Expo SDK 53 + React Native Web + Vercel static export + Vercel serverless functions.
Backend: funciones en `api/[...path].js` que enrutan a `server/api/**`.
DB elegida: Supabase/Postgres con migraciones en `supabase/migrations`.
Auth: Supabase Auth en cliente y validación Bearer en backend.
Pagos: PayPal server-side para subscriptions, con planes por env vars.
Datos: seed local, catálogo online VTEX/HTML, fuentes oficiales LATAM en `src/services/pricing/adapters`.

## Zip Recibido

El zip de Descargas es una app Vite/Firebase/Express con ideas útiles: PayPal UI, Twilio WhatsApp, cron, scraping y Gemini. No se adoptó Firebase porque el repo productivo ya usa Supabase y mezclar DBs agrega deuda. Se integraron las ideas como servicios/endpoints Supabase-compatible.

## Estado

Funcionando:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Rutas principales `/app`, `/app/buscar`, `/app/alertas`, `/app/favoritos`, `/app/perfil`.
- Health/readiness, búsqueda catálogo, favoritos, alertas, PayPal, growth metrics.

Parcial:
- Scraping real por tiendas: existe catálogo online y adapters oficiales, pero algunos comercios solo tienen fallback a link oficial por cambios/ToS.
- PayPal: código real, requiere credenciales y plan IDs.
- Premium: backend real, UX parcial.
- B2B dashboard: endpoint agregado, falta pantalla admin dedicada.

Demo/mock/fallback:
- Seed local de precios Montevideo como fallback.
- IA funciona con OpenAI/Gemini si hay claves; sin claves usa motor de reglas local documentado.
- WhatsApp outbound preparado por env/Twilio, no se envía sin credenciales.

Roto/faltante detectado:
- Endpoint viejo `server/api/v1/savings.js` usa imports incompatibles; la nueva migración agrega tablas/RPC, pero conviene reemplazarlo por `_utils.requireUser` antes de activarlo por ruta.
- Algunas políticas antiguas usan `current_app_role()` con fallback a `user_metadata`; debe endurecerse a `app_metadata`.
- No hay pantalla nativa completa para carrito/IA/B2B, aunque endpoints y servicios están listos.

## Deuda Técnica

Consolidar endpoints legacy `/api/*` vs `/api/v1/*`.
Reducir duplicación de monetización entre `server/api/_monetization.js`, `monetization_events` y nuevos eventos.
Agregar tests contract para `/api/v1/search/smart`, `/api/v1/cart/optimize`, `/api/v1/ai/assistant`.
Mover secrets reales fuera de `.env.local` antes de subir a GitHub si contienen valores productivos.
