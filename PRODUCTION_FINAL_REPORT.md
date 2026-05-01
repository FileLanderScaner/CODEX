# AhorroYA - Production Final Audit

Fecha de auditoria: 2026-05-01
Repositorio local: `C:\codex`

## Resultado ejecutivo

Estado: **NO pasa produccion estricta todavia**.

La aplicacion queda usable en modo demo/parcial con fallback local, build web generado y Supabase local detectado. El bloqueo restante no debe resolverse con hardcodeo: faltan variables reales de produccion para PayPal, Google Auth y origenes permitidos.

## Validacion ejecutada

| Comando | Resultado |
| --- | --- |
| `npm run production:check -- --strict` | Falla por configuracion externa faltante |
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | OK: 12 archivos, 31 tests |
| `npm run build` | OK: exporto `dist` |

Nota: durante tests aparece un `ZodError` esperado por un test negativo de rango de fechas invalido. La suite finaliza correctamente.

## Production check estricto

Resultado observado:

```text
OK dist exists
OK vercel.json exists
OK production README exists
OK supabase production schema exists
OK public env has no private secret names
OK local fallback enabled
mode=demo_or_partial
supabase_public=ready
supabase_server=ready
paypal=missing
google_auth=missing
allowed_origins=missing
FAIL strict production readiness requires Supabase public/server, PayPal server credentials, and ALLOWED_ORIGINS
```

## Bloqueos externos pendientes

Configurar en Vercel, no en archivos versionados:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `EXPO_PUBLIC_PAYPAL_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `ALLOWED_ORIGINS`

`ALLOWED_ORIGINS` debe incluir el dominio final de Vercel y cualquier dominio propio productivo, separados por coma.

## Supabase

Estado local detectado:

- Supabase publico: listo.
- Supabase server/service role: listo localmente.
- `supabase-production-schema.sql` existe.
- Tablas cubiertas por schema: `profiles`, `user_favorites`, `price_alerts`, `search_events`, `price_events`, `monetization_events`, `premium_orders`.
- RLS basica incluida en schema.

Pendiente fuera del codigo:

- Aplicar `supabase-production-schema.sql` en el proyecto Supabase productivo.
- Configurar Google como provider en Supabase Auth.
- Confirmar URL de callback autorizada en Supabase y Google Cloud.

## Secretos y service role

Verificacion:

- No se detectaron secretos reales en archivos versionados.
- `.env.local` y `.env.server.local` no deben versionarse.
- La clave `SUPABASE_SERVICE_ROLE_KEY` aparece en backend/serverless, scripts de check, tests con placeholders y documentacion.
- No se detecto uso de service role en pantallas ni componentes Expo.

Archivos backend/serverless que usan service role de forma esperada:

- `server/api/supabase/_utils.js`
- `server/api/v1/_utils.js`
- `server/api/paypal/_utils.js`
- `src/services/pricing/persistence.js`

## PayPal real

Verificado en codigo:

- Frontend web usa el flujo canonico `createOrder` -> `/api/paypal/create-order`.
- Captura usa `/api/paypal/capture-order`.
- `capture-order` valida usuario por bearer token y compara `custom_id`.
- `updatePremiumProfile` actualiza `premium_until`, `is_premium`, `plan` y datos PayPal.
- Webhook canonico `/api/paypal/webhook` verifica firma con `PAYPAL_WEBHOOK_ID`.
- Ruta `/api/v1/billing/webhooks/paypal` reusa el webhook canonico.

Correccion aplicada en esta auditoria:

- `components/PayPalButtons.web.js` ahora reexporta el componente canonico `PayPalButtons.js`, evitando que Expo Web use el flujo viejo de suscripciones.

Pendiente fuera del codigo:

- Crear app PayPal live.
- Configurar `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` y `PAYPAL_WEBHOOK_ID` en Vercel.
- Registrar webhook live apuntando a `/api/paypal/webhook`.
- Probar pago real de bajo monto y verificar `premium_until` en Supabase.

## Google Auth

Verificado en codigo:

- La UI usa Google solo si hay Supabase y Google configurado.
- Si Google no esta configurado, mantiene fallback demo local.
- No se hardcodea client secret en frontend.

Correccion aplicada en esta auditoria:

- `components/AuthPanel.js` dejo de ofrecer Facebook como si fuera produccion y quedo alineado a Google real o modo demo.

Pendiente fuera del codigo:

- Crear OAuth client en Google Cloud.
- Configurar `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` y `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.
- Activar provider Google en Supabase.
- Agregar redirect URLs de Supabase/Vercel.

## ALLOWED_ORIGINS

Verificado en codigo:

- APIs serverless aplican CORS/origin checks con `ALLOWED_ORIGINS`.
- PayPal serverless tambien usa `ALLOWED_ORIGINS`.
- Readiness reporta `open_or_missing` cuando falta.

Pendiente fuera del codigo:

- Configurar `ALLOWED_ORIGINS` en Vercel con el dominio real de produccion.

## Fallback local

Estado: OK.

No se elimino ni desactivo fallback local. El proyecto sigue funcionando sin credenciales completas en modo demo/parcial.

## Decision final

AhorroYA queda listo para deploy demo/parcial y preparado para produccion real. La produccion estricta queda bloqueada exclusivamente por configuracion externa faltante. No se deben inventar credenciales ni commitear secretos para forzar el check.

Para cerrar produccion estricta:

1. Configurar variables reales en Vercel.
2. Aplicar schema Supabase en produccion.
3. Activar Google provider en Supabase.
4. Configurar PayPal live webhook.
5. Re-ejecutar `npm run production:check -- --strict`.
