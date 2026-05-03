# Auditoria completa AhorroYA

Fecha: 2026-05-02.

## Stack detectado

- Frontend: Expo 53, React 19, React Native Web, navegacion web propia en `lib/navigation.js`.
- Backend: Vercel Serverless Functions en `api/[...path].js` con handlers en `server/api`.
- Datos: Supabase via REST y `@supabase/supabase-js`; fallback local con `AsyncStorage` y seeds.
- Pagos: PayPal sandbox/live preparado en backend y componentes web.
- Tests: Vitest unit/integration/security/contract y Playwright E2E.
- Deploy: `vercel.json`, GitHub Actions, Docker, Netlify/AWS/GCP configs historicas.

## Rutas existentes

Frontend principales: `/`, `/app`, `/app/buscar`, `/app/alertas`, `/app/favoritos`, `/app/perfil`, `/app/premium`, `/app/productos/:product`, `/app/qr`, `/app/escanear`, `/app/supermercados`, `/app/configuracion`, `/app/historial`, `/admin/ai-agents`.

API principales: `/api/v1/prices`, `/api/v1/products`, `/api/v1/stores`, `/api/v1/categories`, `/api/v1/catalog/search`, `/api/v1/cart/optimize`, `/api/v1/ai/assistant`, `/api/v1/ai/agents`, `/api/v1/favorites`, `/api/v1/alerts`, `/api/v1/billing/*`, `/api/v1/growth/*`, `/api/v1/internal/import/:source`.

## Funcionalidades implementadas

- Busqueda de productos con seed local, Supabase y catalogos online/fallback links.
- Comparacion de precios, mejor oferta y ahorro estimado.
- Detalle de producto con compartir, WhatsApp, QR y mapa.
- Favoritos, alertas, historial y puntos con persistencia local y sincronizacion cloud cuando hay usuario.
- Autenticacion Supabase y fallback local/demo.
- Premium y PayPal preparados; simulacion/fallback cuando no hay credenciales.
- Tracking de eventos con fallback local.
- Importadores de precios oficiales/CSV y scrapers prudentes.
- Growth/monetizacion API y documentacion previa.
- Nueva capa de agentes IA segura y modular en `lib/ai-agents`.

## Funcionalidades incompletas

- Panel admin completo de produccion: se agrego base bloqueada por `ENABLE_ADMIN_AI_PANEL=false`.
- Memoria persistente de agentes: migracion SQL creada, escritura runtime aun in-memory para no tocar produccion sin credenciales.
- WhatsApp Business API: variables documentadas; hoy hay deep links.
- Observabilidad externa: eventos existen, falta dashboard real y drain/log sink.
- Premium real depende de credenciales PayPal y planes.
- Fuentes reales de supermercados dependen de disponibilidad legal/tecnica de catalogos.

## Bugs detectados

- `lib/runtime-mode.js` usaba `getEnv()` inexistente en `hasSupabaseConfig` y `hasPayPalConfig`.
- README y algunos textos contienen caracteres mojibake por encoding historico.
- `services/premium-service.js` mezcla `isPremium` e `is_premium` en `shouldShowPaywall`.
- `getSavingsSummary` devuelve mock documentado.

## Bugs corregidos

- Se corrigio `lib/runtime-mode.js` para usar `readEnv()`.
- Se agrego `readPublicFlag()` para flags del panel admin.

## Riesgos tecnicos

- `PriceSearchScreen.js` concentra mucha logica de producto, estado, tracking y UI.
- Hay muchas configs de deploy historicas; Vercel parece el target real.
- Fallbacks locales son utiles para demo, pero deben estar claramente marcados en produccion.

## Riesgos de seguridad

- El service role de Supabase solo debe vivir en servidor.
- PayPal real no debe activarse sin webhook id y planes validos.
- Panel de agentes debe permanecer deshabilitado por defecto.
- Falta rate limiting persistente en produccion si Upstash no esta configurado.

## Variables de entorno faltantes para produccion

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_MONTHLY_PLAN_ID`, `PAYPAL_YEARLY_PLAN_ID`, `ALLOWED_ORIGINS`, `CRON_SHARED_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

## Dependencias

No se detecto necesidad de agregar dependencias pesadas. Las dependencias actuales cubren Supabase, PayPal, CSV/XML/PDF, logging, QR, tests y Playwright.

## Estado de produccion, monetizacion y deploy

Estado: cercano a produccion para demo controlada; produccion real requiere credenciales, migraciones aplicadas, variables en Vercel, monitoreo y smoke E2E.

Monetizacion: Premium/PayPal, afiliados, ads y B2B estan preparados, pero pagos reales requieren aprobacion y credenciales.

Deploy: Vercel configurado con build `npm run build` y output `dist`.

## Prioridades

- Critica: validar variables productivas, RLS, PayPal webhooks, CORS y rate limiting.
- Alta: smoke E2E de rutas principales, dashboard de metricas, limpiar encoding.
- Media: separar `PriceSearchScreen.js`, persistir memoria de agentes, mejorar panel admin.
- Baja: unificar documentacion historica y retirar configs de plataformas no usadas si se decide Vercel.
