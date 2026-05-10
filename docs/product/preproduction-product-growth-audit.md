# AhorroYA Preproduction Product and Growth Audit

Fecha: 2026-05-10

## Estado ejecutivo

`PRODUCT_PREPROD_STATUS=READY_WITH_BACKLOG`

La app tiene flujo funcional de preproduccion para:

- Landing publica.
- Busqueda de productos.
- Comparacion de precios.
- Detalle de producto.
- Favoritos.
- Alertas.
- Perfil.
- Paywall Premium.
- PayPal sandbox.
- Tracking de eventos de crecimiento.

Produccion comercial sigue bloqueada por dependencias externas:

- PayPal live.
- Google OAuth production.
- Vercel Production env real.
- Backup/revert production real.
- Supabase Auth production dashboard evidence.

## Cobertura funcional observada

| Area | Estado | Evidencia |
|---|---|---|
| Landing | Lista para staging | `screens/LandingScreen.js` carga precios, metricas y CTA |
| Busqueda | Lista para staging | `screens/PriceSearchScreen.js` resuelve intent, fuentes locales/catalogos y tracking |
| Comparacion | Lista para staging | `screens/ResultsScreen.js` muestra mejor precio, diferencia, comercios y links |
| Producto detalle | Lista para staging | `screens/ProductDetailScreen.js` integrado por ruta `/app/productos/:product` |
| Favoritos | Lista para staging | Local/cloud sync en `favorites-service` y account service |
| Alertas | Lista para staging | Local/cloud alert flow y RLS validado |
| Premium | Sandbox listo | `screens/PaywallScreen.js`, `PayPalButtons`, billing endpoints |
| PayPal live | Bloqueado | Requiere credenciales live, webhook live y prueba controlada |
| Tracking growth | Listo para staging | `services/tracking-service.js`, endpoints monetization/growth |
| AI | Seguro por defecto | Gateway/agentes apagados por flags |

## Hallazgos priorizados

### P0 - Bloqueos para cobrar dinero real

1. Completar PayPal live:
   - `PAYPAL_ENV=live`
   - live client id
   - live client secret
   - live webhook id
   - live plan ids
   - webhook URL production
   - prueba de firma y suscripcion controlada

2. Completar Google OAuth production:
   - OAuth client production
   - redirect URIs production
   - Supabase Auth provider production
   - prueba login/signup en dominio production

3. Completar env production:
   - Vercel Production env real
   - `ALLOWED_ORIGINS` production
   - `APP_URL` production
   - Supabase production public/server vars

### P1 - Producto antes de beta publica

1. Validacion browser E2E ampliada:
   - home -> buscar -> resultados -> detalle -> favorito -> alerta.
   - paywall sandbox con usuario staging.
   - responsive mobile real.

2. Estados de error comerciales:
   - PayPal sandbox unavailable.
   - Supabase unavailable.
   - catalogos externos timeout.
   - usuario sin sesion intentando premium.

3. Confianza de datos:
   - mostrar timestamp/fuente por precio.
   - distinguir precio real, catalogo online y link oficial.
   - explicar fallback cuando no hay precio legible.

### P2 - Growth y activacion

1. Onboarding de 30 segundos:
   - query sugerida visible.
   - primera busqueda guiada.
   - feedback inmediato del ahorro.

2. Loop viral:
   - WhatsApp share ya existe; falta medir conversion por `utm_campaign` en dashboard operativo.
   - QR/share link deberia tener estado de copia exitoso no intrusivo.

3. Retencion:
   - alertas post-busqueda como CTA principal despues de detectar ahorro.
   - email/push queda fuera del repo hasta proveedor real.

### P3 - Monetizacion B2B/ads/afiliados

1. Ads:
   - `AdBanner` existe; requiere politica comercial y proveedor.
   - No activar ads production sin privacy/legal review.

2. Afiliados:
   - `ProductLinks` y tracking de commerce click existen.
   - Falta proveedor de afiliados real y reglas de disclosure.

3. Datos B2B:
   - Growth metrics existen.
   - Falta contrato, agregacion anonimizada y politica de privacidad.

## Recomendacion release

- Staging/preproduccion: continuar.
- Produccion monetizada: `NO-GO_PRODUCTION`.
- Siguiente avance seguro: ampliar E2E browser local/staging y/o preparar runbook de beta cerrada sin pagos live.

## Confirmaciones

- No se activo PayPal live.
- No se ejecutaron pagos reales.
- No se activo AI Gateway.
- No se activaron agentes IA.
- No se tocaron envs Production.
- No se uso `--prod`.
